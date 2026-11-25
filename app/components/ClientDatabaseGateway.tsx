'use client';
import { BrandTag } from './brand/BrandTag';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { LiveStatus } from './LiveStatus';
import { PGlite } from '@electric-sql/pglite';
import { PGliteProvider } from '@electric-sql/pglite-react';
import { live, PGliteWithLive } from '@electric-sql/pglite/live';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { cancelPendingBackup, checkExistingBackup } from '../lib/db';

export type DatabaseGateway = {
  db: PGliteWithLive | null;
};

const DatabaseContext = createContext<DatabaseGateway>({
  db: null,
});

/**
 * Custom hook to access the client database instance.
 * @returns The client database instance.
 */
export function useGateway(): DatabaseGateway {
  const gateway = useContext(DatabaseContext);

  if (!gateway) {
    throw new Error('useDatabase must be used within ClientDatabaseGateway');
  }

  return gateway;
}

/**
 * Client-side database gateway component that initializes/restores the 
 * client database instance to its children.
 */
export default function ClientDatabaseGateway({ children, backupFile }: { children: React.ReactNode; backupFile?: File }) {  
  const [db, setDb] = useState<PGliteWithLive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Read via ref: the backup is only needed when init runs, and a new File identity must not re-init the DB.
  const backupFileRef = useRef(backupFile);
  useEffect(() => {
    backupFileRef.current = backupFile;
  }, [backupFile]);

  useEffect(() => {
    let cancelled = false;
    let instance: PGliteWithLive | null = null;

    async function initClientDb() {
      const existing = await checkExistingBackup();
      const pgLiteProps = existing ? {
        loadDataDir: backupFileRef.current,
      } : {
        dataDir: "idb://artifact-hub-db",
      };

      const created = await PGlite.create({
        ...pgLiteProps,
        extensions: { live },
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
          Icon TEXT NOT NULL,
          Variant INTEGER NOT NULL DEFAULT 1,
          Mobile_Variant INTEGER NOT NULL DEFAULT 1,
          Color TEXT NOT NULL DEFAULT '#ff5003',
          Description TEXT NOT NULL DEFAULT '',
          Created_At BIGINT NOT NULL DEFAULT 0
        );

        -- Existing databases already have the table without these columns
        ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS Variant INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS Mobile_Variant INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS Color TEXT NOT NULL DEFAULT '#ff5003';
        ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS Description TEXT NOT NULL DEFAULT '';
        ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS Created_At BIGINT NOT NULL DEFAULT 0;

        -- NAMESPACED LOCAL STORAGE
        -- Migrate the old (Namespace PK + Value) shape by dropping it
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'namespaced_local_storage'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'namespaced_local_storage' AND column_name = 'key'
          ) THEN
            DROP TABLE namespaced_local_storage;
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS namespaced_local_storage (
          Namespace TEXT NOT NULL,
          Key TEXT NOT NULL,
          Value TEXT NOT NULL,
          Updated_At BIGINT NOT NULL,
          PRIMARY KEY (Namespace, Key)
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

    initClientDb().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
    });

    return () => {
      cancelled = true;
      cancelPendingBackup();
      const closing = instance;
      instance = null;
      // Defer so child live queries unsubscribe before the DB closes.
      setTimeout(() => {
        closing?.close().catch(() => {});
      }, 0);
    };
  }, [attempt]);

  if (!db && error) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div
          role="alert"
          className="max-w-md rounded-md border border-red-900 bg-red-950 px-4 py-3 text-xs text-red-400"
        >
          Could not open your local database. {error}
        </div>
        <Button
          type="button"
          className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="flex justify-center py-10">
        <LiveStatus message="Syncing database…" />
        <div aria-hidden="true">
          <BrandTag>
            <Spinner data-icon="inline-start" />
            Syncing
          </BrandTag>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ db }}>
      <PGliteProvider db={db}>{children}</PGliteProvider>
    </DatabaseContext.Provider>
  );
}