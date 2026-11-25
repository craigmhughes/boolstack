import { listRegistryApps } from "@/app/lib/registry";

// Rendered once at build time into out/registry/index.json (static export).
export const dynamic = "force-static";

export async function GET() {
  const apps = await listRegistryApps();
  return Response.json({ apps });
}
