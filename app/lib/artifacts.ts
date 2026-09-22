import { PGliteWithLive } from "@electric-sql/pglite/live"

/**
 * Retrieves the HTML file URL of an artifact by its namespace.
 * 
 * @param db - The database instance to query.
 * @param namespace - The namespace of the artifact to retrieve.
 */
export async  function getArtifactUrlByNamespace(db: PGliteWithLive, namespace: string) {
  const result = await db.query<{ HtmlFile: string }>(
    "SELECT HtmlFile FROM artifacts WHERE Namespace = $1",
    [namespace],
  )

  const html = result.rows[0].HtmlFile
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob);

  return url;
}