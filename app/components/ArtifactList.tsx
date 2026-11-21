'use client';

import { useContext, useEffect } from "react";
import { useGateway } from "./ClientDatabaseGateway";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { Artifact } from "../lib/types";
import { ArtifactViewContext } from "./ArtifactView";
import { scheduleBackup } from "../lib/db";
import { deleteArtifact as removeArtifact } from "../lib/artifacts";
import { ArtifactIcon } from "./IconPicker";
import { FeatureCard } from "./feature-card";

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
      icon,
      variant,
      color,
      description
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
    removeArtifact(db, namespace).then(() => {
      scheduleBackup(db);
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4">
        {result.rows.map((artifact) => (
          <FeatureCard
            key={artifact.namespace}
            title={artifact.namespace}
            description={artifact.namespace}
            icon={artifact.icon}
            variant={artifact.variant}
            color={artifact.color}
            onClick={() => setActiveArtifact(artifact)}
            onDelete={async () => {
              const shouldDelete = await confirm(`Are you sure you want to delete artifact: ${artifact.namespace}?`);
              shouldDelete && deleteArtifact(artifact.namespace);
            }}
          />
        ))}
        {new Array(8).fill(null).map((_, index) => (
          <FeatureCard
            key={index}
            title={`Feature Card ${index + 1}`}
            description="Feature Card Description"
            icon="star"
            variant={index + 1}
            onClick={() => console.log(`Feature Card ${index + 1} clicked`)}
            onDelete={async () => {}}
          />
        ))}
        
      </div>
      
    </div>
  );
}