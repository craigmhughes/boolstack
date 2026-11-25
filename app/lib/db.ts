import { get } from "idb-keyval";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

let backupTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Debounced wrapper around `backup`. Errors are logged, never thrown.
 */
export function scheduleBackup(db: PGliteWithLive, delayMs = 1500): void {
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    backup(db).catch((err) => console.error("Backup failed:", err));
  }, delayMs);
}

/** Cancels a queued backup, e.g. before the database is closed. */
export function cancelPendingBackup(): void {
  clearTimeout(backupTimer);
}

type PermissionHandle = FileSystemDirectoryHandle & {
  queryPermission?: (d: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (d: { mode: "readwrite" }) => Promise<PermissionState>;
};

/**
 * Whether the stored backup folder can currently be written.
 * Pass `interactive` only from a user gesture: it may show a permission prompt.
 */
export async function hasBackupPermission(
  handle: FileSystemDirectoryHandle,
  interactive = false,
): Promise<boolean> {
  const h = handle as PermissionHandle;
  if (!h.queryPermission) return true;
  if ((await h.queryPermission({ mode: "readwrite" })) === "granted") return true;
  if (!interactive || !h.requestPermission) return false;
  return (await h.requestPermission({ mode: "readwrite" })) === "granted";
}

/** Re-prompts for access to the stored backup folder. Call from a click handler. */
export async function reauthorizeBackupSource(): Promise<boolean> {
  const handle = await get('backupSource') as FileSystemDirectoryHandle | null;
  if (!handle) return false;
  return hasBackupPermission(handle, true);
}

/** `true` when a backup folder is stored but needs the user to re-grant access. */
export async function backupNeedsReauthorization(): Promise<boolean> {
  const handle = await get('backupSource') as FileSystemDirectoryHandle | null;
  return !!handle && !(await hasBackupPermission(handle));
}

/**
 * This function retrieves the backup source from **IndexedDB**, dumps the 
 * database content, and *writes* it to a backup file.
 * 
 * The backup is stored as a file named `backup.tar.gz` within the backup 
 * source directory.
 * 
 * @param db The **database instance** to back up.
 */
export async function backup(db: PGliteWithLive) {
  const backupSource = await get('backupSource') as FileSystemDirectoryHandle | null;
  if (!backupSource) {
    console.debug("Backup source is not available");
    return;
  };
  if (db.closed) return;
  if (!(await hasBackupPermission(backupSource))) {
    console.debug("Backup folder permission not granted");
    return;
  }

  const fileHandle = await backupSource.getFileHandle('backup.tar.gz', { create: true });
  const writable = await fileHandle.createWritable();

  const fileData = await db.dumpDataDir();
  await writable.write(fileData);

  await writable.close();
}

/**
 * Restores the backup file from the backup source.
 * 
 * If the backup source is not available or the backup file does not exist, 
 * the function will return `undefined`.
 */
export async function restoreBackupFile() {
  try {
      let backupSource = await get('backupSource') as FileSystemDirectoryHandle | null;
      if (!backupSource) {
        backupSource = await window.showDirectoryPicker();
      }
      if (!(await hasBackupPermission(backupSource))) return undefined;
      const fileHandle = await backupSource.getFileHandle('backup.tar.gz', { create: true });
      return await fileHandle.getFile();
    } catch (err: unknown) {
      if (err instanceof Error) {
        switch (err.name) {
          case 'SecurityError':
            // Security restriction blocked the picker. 
            // The user needs to interact with the DB Initialization directly.
            // The user can trigger this themselves and this function will run 
            // as expected on the next attempt.
            break;
            
          case 'AbortError':
            // User cancelled the folder selection.
            break;
            
          default:
            console.error(`Unexpected DOMException (${err.name}):`, err.message);
        }
      } else {
        console.error('An unknown error occurred:', err);
      }
    }
}

/**
 * Checks if an existing backup file is available in the backup source.
 * Should be used before attempting to restore a backup.
 * 
 * @returns `true` if an existing backup file is available, `false` otherwise.
 */
export async function checkExistingBackup() {
  const backupSource = await get('backupSource') as FileSystemDirectoryHandle | null;
  if (!backupSource) {
    // Backup source is not available, so no existing backup can be found.
    // Therefore, we can safely return false.
    return false;
  }
  try {
    if (!(await hasBackupPermission(backupSource))) return false;
    const fileHandle = await backupSource.getFileHandle('backup.tar.gz', { create: false });
    return (await fileHandle.getFile()).size > 0;
  } catch {
    return false;
  }
}