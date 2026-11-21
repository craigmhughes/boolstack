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

export function ArtifactView({children}: {children: React.ReactNode}) {
  const { db } = useGateway();
  const [activeArtifact, setActiveArtifactState] = useState<Artifact | null>(restoreActiveArtifact);
  const [loaded, setLoaded] = useState<{ namespace: string; url: string } | null>(null);
  const artifactURLs = useRef(new Map<string, string>());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const namespace = activeArtifact?.namespace ?? null;
  const activeURL = loaded && loaded.namespace === namespace ? loaded.url : null;

  const setActiveArtifact = useCallback((artifact: Artifact | null) => {
    setActiveArtifactState(artifact);
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
      {activeArtifact && activeURL ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 pt-[env(safe-area-inset-top)] box-content">
            <div className="flex min-w-0 items-center gap-2">
              <ArtifactIcon icon={activeArtifact.icon} className="size-5 shrink-0" />
              <p className="truncate text-sm font-medium">{activeArtifact.namespace}</p>
            </div>
            <Button variant="ghost" onClick={() => setActiveArtifact(null)}>
              <IconX />
              Close
            </Button>
          </header>
          <iframe
            ref={iframeRef}
            src={activeURL}
            title={activeArtifact.namespace}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
            className="w-full flex-1 border-0 bg-white" />
        </div>
      ) : null}
      {children}
    </ArtifactViewContext.Provider>
  );
}
