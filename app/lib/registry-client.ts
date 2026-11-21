import type { RegistryApp } from "./registry-types";

async function failure(res: Response, what: string): Promise<Error> {
  let detail = "";
  try {
    const body = (await res.json()) as { error?: string };
    detail = body.error ? `: ${body.error}` : "";
  } catch {
    /* ignore */
  }
  return new Error(`Could not load ${what} (HTTP ${res.status}${detail})`);
}

export async function fetchRegistryApps(signal?: AbortSignal): Promise<RegistryApp[]> {
  const res = await fetch("/api/registry", { signal, cache: "no-store" });
  if (!res.ok) throw await failure(res, "the app registry");
  const data = (await res.json()) as { apps?: RegistryApp[] };
  return data.apps ?? [];
}

export async function fetchRegistryHtml(slug: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`/api/registry/${encodeURIComponent(slug)}`, { signal, cache: "no-store" });
  if (!res.ok) throw await failure(res, `registry app "${slug}"`);
  return res.text();
}
