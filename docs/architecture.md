# Architecture

Boolstack is a Next.js (App Router) application whose runtime is almost entirely client-side. This document describes the moving parts.

## Overview

```
Browser
  Launcher UI (React)
    PGlite database  <-- idb://artifact-hub-db (IndexedDB)  or  loaded from backup.tar.gz
    Storage bridge   <-- postMessage from sandboxed iframes
    Backup           --> backup.tar.gz in a user-chosen folder (File System Access API)
  Service worker (public/sw.js)

Server (Node.js)
  GET /api/registry         list sample apps
  GET /api/registry/[slug]  serve one sample app's HTML
```

## Storage: PGlite

`app/components/ClientDatabaseGateway.tsx` creates the database on mount.

- If a backup exists in the stored backup folder, the database is created with `loadDataDir` from `backup.tar.gz`.
- Otherwise it uses `dataDir: "idb://artifact-hub-db"` (IndexedDB), with the `live` extension for reactive queries.
- It then runs the schema (`CREATE TABLE IF NOT EXISTS`, plus `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for older databases), a `CHECKPOINT` and `VACUUM FULL`.

Two tables:

| Table | Purpose |
| --- | --- |
| `artifacts` | One row per app: `Namespace` (primary key, the app name), `HtmlFile`, `Icon`, `Variant`, `Mobile_Variant`, `Color`, `Description`, `Created_At` |
| `namespaced_local_storage` | Each app's `localStorage` entries: `Namespace`, `Key`, `Value`, `Updated_At` (primary key `Namespace, Key`) |

An app's name is its namespace, so names are unique and cannot be changed after creation. Deleting an app removes its rows from both tables in one transaction (`app/lib/artifacts.ts`).

## Running apps: iframe sandbox

`app/components/ArtifactView.tsx` loads an app by reading its HTML from the database, injecting the storage proxy script, wrapping the result in a `Blob` and using the blob URL as the iframe `src`. The iframe has:

```
sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
```

`allow-same-origin` is needed so the app can use `localStorage`. Because of that, apps are not isolated from each other by the browser's origin rules; separation of their data is provided by the key namespacing below. Only run apps you trust. See [SECURITY.md](../SECURITY.md).

Registry previews (`app/components/RegistryPreview.tsx`) use a stricter sandbox (no `allow-same-origin`, no downloads) and a memory-only shim (`app/lib/registry-preview.ts`) that replaces `localStorage`, `sessionStorage`, `document.cookie` and `indexedDB`, so previewing never persists anything.

## Storage bridge

`app/lib/storage-bridge.ts` keeps each app's `localStorage` separate and mirrored into the database.

1. **Namespacing.** An injected script replaces `window.localStorage` with a `Proxy`. Every key is prefixed with `__bs_{encodeURIComponent(appName)}_` in the real `localStorage`, so apps cannot see each other's keys through the normal API.
2. **Reporting.** Each `setItem`, `removeItem` and `clear` is sent to the launcher with `postMessage` (messages carry `source: "boolstack-ls"` and the namespace).
3. **Syncing.** `createStorageSync` batches mutations and, after about one second of inactivity, writes them to `namespaced_local_storage` in a transaction, then schedules a backup.
4. **Rehydration.** Before an app opens, `hydrateLocalStorage` compares the database with `localStorage`. If `localStorage` has no keys for the namespace, values are restored from the database (for example after restoring a backup in a new browser). If the database has none but `localStorage` does, they are pushed into the database.

Only `localStorage` is bridged. `sessionStorage`, cookies and IndexedDB inside apps are not backed up.

## Backup

`app/lib/db.ts`:

- The chosen folder's `FileSystemDirectoryHandle` is kept in IndexedDB (`idb-keyval`, key `backupSource`).
- `scheduleBackup` debounces (1.5 s by default). `backup` calls `db.dumpDataDir()` and writes the result to `backup.tar.gz` in the folder.
- On start, `checkExistingBackup` looks for a non-empty `backup.tar.gz` and, if found, the database is restored from it.
- Browsers can revoke folder permission between sessions; `hasBackupPermission` and `reauthorizeBackupSource` handle the re-prompt, which must come from a user gesture.

## Registry API

`app/lib/registry.ts` (server-only, uses `node:fs`) reads `registry/*.html` at request time.

- `GET /api/registry` returns `{ apps: RegistryApp[] }`, with metadata parsed from each file's `<head>`, sorted by name.
- `GET /api/registry/[slug]` returns the raw HTML (`text/html`, `X-Content-Type-Options: nosniff`), or 404. Slugs are validated against `[a-z0-9][a-z0-9_-]*` and the resolved path must stay inside `registry/`.
- Both routes are `force-dynamic` and send `Cache-Control: no-store`.
- `next.config.ts` sets `outputFileTracingIncludes` so `registry/**/*` is included in traced production output.

Adding an app from the registry clones its HTML into the user's own database. See [registry.md](registry.md).

## Service worker and PWA

`public/sw.js` is registered by `app/components/StoragePersistence.tsx` in production only. In development it unregisters any existing worker.

- Precaches `/` and `/manifest.json` on install; old `boolstack-*` caches are removed on activate.
- Navigations: network first, caching successful responses, falling back to the cached route and then `/` when offline.
- `/_next/static/*`, `.wasm` and `.data` files (the PGlite binaries): cache first.
- Everything else, including `/api/registry`, goes to the network.

`app/manifest.json` provides the install metadata. `StoragePersistence.tsx` also requests persistent storage (`navigator.storage.persist()`) and handles the first-run backup folder flow.
