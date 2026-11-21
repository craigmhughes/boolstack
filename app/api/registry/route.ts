import { listRegistryApps } from "@/app/lib/registry";

// Always read the registry directory at request time.
export const dynamic = "force-dynamic";

export async function GET() {
  const apps = await listRegistryApps();
  return Response.json({ apps }, { headers: { "Cache-Control": "no-store" } });
}
