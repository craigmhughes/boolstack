'use client';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { PGlite } from '@electric-sql/pglite';
import { PGliteProvider } from '@electric-sql/pglite-react';
import { live, PGliteWithLive } from '@electric-sql/pglite/live';
import { createContext, useContext, useEffect, useState } from 'react';

const DatabaseContext = createContext<PGliteWithLive | null>(null);

/**
 * Custom hook to access the client database instance.
 * @returns The client database instance.
 */
export function useDatabase(): PGliteWithLive {
  const db = useContext(DatabaseContext);

  if (!db) {
    throw new Error('useDatabase must be used within ClientDatabaseGateway');
  }

  return db;
}

/**
 * Client-side database gateway component that initializes/restores the 
 * client database instance to its children.
 */
export default function ClientDatabaseGateway({ children }: { children: React.ReactNode }) {  
  const [db, setDb] = useState<PGliteWithLive | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: PGliteWithLive | null = null;

    async function initClientDb() {
      const created = await PGlite.create({
        dataDir: "idb://artifact-hub-db",
        extensions: { live }
      });

      if (cancelled) {
        await created.close();
        return;
      }
      
      await created.exec(`
        -- ARTIFACTS
        CREATE TABLE IF NOT EXISTS artifacts (
          Namespace TEXT PRIMARY KEY,
          HtmlFile TEXT NOT NULL,
          Icon TEXT NOT NULL
        );

        -- NAMESPACED LOCAL STORAGE
        CREATE TABLE IF NOT EXISTS namespaced_local_storage (
          Namespace TEXT PRIMARY KEY,
          Value TEXT NOT NULL
        );
      `);

      /**
       * Force a checkpoint to flush the current Write-Ahead Log (WAL) and 
       * then run a full vacuum to clean up the database.
       */
      await created.query("CHECKPOINT;");
      await created.query("VACUUM FULL;");

      if (cancelled) {
        await created.close();
        return;
      }

      instance = created;
      setDb(instance);
    }

    initClientDb().catch(console.error);

    return () => {
      cancelled = true;
      void instance?.close();
    };
  }, []);

  if (!db) {
    return (
      <Badge>
        <Spinner data-icon="inline-start" />
        Syncing
      </Badge>
    );
  }

  return (
    <DatabaseContext.Provider value={db}>
      <PGliteProvider db={db}>{children}</PGliteProvider>
    </DatabaseContext.Provider>
  );
}