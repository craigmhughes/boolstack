import { PGliteWithLive } from "@electric-sql/pglite/live"
import { Artifact, ArtifactTheme } from "./types";
import { injectStorageProxy } from "./storage-bridge";

/**
 * Retrieves the HTML file URL of an artifact by its namespace.
 *
 * @param db - The database instance to query.
 * @param namespace - The namespace of the artifact to retrieve.
 */
export async function getArtifactUrlByNamespace(
  db: PGliteWithLive,
  namespace: string,
  transform: (html: string) => string = (html) => injectStorageProxy(html, namespace),
) {
  const result = await db.query<Artifact>(
    "SELECT HtmlFile FROM artifacts WHERE Namespace = $1",
    [namespace],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(`Artifact not found for namespace: ${namespace}`);
  }

  const blob = new Blob([transform(row.htmlfile)], { type: "text/html;charset=utf-8" })
  return URL.createObjectURL(blob);
}

/**
 * Prefix used for an artifact's localStorage keys.
 */
export function artifactStoragePrefix(namespace: string): string {
  return `__bs_${encodeURIComponent(namespace)}_`;
}

/**
 * Inserts a new artifact. A duplicate namespace error propagates; use
 * `isDuplicateNamespaceError` to detect it.
 */
export async function insertArtifact(
  db: PGliteWithLive,
  input: { namespace: string; htmlfile: string } & ArtifactTheme,
): Promise<void> {
  await db.query(
    "INSERT INTO artifacts (Namespace, HtmlFile, Icon, Variant, Color, Description) VALUES ($1, $2, $3, $4, $5, $6)",
    [input.namespace, input.htmlfile, input.icon, input.variant, input.color, input.description],
  );
}

export function isDuplicateNamespaceError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }
  const e = err as { code?: unknown; message?: unknown };
  return (
    e.code === "23505" ||
    (typeof e.message === "string" && e.message.includes("duplicate key"))
  );
}

/**
 * Updates an artifact's theme, and its html file only when provided.
 */
export async function updateArtifact(
  db: PGliteWithLive,
  namespace: string,
  theme: ArtifactTheme,
  htmlfile?: string,
): Promise<void> {
  if (htmlfile !== undefined) {
    await db.query(
      "UPDATE artifacts SET Icon = $2, Variant = $3, Color = $4, Description = $5, HtmlFile = $6 WHERE Namespace = $1",
      [namespace, theme.icon, theme.variant, theme.color, theme.description, htmlfile],
    );
  } else {
    await db.query(
      "UPDATE artifacts SET Icon = $2, Variant = $3, Color = $4, Description = $5 WHERE Namespace = $1",
      [namespace, theme.icon, theme.variant, theme.color, theme.description],
    );
  }
}

/**
 * Deletes an artifact and all of its namespaced local storage rows.
 */
export async function deleteArtifact(db: PGliteWithLive, namespace: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.query("DELETE FROM namespaced_local_storage WHERE Namespace = $1", [namespace]);
    await tx.query("DELETE FROM artifacts WHERE Namespace = $1", [namespace]);
  });
}
