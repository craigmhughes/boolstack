'use client';
import { Button } from "@/components/ui/button";
import { IconDownload, IconShieldCancel, IconSquareRounded, IconX } from "@tabler/icons-react";
import { cx } from "class-variance-authority";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { set, get } from "idb-keyval";

async function requestPersistentStorage(
  setStoragePersisted: Dispatch<SetStateAction<boolean | null>>,
) {
  if (!navigator.storage) {
    setStoragePersisted(false);
    return;
  }

  const alreadyPersisted = await navigator.storage.persisted();
  const backupSource = await get('backupSource') as FileSystemDirectoryHandle | null;

  if (alreadyPersisted && backupSource) {
    setStoragePersisted(true);
    return;
  }

  const granted = await navigator.storage.persist();
  if (backupSource) setStoragePersisted(granted);
}

async function selectBackupSource(setStoragePersisted: Dispatch<SetStateAction<boolean | null>>) {
  try {
    const directoryHandle = await window.showDirectoryPicker();

    set('backupSource', directoryHandle);

    console.log('File saved successfully inside the directory!');
    requestPersistentStorage(setStoragePersisted);
  } catch (error) {
    // console.error('Error selecting backup source:', error);
  }
}

export function StoragePersistence() {
  const [minimized, setMinimized] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const handleInstall = async () => {
    if (!installPromptEvent) return;

    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  useEffect(() => {
    let mounted = true;

    const safeSetStoragePersisted: typeof setStoragePersisted = (value) => {
      if (mounted) setStoragePersisted(value);
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function (registration) {
        if (mounted) {
          console.log('Service Worker registered with scope:', registration.scope);
        }
      }).catch(function (error) {
        if (mounted) {
          console.log('Service Worker registration failed:', error);
        }
      });
    }

    requestPersistentStorage(safeSetStoragePersisted);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener('beforeinstallprompt', (e) => {
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    }, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const controller = new AbortController();

    const handleAppInstalled = async () => {
      console.log('PWA installed successfully. Re-requesting persistence...');
      await requestPersistentStorage(setStoragePersisted);
    };

    window.addEventListener('appinstalled', handleAppInstalled, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, []);

  if (storagePersisted) {
    return null;
  }

  if (minimized) {
    return (
      <Button
        onClick={() => setMinimized(false)}
        size="icon"
        className="absolute bottom-0 right-0 m-4 p-6 hover:bg-yellow-950 cursor-pointer hover:bottom-1"
      >
        <div className="relative scale-200 flex items-center justify-center">
            <IconShieldCancel size={32} strokeWidth={1} className="absolute stroke-yellow-400" />
          </div>
      </Button>
    )
  }

  if (!storagePersisted && !minimized) {
    return (
      <div className={
        cx(
          "p-4 bg-slate-950 text-slate-100 w-full text-center flex items-center",
          "justify-center gap-8 absolute bottom-0 transition-all left-0",
        )
      }>
        <div className="flex items-center gap-4 select-none">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <IconSquareRounded size={54} strokeWidth={0.5} className="fill-yellow-950 stroke-yellow-900" />
            <IconShieldCancel size={32} strokeWidth={1} className="absolute stroke-yellow-400" />
          </div>
          <span className="flex flex-col items-start">
            <span className="text-xs text-yellow-400 font-semibold">Storage persistence is not granted!</span>
            <span>
              Your data may be cleared by the browser. Please <span tabIndex={0} className="underline" onClick={() => selectBackupSource(setStoragePersisted)}>select a backup file</span> to ensure your data is safe.
            </span>
          </span>
        </div>
        {installPromptEvent && (
          <Button
            className={
              cx(
                "flex items-center gap-2 h-max p-2 px-3",
                "bg-blue-500 text-white rounded-md hover:bg-blue-600",
                "cursor-pointer"
              )
            }
            onClick={handleInstall}
          >
            <IconDownload size={16} />
            Install App
          </Button>
        )}

        <Button
          className="bg-transparent hover:bg-slate-800 cursor-pointer"
          onClick={() => setMinimized(true)}
        >
          <IconX size={16} />
        </Button>
      </div>
    );
  }
}