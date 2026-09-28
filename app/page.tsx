'use client';
import ClientDatabaseGateway from "./components/ClientDatabaseGateway";
import { ArtifactList } from "./components/ArtifactList";
import { ArtifactEdit } from "./components/ArtifactEdit";
import { ArtifactView } from "./components/ArtifactView";
import { StoragePersistence } from "./components/StoragePersistence";
import { useEffect, useState } from "react";
import { restoreBackupFile } from "./lib/db";

export default function Home() {
  const [shouldInitDb, setShouldInitDb] = useState(false);
  const [backupFile, setBackupFile] = useState<File | undefined>();

  const handleInitialize = async () => {
    const restoredFile = await restoreBackupFile();
    setBackupFile(restoredFile);
    setShouldInitDb(true);
  };

  useEffect(() => {
    const initialize = async () => {
      await handleInitialize();
    };
    initialize();
  }, []); 

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <StoragePersistence />
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1>Welcome</h1>
      <button onClick={handleInitialize}>
        Initialize Database
      </button>
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
