// SERVER-ONLY: uses node:fs. Never import this from client components
// (the 'server-only' package is not installed, so this is by convention).
import { promises as fs } from "node:fs";
import path from "node:path";
import type { RegistryApp } from "./registry-types";

const FILE_RE = /^[a-z0-9][a-z0-9_-]*\.html$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const PALETTE = [
  "#ff5003", "#e11d48", "#db2777", "#c026d3", "#7c3aed", "#4f46e5",
  "#2563eb", "#0284c7", "#0891b2", "#0d9488", "#16a34a", "#65a30d",
  "#ca8a04", "#ea580c",
];

function registryDir(): string {
  return path.join(process.cwd(), "registry");
}

function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h * 33) ^ slug.charCodeAt(i)) >>> 0;
  return h;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function humanise(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const inner = tag.replace(/^<\s*meta/i, "").replace(/\/?>$/, "");
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const key = m[1].toLowerCase();
    if (!(key in attrs)) attrs[key] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

function clampInt(raw: string | undefined, min: number, max: number): number {
  const n = Number.parseInt((raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function parseMeta(html: string, slug: string, size: number): RegistryApp {
  const head = /<\/head\s*>/i.exec(html);
  const scope = head ? html.slice(0, head.index) : html.slice(0, 20000);
  const meta: Record<string, string> = {};
  for (const tag of scope.match(/<meta\b[^>]*>/gi) ?? []) {
    const a = parseAttrs(tag);
    const key = (a.name ?? a.property ?? "").trim().toLowerCase();
    if (key && a.content !== undefined && !(key in meta)) {
      meta[key] = decodeEntities(a.content).trim();
    }
  }
  const title = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(scope);
  const name = (title ? decodeEntities(title[1]).trim() : "") || humanise(slug) || slug;
  const color = COLOR_RE.test(meta["boolstack:color"] ?? "")
    ? meta["boolstack:color"]
    : PALETTE[hashSlug(slug) % PALETTE.length];
  return {
    slug,
    name,
    description: meta["description"] ?? "",
    icon: meta["boolstack:icon"] || "IconApps",
    color,
    variant: clampInt(meta["boolstack:variant"], 1, 8),
    mobile_variant: clampInt(meta["boolstack:mobile-variant"], 1, 6),
    size,
  };
}

export async function listRegistryApps(): Promise<RegistryApp[]> {
  const dir = registryDir();
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const apps = await Promise.all(
    entries
      .filter((f) => FILE_RE.test(f))
      .map(async (f): Promise<RegistryApp | null> => {
        try {
          const full = path.join(dir, f);
          const stat = await fs.stat(full);
          if (!stat.isFile()) return null;
          const html = await fs.readFile(full, "utf8");
          return parseMeta(html, f.replace(/\.html$/i, ""), stat.size);
        } catch {
          return null;
        }
      }),
  );
  return apps
    .filter((a): a is RegistryApp => a !== null)
    .sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
}

export async function readRegistryHtml(slug: string): Promise<string | null> {
  if (!SLUG_RE.test(slug)) return null;
  const dir = path.resolve(registryDir());
  const full = path.resolve(dir, `${slug}.html`);
  if (path.dirname(full) !== dir) return null;
  try {
    return await fs.readFile(full, "utf8");
  } catch {
    return null;
  }
}
