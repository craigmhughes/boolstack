import type { RegistryApp } from "./registry-types";

// Registry is baked at build time into static files under /registry/.
export async function fetchRegistryApps(signal?: AbortSignal): Promise<RegistryApp[]> {
  const res = await fetch("/registry/index.json", { signal });
  if (!res.ok) throw new Error(`Could not load the app registry (HTTP ${res.status})`);
  const data = (await res.json()) as { apps?: RegistryApp[] };
  return data.apps ?? [];
}

export async function fetchRegistryHtml(slug: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`/registry/${encodeURIComponent(slug)}.html`, { signal });
  if (!res.ok) throw new Error(`Could not load registry app "${slug}" (HTTP ${res.status})`);
  return res.text();
}
