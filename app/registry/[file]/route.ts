import { listRegistryApps, readRegistryHtml } from "@/app/lib/registry";

// One static file per registry app: out/registry/<slug>.html (static export).
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const apps = await listRegistryApps();
  return apps.map((app) => ({ file: `${app.slug}.html` }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const slug = file.replace(/\.html$/i, "");
  const html = await readRegistryHtml(slug);
  if (html === null) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
