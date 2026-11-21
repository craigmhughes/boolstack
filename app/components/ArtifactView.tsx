'use client';
import { createContext, useEffect, useRef, useState } from "react";
import { Artifact } from "../lib/types";
import { getArtifactUrlByNamespace } from "../lib/artifacts";
import { useGateway } from "./ClientDatabaseGateway";
import { Button } from "@/components/ui/button";

type ArtifactData = {
  activeArtifact: Artifact | null;
  setActiveArtifact: (artifact: Artifact | null) => void;
};

export const ArtifactViewContext = createContext<ArtifactData>({
  activeArtifact: null,
  setActiveArtifact: () => {},
});

export function ArtifactView({children}: {children: React.ReactNode}) {
  const { db } = useGateway();
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [activeURL, setActiveURL] = useState<string | null>(null);
  const artifactURLs = useRef(new Map<string, string>());

  const enableArtifactView = activeArtifact && activeURL;

  const closeArtifactView = () => {
    setActiveArtifact(null);
    sessionStorage.removeItem("activeArtifact");
  };

  useEffect(() => {
    const storedArtifact = sessionStorage.getItem("activeArtifact");
    if (storedArtifact && !activeArtifact) {
      setActiveArtifact(JSON.parse(storedArtifact));
    }
  }, []);

  useEffect(() => {
    if (!activeArtifact || !db) {
      setActiveURL(null);
      return;
    }

    const cachedURL = artifactURLs.current.get(activeArtifact.namespace);
    if (cachedURL) {
      setActiveURL(cachedURL);
      return;
    }

    let cancelled = false;

    getArtifactUrlByNamespace(db, activeArtifact.namespace).then(url => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }

      artifactURLs.current.set(activeArtifact.namespace, url);
      setActiveURL(url);
      sessionStorage.setItem("activeArtifact", JSON.stringify(activeArtifact));
    }).catch(error => {
      console.error("Failed to get artifact URL:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [db, activeArtifact?.namespace]);

  useEffect(() => {
    return () => {
      artifactURLs.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  
  return (
    <ArtifactViewContext.Provider value={{ activeArtifact, setActiveArtifact }}>
      {enableArtifactView ? (
        <div className="w-full h-full fixed top-0 left-0 flex flex-col">
          <div className="w-full flex">
            <p>{activeArtifact.namespace}</p>
            <Button onClick={() => closeArtifactView()}>
              Close
            </Button>
          </div>
          <iframe 
            src={activeURL} 
            title={activeArtifact.namespace} 
            className="w-full h-full flex-1" />
        </div>
      ) : null}
      {children}
    </ArtifactViewContext.Provider>
  );
}