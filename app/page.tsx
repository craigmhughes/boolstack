'use client';
import ClientDatabaseGateway from "./components/ClientDatabaseGateway";
import { ArtifactList } from "./components/ArtifactList";
import { ArtifactEdit } from "./components/ArtifactEdit";
import { ArtifactView } from "./components/ArtifactView";
import { StoragePersistence } from "./components/StoragePersistence";
import { useEffect, useState } from "react";
import { restoreBackupFile } from "./lib/db";
import { cx } from "class-variance-authority";
import { Grid } from 'ldrs/react'
import 'ldrs/react/Grid.css'

const APP_REVEAL_DELAY = 1000;

export default function Home() {
  const [shouldInitDb, setShouldInitDb] = useState(false);
  const [backupFile, setBackupFile] = useState<File | undefined>();
  const [showApp, setShowApp] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const [introMinimized, setIntroMinimized] = useState(false);

  const handleInitialize = async () => {
    const restoredFile = await restoreBackupFile();
    setBackupFile(restoredFile);
    setShouldInitDb(true);
  };

  useEffect(() => {
    if (introMinimized) {
      setShowGrid(true);
      setTimeout(() => {
        setShowApp(true);
      }, APP_REVEAL_DELAY)
    } else {
      setShowApp(false);
      setShowGrid(false);
    }
  }, [introMinimized]);

  useEffect(() => {
    const initialize = async () => {
      await handleInitialize();
    };
    initialize();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGrid(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []); 

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <StoragePersistence minimized={introMinimized} setMinimized={setIntroMinimized} />
      <div className={
        cx(
          "fixed h-full w-full bg-zinc-50 dark:bg-black flex justify-center items-center",
          !showApp && "opacity-100",
          showApp && "opacity-0 transition-opacity duration-500"
        )
      } >
        <div className={cx(
          "transition-all duration-1000 flex gap-8 flex-col",
          !showGrid && "scale-0 opacity-0",
          showGrid && "scale-100 opacity-100"
        )}>
          <Grid
            size="60"
            speed="1.5"
            color="white"
          />
          <p className="text-[11px] tracking-wider text-slate-400">Loading...</p>
        </div>
      </div>
      <main className={
        cx(
          "flex flex-1 w-full max-w-3xl flex-col items-center justify-between",
          "py-32 px-16 bg-white dark:bg-black sm:items-start",
        )
      }>
        {shouldInitDb && (
          <ClientDatabaseGateway backupFile={backupFile}>
            <ArtifactView>
              <ArtifactEdit />
              <ArtifactList />
            </ArtifactView>
          </ClientDatabaseGateway>
        )}
      </main>
    </div>
  );
}
