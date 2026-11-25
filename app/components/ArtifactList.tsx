'use client';

import { useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useGateway } from "./ClientDatabaseGateway";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { Artifact } from "../lib/types";
import { ArtifactViewContext } from "./ArtifactView";
import { ArtifactEdit } from "./ArtifactEdit";
import { scheduleBackup } from "../lib/db";
import { deleteArtifact, artifactStoragePrefix } from "../lib/artifacts";
import { FeatureCard } from "./feature-card";
import { LauncherGrid } from "./LauncherGrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BrandDivider, BrandTag } from "./brand";
import { LiveStatus } from "./LiveStatus";
import { IconAlertHexagon, IconUpload } from "@tabler/icons-react";

const COLUMN_QUERIES = [
  "(min-width: 1536px)",
  "(min-width: 1024px)",
  "(min-width: 640px)",
];

function subscribeColumns(cb: () => void) {
  const mqs = COLUMN_QUERIES.map((q) => window.matchMedia(q));
  mqs.forEach((m) => m.addEventListener("change", cb));
  return () => mqs.forEach((m) => m.removeEventListener("change", cb));
}

function getColumnCount() {
  if (window.matchMedia(COLUMN_QUERIES[0]).matches) return 4;
  if (window.matchMedia(COLUMN_QUERIES[1]).matches) return 3;
  if (window.matchMedia(COLUMN_QUERIES[2]).matches) return 2;
  return 1;
}

/** Column count matching the breakpoints 640 / 1024 / 1536. SSR default is 1. */
function useColumnCount() {
  return useSyncExternalStore(subscribeColumns, getColumnCount, () => 1);
}

const MOBILE_QUERY = "(max-width: 639px)";

function subscribeMobile(cb: () => void) {
  const m = window.matchMedia(MOBILE_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/** True below 640px (launcher layout). SSR default is the desktop layout. */
function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

/** Approximate relative card height: slimline (variant 4) is short. */
function cardWeight(variant: number) {
  return variant === 4 ? 1 : 2;
}

/** Distribute items in order, each into the currently shortest column. */
function distribute(rows: Artifact[], columns: number): Artifact[][] {
  const cols: Artifact[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  for (const row of rows) {
    let target = 0;
    for (let i = 1; i < columns; i++) {
      if (heights[i] < heights[target]) target = i;
    }
    cols[target].push(row);
    heights[target] += cardWeight(row.variant);
  }
  return cols;
}

/**
 * List view for all stored artifacts, newest first, laid out as a
 * row-ordered masonry (flex columns filled shortest-first).
 */
export function ArtifactList({ onCreate }: { onCreate?: () => void }) {
  const { db } = useGateway();
  const { setActiveArtifact } = useContext(ArtifactViewContext);
  const [editing, setEditing] = useState<Artifact | null>(null);
  const [deleting, setDeleting] = useState<Artifact | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const lastEditedNs = useRef<string | null>(null);
  const deletedRef = useRef(false);

  const columnCount = useColumnCount();
  const isMobile = useIsMobile();
  const result = useLiveQuery<Artifact>(`
    SELECT
      namespace,
      htmlfile,
      icon,
      variant,
      mobile_variant,
      color,
      description,
      created_at
    FROM artifacts
    ORDER BY created_at DESC, namespace ASC
  `);

  const columns = useMemo(
    () => distribute(result?.rows ?? [], columnCount),
    [result, columnCount],
  );

  const count = result ? result.rows.length : null;

  // Announce count changes after the first load (adjust state during render).
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [countMessage, setCountMessage] = useState("");
  if (count !== prevCount) {
    setPrevCount(count);
    if (count !== null && prevCount !== null) {
      setCountMessage(`${count} ${count === 1 ? "app" : "apps"}`);
    }
  }

  const requestEdit = (artifact: Artifact) => {
    lastEditedNs.current = artifact.namespace;
    setEditing(artifact);
  };

  const requestDelete = (artifact: Artifact) => {
    lastEditedNs.current = artifact.namespace;
    deletedRef.current = false;
    setDeleteError(null);
    setDeleting(artifact);
  };

  const confirmDelete = async () => {
    if (!db || !deleting) {
      return;
    }
    const ns = deleting.namespace;
    setDeleteBusy(true);
    setDeleteError(null);
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
      deletedRef.current = true;
      setDeleting(null);
    } catch (error) {
      console.error("Failed to delete artifact:", error);
      setDeleteError("Couldn't delete this app. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const status = <LiveStatus message={result ? countMessage : "Loading apps"} />;

  if (!result && isMobile) {
    return (
      <div>
        {status}
        <div aria-hidden="true" className="grid grid-cols-4 max-[359px]:grid-cols-3 gap-x-2 gap-y-6 justify-items-center">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-[6px]">
              <div className="size-[60px] rounded-[28%] bg-slate-800/60 motion-safe:animate-pulse" />
              <div className="h-2 w-10 rounded bg-slate-800/60 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        {status}
        <div aria-hidden="true" className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4">
          {["h-56", "h-72", "h-44"].map((h, i) => (
            <div key={i} className={`mb-4 break-inside-avoid ${h} w-full motion-safe:animate-pulse rounded-[24px] bg-slate-800/60`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef}>
      {status}
      {count === 0 ? (
        <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-8">
          <h1 ref={headingRef} tabIndex={-1} data-apps-heading className="sr-only">
            Your apps
          </h1>
          <Card className="relative w-full overflow-visible">
            <BrandTag className="absolute -top-3 left-0">Get started</BrandTag>
            <CardContent className="flex flex-col gap-4 p-4 pt-8">
              <p className="text-sm">
                Add a self-contained HTML app. It&apos;s stored locally and backed up with your data.
              </p>
              <Button
                className="w-full gap-3 rounded-md bg-blue-600 p-5 text-white hover:bg-blue-700"
                onClick={() => onCreate?.()}
              >
                <IconUpload size={16} aria-hidden="true" />
                Add your first app
              </Button>
            </CardContent>
          </Card>
          <BrandDivider>Apps run sandboxed with their own namespaced storage</BrandDivider>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4 sm:mb-8">
            <h1
              ref={headingRef}
              tabIndex={-1}
              data-apps-heading
              className="font-medium text-4xl tracking-tight text-slate-100 outline-none max-md:text-3xl max-sm:text-3xl"
            >
              Your apps
            </h1>
            <BrandTag>
              {count} {count === 1 ? "app" : "apps"}
            </BrandTag>
          </div>
          {isMobile ? (
            <LauncherGrid
              artifacts={result.rows}
              onOpen={setActiveArtifact}
              onEdit={requestEdit}
              onDelete={requestDelete}
            />
          ) : (
          <div role="list" aria-label="Your apps" className="flex gap-4 items-start">
            {columns.map((col, ci) =>
              col.length === 0 ? (
                <div key={ci} aria-hidden="true" className="flex-1 min-w-0" />
              ) : (
              <div key={ci} role="presentation" className="flex flex-1 min-w-0 flex-col gap-4">
                  {col.map((artifact) => (
                    <div role="listitem" key={artifact.namespace}>
                      <FeatureCard
                        className="w-full"
                        headingLevel={3}
                        title={artifact.namespace}
                        description={artifact.description}
                        icon={artifact.icon}
                        variant={artifact.variant}
                        color={artifact.color}
                        onClick={() => setActiveArtifact(artifact)}
                        onEdit={() => requestEdit(artifact)}
                        onDelete={() => requestDelete(artifact)}
                      />
                    </div>
                  ))}
              </div>
              ),
            )}
          </div>
          )}
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent
          className="md:max-w-[min(56rem,calc(100%-2rem))]"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const ns = lastEditedNs.current;
            const trigger = Array.from(
              listRef.current?.querySelectorAll<HTMLElement>("[data-artifact-trigger]") ?? [],
            ).find((el) => el.dataset.artifactTrigger === ns);
            (trigger ?? headingRef.current)?.focus();
          }}
        >
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
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancelRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const ns = lastEditedNs.current;
            const trigger = deletedRef.current
              ? null
              : Array.from(
                  listRef.current?.querySelectorAll<HTMLElement>("[data-artifact-trigger]") ?? [],
                ).find((el) => el.dataset.artifactTrigger === ns);
            (trigger ?? headingRef.current)?.focus();
          }}
        >
          <div className="relative w-full">
            <BrandTag tone="danger" className="absolute -top-3 left-0 z-10">Delete app</BrandTag>
            <div className="flex flex-col gap-4 p-4 pt-8">
              <DialogTitle className="text-xl">Delete {deleting?.namespace}?</DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center gap-2 rounded-md border border-red-900 bg-red-950 px-4 py-3 text-xs text-red-400">
                  <IconAlertHexagon size={16} className="shrink-0" aria-hidden="true" />
                  <span>This erases the app file and all of its saved data. This can&apos;t be undone.</span>
                </div>
              </DialogDescription>
              {deleteError && (
                <p role="alert" className="text-sm text-red-400">
                  {deleteError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button ref={cancelRef} variant="ghost" onClick={() => setDeleting(null)} disabled={deleteBusy}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={confirmDelete}
                  aria-busy={deleteBusy}
                  disabled={deleteBusy}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
