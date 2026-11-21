'use client';

import { useContext, useState } from "react";
import { useGateway } from "./ClientDatabaseGateway";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { Artifact } from "../lib/types";
import { ArtifactViewContext } from "./ArtifactView";
import { ArtifactEdit } from "./ArtifactEdit";
import { scheduleBackup } from "../lib/db";
import { deleteArtifact, artifactStoragePrefix } from "../lib/artifacts";
import { FeatureCard } from "./feature-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { IconApps } from "@tabler/icons-react";

/**
 * List view for all stored artifacts, laid out as a CSS-columns masonry grid.
 */
export function ArtifactList({ onCreate }: { onCreate?: () => void }) {
  const { db } = useGateway();
  const { setActiveArtifact } = useContext(ArtifactViewContext);
  const [editing, setEditing] = useState<Artifact | null>(null);
  const [deleting, setDeleting] = useState<Artifact | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  const confirmDelete = async () => {
    if (!db || !deleting) {
      return;
    }
    const ns = deleting.namespace;
    setDeleteBusy(true);
    try {
      await deleteArtifact(db, ns);
      try {
        const prefix = artifactStoragePrefix(ns);
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        // localStorage unavailable; nothing to clean up
      }
      scheduleBackup(db);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!result) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-4 break-inside-avoid h-56 w-full animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const count = result.rows.length;

  return (
    <div>
      {count === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconApps />
            </EmptyMedia>
            <EmptyTitle>No apps yet</EmptyTitle>
            <EmptyDescription>
              Upload a self-contained HTML file to add your first app.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => onCreate?.()}>Add app</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            {count} {count === 1 ? "app" : "apps"}
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4">
            {result.rows.map((artifact) => (
              <div key={artifact.namespace} className="mb-4 break-inside-avoid">
                <FeatureCard
                  className="w-full"
                  title={artifact.namespace}
                  description={artifact.description}
                  icon={artifact.icon}
                  variant={artifact.variant}
                  color={artifact.color}
                  onClick={() => setActiveArtifact(artifact)}
                  onEdit={() => setEditing(artifact)}
                  onDelete={() => setDeleting(artifact)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <ArtifactEdit
              key={editing.namespace}
              artifact={editing}
              onSaved={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && !deleteBusy && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.namespace}?</DialogTitle>
            <DialogDescription>
              The app file and all of its saved data will be erased. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
