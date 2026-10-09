'use client';
import { Button } from "@/components/ui/button";
import { IconAlertHexagon, IconAlertHexagonFilled, IconAlertTriangle, IconArrowRight, IconCheck, IconDownload, IconExclamationMark, IconFile, IconFolderSymlink, IconLoader, IconShieldCancel } from "@tabler/icons-react";
import { cx } from "class-variance-authority";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { set, get } from "idb-keyval";
import { Blobatar } from "@blobatar/react";
import { love, thinking } from "blobatar/expression";
import "blobatar/motion.css";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { GradientBackground } from "./GradientBackground";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTrigger,
} from "@/components/reui/stepper"
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd";
import { Grid } from "ldrs/react";
import 'ldrs/react/Grid.css'

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

async function selectBackupSource(setStoragePersisted: Dispatch<SetStateAction<boolean | null>>): Promise<boolean> {
  try {
    const directoryHandle = await window.showDirectoryPicker();

    set('backupSource', directoryHandle);

    console.log('File saved successfully inside the directory!');
    requestPersistentStorage(setStoragePersisted);
    return true;
  } catch (error) {
    return false;
  }
}

const steps = [1, 2, 3]

interface StoragePersistenceProps {
  minimized: boolean;
  setMinimized: Dispatch<SetStateAction<boolean>>;
}

export function StoragePersistence({
  minimized = false,
  setMinimized = () => {},
}: StoragePersistenceProps) {
  const [done, setDone] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldThink, setShouldThink] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    setShouldThink(true);
    await installPromptEvent.prompt().catch(() => {
      // prompt failed, user likely already has the app installed
    });
    const choice = await installPromptEvent.userChoice;
    setShouldThink(false);
    setInstallPromptEvent(null);
    if (choice.outcome === 'accepted') {
      setCurrentStep(3);
    }
  };

  const expression = () => {
    if (currentStep === 3) {
      return love;
    } else if (shouldThink) {
      return thinking;
    }
    return undefined;
  }

  const handleStep1 = async () => {
    setShouldThink(true);
    const success = await selectBackupSource(setStoragePersisted);
    if (success) setCurrentStep(2);
    setShouldThink(false);
  };

  const handleStep2Skip = () => {
    setShouldThink(true);
    setCurrentStep(3);
    setShouldThink(false);
  };

  const stepperContent = [  
    <div className="flex flex-col gap-8">
      <Button
        className={
          cx(
            "flex items-center gap-2 h-max p-3",
            "bg-blue-500 text-white rounded-md hover:bg-blue-600",
            "cursor-pointer w-full"
          )
        }
        onClick={handleStep1}
      >
        <IconFolderSymlink size={16} />
        Select a folder to store/import your backup
      </Button>
      <p className="text-xs leading-6 tracking-wide text-left">
        Your backup file <Kbd className="px-2 border mx-1 text-[11px] text-slate-400">artifact-hub-backup.tar.gz</Kbd> will be created in the selected folder if it does not already exist.
      </p>
    </div>,
    <div className="flex flex-col gap-3 items-center w-full">
      <Button
        className={
          cx(
            "flex items-center gap-2 h-max w-full p-3",
            "bg-blue-500 text-white rounded-md hover:bg-blue-600",
            "cursor-pointer"
          )
        }
        onClick={handleInstall}
      >
        <IconDownload size={16} />
        Install App
      </Button>
      <Button
        variant="ghost"
        onClick={handleStep2Skip}
        className={
          cx(
            "w-full min-h-12 cursor-pointer hover:bg-slate-800!",
            "text-sm text-slate-400 hover:text-slate-300 underline"
          )
        }
      >
        Skip
      </Button>
    </div>,
    <div className="flex flex-col gap-4 items-center w-full">
      <div className="text-sm text-slate-300 text-center">
        <p className="font-semibold mb-2">Setup complete!</p>
        <p className="text-xs">Your data is now secure and will persist across browser sessions.</p>
      </div>
      <Button
        className={
          cx(
            "flex items-center gap-2 h-max p-3",
            "bg-green-600 text-white rounded-md hover:bg-green-700",
            "cursor-pointer w-full"
          )
        }
        onClick={() => {
          setDone(true);
          setMinimized(true);
        }}
      >
        <IconCheck size={16} />
        Finish
      </Button>
    </div>
  ]

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

    (async () => {
      if (!navigator.storage) {
        safeSetStoragePersisted(false);
        return;
      }

      const alreadyPersisted = await navigator.storage.persisted();
      const backupSource = await get('backupSource') as FileSystemDirectoryHandle | null;

      if (alreadyPersisted && backupSource) {
        if (mounted) {
          setDone(true);
          setMinimized(true);
        }
        return;
      }

      const granted = await navigator.storage.persist();
      safeSetStoragePersisted(granted);
    })();

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
      setCurrentStep(3);
    };

    window.addEventListener('appinstalled', handleAppInstalled, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {!done && !minimized && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed inset-0 z-[100]"
          >
            <GradientBackground
              showGrain={true}
              grainOpacity={0.15}
              className={
                cx(
                  "p-4 bg-black text-slate-100 w-full h-full flex",
                  "justify-center transition-all [&>#gradient-background-children]:flex-1"
                )
              }
            >
              <div className="flex flex-1 flex-col items-start justify-end gap-4 w-full h-full max-w-screen-sm mx-auto">
                <div className="flex flex-1 flex-col items-start justify-end gap-4 w-full xl:justify-center">
                  <div className="flex-1 max-h-[180px] flex items-end justify-end">
                    <div className="font-medium tracking-tighter flex items-end gap-2">
                      <span className="flex items-center justify-center relative -top-0.5">
                        <Grid
                          size="20"
                          speed="4"
                          color="white"
                        />
                      </span>
                      Boolstack.dev
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-center gap-8 w-full mb-10">
                    <h1 className="font-medium text-4xl tracking-tight">Your apps, your way. Start building today.</h1>
                    <Card className="w-full relative overflow-visible">
                      <Badge variant="secondary" className="absolute -top-3 left-0 border border-blue-800 bg-blue-950 text-blue-400 px-3 py-3 text-[11px] rounded-sm">
                        Initial Set-up
                      </Badge>
                      <CardContent className="p-4 pt-8 relative">
                        <div className="w-[calc(100%_-_6rem)] mx-auto flex items-center justify-center gap-10">
                          <Stepper
                            className="flex flex-col items-center justify-center gap-10"
                            value={currentStep}
                            onValueChange={setCurrentStep}
                            orientation="horizontal"
                            indicators={{
                              completed: (
                                <IconCheck className="size-3.5" />
                              ),
                              loading: (
                                <IconLoader className="size-3.5 animate-spin" />
                              ),
                            }}
                          >
                            <StepperNav>
                              {steps.map((step) => (
                                <StepperItem key={step} step={step} disabled={step > currentStep} completed={step < currentStep} loading={false}>
                                  <StepperTrigger>
                                    <StepperIndicator className="bg-muted text-muted-foreground data-[state=completed]:bg-success data-[state=completed]:text-white">
                                      {step}
                                    </StepperIndicator>
                                  </StepperTrigger>
                                  {steps.length > step && (
                                    <StepperSeparator className="group-data-[state=completed]/step:bg-success" />
                                  )}
                                </StepperItem>
                              ))}
                            </StepperNav>

                            <div data-slot="stepper-panel" data-state={currentStep} className="w-full">
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                  key={currentStep}
                                  initial={{ x: 40, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  exit={{ x: -40, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="w-56 text-center text-sm flex items-center justify-center w-full"
                                >
                                  {stepperContent[currentStep - 1]}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </Stepper>
                        </div>
                      </CardContent>
                    </Card>
                    
                  </div>
              </div>

              <AnimatePresence mode="wait">
                {currentStep < 2 && (
                  <motion.div
                    key="skip-section"
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <div className="w-full flex items-center gap-4 pb-8">
                      <hr className="flex-grow border-t border-slate-700" />
                      <p className="text-xs whitespace-nowrap">Or, skip setup and start exploring</p>
                      <hr className="flex-grow border-t border-slate-700" />
                    </div>

                    <div className="flex flex-col justify-center items-center gap-4 -mt-4 pb-4 w-full text-center">
                      <Button
                        className="bg-transparent hover:bg-slate-800 dark:text-slate-100 cursor-pointer p-5 px-4 gap-3"
                        onClick={() => setMinimized(true)}
                      >
                        Continue without a backup
                        <IconArrowRight size={16} className="stroke-[1.25px] relative top-[1px]" />
                      </Button>
                      <Badge variant="destructive" className="border border-red-900 bg-red-950! py-3 px-4 text-[11px]">
                        <IconAlertHexagon className="relative -left-0.5" />
                        Without a backup file, your data will be <strong>lost</strong> if you clear your browser storage.
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </GradientBackground>
          </motion.div>
        )}

        {!done && minimized && (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            className="absolute bottom-0 right-0 m-4 z-[100]"
          >
            <Button
              onClick={() => setMinimized(false)}
              size="icon"
              className="p-6 hover:bg-yellow-950 bg-slate-900 border border-yellow-900 cursor-pointer hover:bottom-1"
            >
              <div className="text-yellow-600 z-10 h-6 w-6 flex items-end justify-end absolute right-1.5 bottom-1.5 rounded-md">
                <IconAlertTriangle size={16} />
              </div>
              <div className="relative scale-200 flex items-center justify-center">
                <Grid
                  size="14"
                  speed="2"
                  color="orange"
                />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}