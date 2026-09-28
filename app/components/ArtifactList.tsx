'use client';

import { useContext, useEffect } from "react";
import { useGateway } from "./ClientDatabaseGateway";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { Artifact } from "../lib/types";
import { Button } from "@/components/ui/button";
import { ArtifactViewContext } from "./ArtifactView";
import { backup } from "../lib/db";

/**
 * List view for all stored artifacts.
 * Fetches and displays all artifacts from the local database.
 * @returns A React component displaying the list of artifacts.
 */
export function ArtifactList() {
  const { db } = useGateway();
  const { setActiveArtifact } = useContext(ArtifactViewContext);

  // Get DB Size
  useEffect(() => {
    if (!db) {
      return;
    }
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
    // console.log(result);
  }, [result]);

  if (!result) {
    return <div>Loading...</div>;
  }

  const deleteArtifact = (namespace: string) => {
    if (!db) {
      return;
    }
    db.query(`
      DELETE FROM artifacts 
      WHERE namespace = $1
    `, [namespace]).then(() => {
      backup(db);
    });
  };

  return (
    <div>
      {result.rows.map((artifact) => (
        <div key={artifact.namespace}>
          <p>{artifact.icon} {artifact.namespace}</p>
          <Button
            type="button"
            onClick={() => setActiveArtifact(artifact)}
          >
            View Artifact
          </Button>
          <Button
            type="button"
            onClick={async () => {
              const shouldDelete = await confirm(`Are you sure you want to delete artifact: ${artifact.namespace}?`);
              shouldDelete && deleteArtifact(artifact.namespace);
            }}
          >
            Delete Artifact
          </Button>
        </div>
      ))}
    </div>
  );
}