import { readRegistryHtml } from "@/app/lib/registry";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const html = await readRegistryHtml(slug);
  if (html === null) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
