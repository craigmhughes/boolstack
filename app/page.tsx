'use client';
import ClientDatabaseGateway from "./components/ClientDatabaseGateway";
import { ArtifactList } from "./components/ArtifactList";
import { ArtifactEdit } from "./components/ArtifactEdit";
import { ArtifactView } from "./components/ArtifactView";
import { StoragePersistence } from "./components/StoragePersistence";
import { useCallback, useEffect, useRef, useState } from "react";
import { restoreBackupFile } from "./lib/db";
import { getSectionTitle } from "./lib/section-title";
import type { Artifact } from "./lib/types";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { headerVariants, screenSpring } from "./lib/motion";
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
import { BrandLogoMotion } from "./components/brand/BrandLogoMotion";
import { RegistryBrowser } from "./components/RegistryBrowser";
import { IconPackageImport, IconPlus } from "@tabler/icons-react";
import { LiveStatus } from "./components/LiveStatus";
import { useReducedMotion } from "./lib/use-reduced-motion";
import { IntroScreen } from "./components/IntroScreen";

const APP_REVEAL_DELAY = 1000;

export default function Home() {
  const [shouldInitDb, setShouldInitDb] = useState(false);
  const [backupFile, setBackupFile] = useState<File | undefined>();
  const [showApp, setShowApp] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [storageChecked, setStorageChecked] = useState(false);

  const [introMinimized, setIntroMinimized] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState<string | null>(null);
  const handleActiveArtifactChange = useCallback(
    (a: Artifact | null) => setViewerTitle(a?.namespace ?? null),
    [],
  );
  const fabRef = useRef<HTMLButtonElement>(null);
  // Set when a menu item opens a dialog/overlay, so Radix doesn't return focus to the FAB and steal it.
  const menuOpenedOverlayRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const handleRegistryOpenChange = useCallback((open: boolean) => {
    setRegistryOpen(open);
    // Return focus to the FAB once the inert wrapper has lifted.
    if (!open) requestAnimationFrame(() => fabRef.current?.focus());
  }, []);
  const gridVisible = showGrid || introMinimized;
  const overlayOpen = registryOpen || viewerOpen;
  const introTarget = introActive && storageChecked ? (introMinimized ? "dashboard" : "setup") : null;

  useEffect(() => {
    // Gate script sets this before paint; read it once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (document.documentElement.dataset.intro === "play") setIntroActive(true);
  }, []);

  const handleIntroDone = useCallback(() => {
    setIntroActive(false);
    // Wait for the inert wrappers to lift before moving focus.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>("[role=dialog] h1");
        if (h1) {
          h1.tabIndex = -1;
          h1.focus({ preventScroll: true });
        } else {
          document.getElementById("main")?.focus({ preventScroll: true });
        }
      }),
    );
  }, []);
  const handleChecked = useCallback(() => setStorageChecked(true), []);

  useEffect(() => {
    document.title = getSectionTitle({ registryOpen, viewerTitle, introMinimized });
  }, [registryOpen, viewerTitle, introMinimized]);

  const handleInitialize = async () => {
    const restoredFile = await restoreBackupFile();
    setBackupFile(restoredFile);
    setShouldInitDb(true);
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setShowApp(introMinimized),
      introMinimized && !introActive ? APP_REVEAL_DELAY : 0,
    );
    return () => clearTimeout(timer);
  }, [introMinimized, introActive]);

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
    <MotionConfig reducedMotion="user" transition={screenSpring}>
    <LayoutGroup>
    <div className="flex flex-col flex-1 items-center justify-center font-sans text-slate-100">
      <GradientBackground
        showGrain
        grainOpacity={0.15}
        className="!fixed inset-0 -z-10 bg-black min-h-0 h-full w-full"
      />
      <div inert={!showApp || overlayOpen || introActive} className="contents">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg"
        >
          Skip to apps
        </a>
      </div>
      <div inert={registryOpen || viewerOpen || introActive} className="contents">
        <StoragePersistence
          minimized={introMinimized}
          setMinimized={setIntroMinimized}
          skipEntrance={introActive}
          onChecked={handleChecked}
        />
      </div>
      {introActive && <IntroScreen target={introTarget} onDone={handleIntroDone} />}
      <LiveStatus message={introMinimized && !showApp ? "Loading Boolstack" : ""} />
      <AnimatePresence>
        {!showApp && !introActive && (
          <motion.div
            key="cover"
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.5 }}
            className="fixed h-full w-full flex justify-center items-center"
          >
            <GradientBackground
              showGrain
              grainOpacity={0.15}
              className="!absolute inset-0 bg-black min-h-0 h-full w-full"
            />
            <motion.div
              initial={false}
              animate={gridVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 1 }}
              className="relative flex gap-8 flex-col"
            >
              <span aria-hidden="true" className="contents">
                <Grid
                  size="60"
                  speed={reducedMotion ? "0" : "1.5"}
                  color="#FFF"
                />
              </span>
              <p aria-hidden="true" className="text-xs tracking-wider text-slate-400">Loading...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div inert={!showApp || introActive} className="contents">
        <motion.header
          variants={headerVariants}
          initial="hidden"
          animate={showApp || introActive ? "shown" : "hidden"}
          transition={introActive ? { duration: 0 } : undefined}
          className="mx-auto mb-10 flex w-full max-w-screen-2xl items-center justify-between px-4 pt-6 sm:px-6 sm:pt-10 lg:px-10"
        >
          {overlayOpen ? (
            <span aria-hidden className="opacity-0">
              <BrandLogo />
            </span>
          ) : (
            <div data-logo-target="dashboard">
              <BrandLogoMotion />
            </div>
          )}
        </motion.header>
        <main id="main" tabIndex={-1} className="outline-none flex flex-1 w-full max-w-screen-2xl mx-auto flex-col px-4 sm:px-6 lg:px-10 pb-28">
        {shouldInitDb && (
          <ClientDatabaseGateway backupFile={backupFile}>
            <div inert={registryOpen} className="contents">
              <ArtifactView onViewerOpenChange={setViewerOpen} onActiveArtifactChange={handleActiveArtifactChange} recede={registryOpen}>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={fabRef}
                      aria-label="Add app"
                      className="group size-14 cursor-pointer rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(37,99,235,.45)] fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40"
                    >
                      <IconPlus aria-hidden="true" className="size-6 stroke-2 motion-safe:transition-transform group-data-[state=open]:rotate-45" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="end"
                    sideOffset={12}
                    onCloseAutoFocus={(e) => {
                      if (menuOpenedOverlayRef.current) {
                        menuOpenedOverlayRef.current = false;
                        e.preventDefault();
                      }
                    }}
                    className="min-w-[220px] data-[state=closed]:pointer-events-none rounded-xl border border-slate-800 bg-slate-950 p-1 text-slate-100 shadow-[0_0_40px_rgba(37,99,235,.25)]"
                  >
                    <DropdownMenuItem
                      onSelect={() => {
                        menuOpenedOverlayRef.current = true;
                        setCreateOpen(true);
                      }}
                      className="gap-3 px-3 py-2.5 rounded-md text-sm cursor-pointer focus:bg-slate-800 focus:text-slate-100 [&_svg]:size-4 [&_svg]:text-slate-400"
                    >
                      <IconPlus aria-hidden="true" />
                      New app
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        menuOpenedOverlayRef.current = true;
                        setRegistryOpen(true);
                      }}
                      className="gap-3 px-3 py-2.5 rounded-md text-sm cursor-pointer focus:bg-slate-800 focus:text-slate-100 [&_svg]:size-4 [&_svg]:text-slate-400"
                    >
                      <IconPackageImport aria-hidden="true" />
                      Import from registry
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogContent
                    className="md:max-w-[min(56rem,calc(100%-2rem))]"
                    onCloseAutoFocus={(e) => {
                      e.preventDefault();
                      fabRef.current?.focus();
                    }}
                  >
                    <ArtifactEdit key="new" onSaved={() => setCreateOpen(false)} />
                  </DialogContent>
                </Dialog>
                <ArtifactList onCreate={() => setCreateOpen(true)} />
              </ArtifactView>
            </div>
            <RegistryBrowser open={registryOpen} onOpenChange={handleRegistryOpenChange} />
          </ClientDatabaseGateway>
        )}
        </main>
      </div>
    </div>
    </LayoutGroup>
    </MotionConfig>
  );
}
