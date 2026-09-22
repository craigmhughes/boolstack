'use client';

import { useEffect } from "react";
import { useDatabase } from "./ClientDatabaseGateway";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { Artifact } from "../lib/types";

/**
 * List view for all stored artifacts.
 * Fetches and displays all artifacts from the local database.
 * @returns A React component displaying the list of artifacts.
 */
export function ArtifactList() {
  const db = useDatabase();

  // Get DB Size
  useEffect(() => {
    db.query<{ bytes: number }>(`
      SELECT pg_database_size(current_database()) AS bytes
    `).then(({ rows }) => {
      console.log("Database size:", (rows[0]?.bytes / (1024 * 1024)).toFixed(2), "MB")
    })
  }, [db])

  const result = useLiveQuery<Artifact>(`
    SELECT
      namespace,
      htmlfile,
      icon
    FROM artifacts
    ORDER BY namespace
  `);

  useEffect(() => {
    console.log(result);
  }, [result]);

  if (!result) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {result.rows.map((artifact) => (
        <div key={artifact.namespace}>
          {artifact.icon} {artifact.namespace}
        </div>
      ))}
    </div>
  );
}