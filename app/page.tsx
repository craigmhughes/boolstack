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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { GradientBackground } from "./components/GradientBackground";
import { BrandLogo } from "./components/brand/BrandLogo";
import { RegistryBrowser } from "./components/RegistryBrowser";
import { IconPackageImport, IconPlus } from "@tabler/icons-react";

const APP_REVEAL_DELAY = 1000;

export default function Home() {
  const [shouldInitDb, setShouldInitDb] = useState(false);
  const [backupFile, setBackupFile] = useState<File | undefined>();
  const [showApp, setShowApp] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const [introMinimized, setIntroMinimized] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);
  const gridVisible = showGrid || introMinimized;

  const handleInitialize = async () => {
    const restoredFile = await restoreBackupFile();
    setBackupFile(restoredFile);
    setShouldInitDb(true);
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setShowApp(introMinimized),
      introMinimized ? APP_REVEAL_DELAY : 0,
    );
    return () => clearTimeout(timer);
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
    <div className="flex flex-col flex-1 items-center justify-center font-sans text-slate-100">
      <GradientBackground
        showGrain
        grainOpacity={0.15}
        className="!fixed inset-0 -z-10 bg-black min-h-0 h-full w-full"
      />
      <div inert={registryOpen} className="contents">
        <StoragePersistence minimized={introMinimized} setMinimized={setIntroMinimized} />
      </div>
      <div className={
        cx(
          "fixed h-full w-full flex justify-center items-center",
          !showApp && "opacity-100",
          showApp && "opacity-0 transition-opacity duration-500 pointer-events-none"
        )
      } >
        <GradientBackground
          showGrain
          grainOpacity={0.15}
          className="!absolute inset-0 bg-black min-h-0 h-full w-full"
        />
        <div className={cx(
          "relative transition-all duration-1000 flex gap-8 flex-col",
          !gridVisible && "scale-0 opacity-0",
          gridVisible && "scale-100 opacity-100"
        )}>
          <Grid
            size="60"
            speed="1.5"
            color="white"
          />
          <p className="text-[11px] tracking-wider text-slate-400">Loading...</p>
        </div>
      </div>
      <main className="flex flex-1 w-full max-w-screen-2xl mx-auto flex-col px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <header className="flex items-center justify-between mb-10">
          <BrandLogo />
        </header>
        {shouldInitDb && (
          <ClientDatabaseGateway backupFile={backupFile}>
            <div inert={registryOpen} className="contents">
              <ArtifactView>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label="Add app"
                      className="group size-14 cursor-pointer rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,.45)] fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40"
                    >
                      <IconPlus className="size-6 stroke-2 transition-transform group-data-[state=open]:rotate-45" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="end"
                    sideOffset={12}
                    className="min-w-[220px] rounded-xl border border-slate-800 bg-slate-950 p-1 text-slate-100 shadow-[0_0_40px_rgba(37,99,235,.25)]"
                  >
                    <DropdownMenuItem
                      onSelect={() => setCreateOpen(true)}
                      className="gap-3 px-3 py-2.5 rounded-md text-sm cursor-pointer focus:bg-slate-800 focus:text-slate-100 [&_svg]:size-4 [&_svg]:text-slate-400"
                    >
                      <IconPlus />
                      New app
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setRegistryOpen(true)}
                      className="gap-3 px-3 py-2.5 rounded-md text-sm cursor-pointer focus:bg-slate-800 focus:text-slate-100 [&_svg]:size-4 [&_svg]:text-slate-400"
                    >
                      <IconPackageImport />
                      Import from registry
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogContent>
                    <ArtifactEdit key="new" onSaved={() => setCreateOpen(false)} />
                  </DialogContent>
                </Dialog>
                <ArtifactList onCreate={() => setCreateOpen(true)} />
              </ArtifactView>
            </div>
            <RegistryBrowser open={registryOpen} onOpenChange={setRegistryOpen} />
          </ClientDatabaseGateway>
        )}
      </main>
    </div>
  );
}
