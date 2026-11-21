'use client';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Artifact } from "../lib/types";
import { getArtifactUrlByNamespace } from "../lib/artifacts";
import {
  STORAGE_MESSAGE_SOURCE,
  createStorageSync,
  hydrateLocalStorage,
  type StorageMessage,
} from "../lib/storage-bridge";
import { useGateway } from "./ClientDatabaseGateway";
import { ArtifactIcon } from "./IconPicker";
import { Button } from "@/components/ui/button";
import { Grid } from "ldrs/react";
import "ldrs/react/Grid.css";
import { BrandLogo, BrandTag } from "./brand";

type ArtifactData = {
  activeArtifact: Artifact | null;
  setActiveArtifact: (artifact: Artifact | null) => void;
};

export const ArtifactViewContext = createContext<ArtifactData>({
  activeArtifact: null,
  setActiveArtifact: () => {},
});

const SESSION_KEY = "activeArtifact";

function restoreActiveArtifact(): Artifact | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as Artifact) : null;
  } catch {
    return null;
  }
}

export function ArtifactView({
  children,
  onViewerOpenChange,
}: {
  children: React.ReactNode;
  onViewerOpenChange?: (open: boolean) => void;
}) {
  const { db } = useGateway();
  const [activeArtifact, setActiveArtifactState] = useState<Artifact | null>(restoreActiveArtifact);
  const [loaded, setLoaded] = useState<{ namespace: string; url: string } | null>(null);
  const artifactURLs = useRef(new Map<string, string>());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const viewerOpen = activeArtifact !== null;
  // Runs on mount too, so a viewer restored from sessionStorage is reported as open.
  useEffect(() => {
    onViewerOpenChange?.(viewerOpen);
  }, [viewerOpen, onViewerOpenChange]);

  const namespace = activeArtifact?.namespace ?? null;
  const activeURL = loaded && loaded.namespace === namespace ? loaded.url : null;

  const setActiveArtifact = useCallback((artifact: Artifact | null) => {
    setActiveArtifactState(artifact);
    // Drop the previous URL so the iframe only mounts after hydration finishes.
    setLoaded(prev => (artifact && prev?.namespace === artifact.namespace ? prev : null));
    try {
      if (artifact) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(artifact));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // sessionStorage unavailable; the view still works.
    }
  }, []);

  useEffect(() => {
    if (!namespace || !db) {
      return;
    }

    const sync = createStorageSync(db, namespace);
    let cancelled = false;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as Partial<StorageMessage> | null;
      if (
        event.source === iframeRef.current?.contentWindow &&
        data?.source === STORAGE_MESSAGE_SOURCE &&
        data.ns === namespace
      ) {
        sync.handle(data as StorageMessage);
      }
    };
    const onPageHide = () => {
      void sync.flush();
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("pagehide", onPageHide);

    (async () => {
      await hydrateLocalStorage(db, namespace);
      let url = artifactURLs.current.get(namespace);
      if (!url) {
        url = await getArtifactUrlByNamespace(db, namespace);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        artifactURLs.current.set(namespace, url);
      }
      if (!cancelled) {
        setLoaded({ namespace, url });
      }
    })().catch(error => {
      console.error("Failed to get artifact URL:", error);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", onPageHide);
      void sync.dispose();
    };
  }, [db, namespace]);

  useEffect(() => {
    const urls = artifactURLs.current;
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({ activeArtifact, setActiveArtifact }),
    [activeArtifact, setActiveArtifact],
  );

  return (
    <ArtifactViewContext.Provider value={contextValue}>
      {activeArtifact ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeArtifact.namespace}
          className="fixed inset-0 z-50 flex flex-col bg-black text-slate-100"
        >
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3 pt-[env(safe-area-inset-top)] box-content">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo size="sm" showWordmark={false} />
              <div className="h-5 w-px shrink-0 bg-slate-700" />
              <div className="flex min-w-0 items-center gap-2">
                <ArtifactIcon icon={activeArtifact.icon} className="size-5 shrink-0" />
                <p className="truncate text-sm font-medium tracking-tight">{activeArtifact.namespace}</p>
              </div>
              <BrandTag className="hidden py-1 px-2 text-[10px] md:inline-flex">Sandboxed</BrandTag>
            </div>
            <Button
              variant="ghost"
              aria-label="Close app"
              className="bg-transparent hover:bg-slate-800 text-slate-100 hover:text-slate-100 cursor-pointer"
              onClick={() => setActiveArtifact(null)}
            >
              <IconX />
              <span className="max-md:hidden">Close</span>
            </Button>
          </header>
          {activeURL ? (
            <iframe
              ref={iframeRef}
              src={activeURL}
              title={activeArtifact.namespace}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
              className="w-full flex-1 border-0 bg-white" />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-8">
                <Grid size="60" speed="1.5" color="white" />
                <p className="text-[11px] tracking-wider text-slate-400">Loading app...</p>
              </div>
            </div>
          )}
        </div>
      ) : null}
      <div inert={activeArtifact !== null} className="contents">
        {children}
      </div>
    </ArtifactViewContext.Provider>
  );
}
