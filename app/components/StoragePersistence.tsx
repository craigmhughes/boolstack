'use client';
import { Button } from "@/components/ui/button";
import { IconAlertHexagon, IconAlertTriangle, IconArrowRight, IconCheck, IconDownload, IconFolderSymlink, IconLoader } from "@tabler/icons-react";
import { cx } from "class-variance-authority";
import { Dispatch, SetStateAction, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { set, get } from "idb-keyval";
import "blobatar/motion.css";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { GradientBackground } from "./GradientBackground";
import { pushVariants, screenSpring } from "../lib/motion";
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
import { BrandLogo } from "./brand/BrandLogo";
import { LiveStatus } from "./LiveStatus";
import { useReducedMotion } from "../lib/use-reduced-motion";
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

type PickResult = "ok" | "cancelled" | "error";

async function selectBackupSource(setStoragePersisted: Dispatch<SetStateAction<boolean | null>>): Promise<PickResult> {
  try {
    const directoryHandle = await window.showDirectoryPicker();

    await set('backupSource', directoryHandle);

    void requestPersistentStorage(setStoragePersisted);
    return "ok";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "cancelled" : "error";
  }
}

const steps = [1, 2, 3]
const stepLabels = ["Choose backup folder", "Install app", "Finish setup"]

const noopSubscribe = () => () => {};
const pickerSupportedSnapshot = () => "showDirectoryPicker" in window;
const pickerSupportedServer = () => true;

/** Focus an element on mount, but only if focus was lost (e.g. the previous step's button unmounted). */
function focusIfLost(el: HTMLElement | null) {
  if (!el) return;
  const active = document.activeElement;
  if (!active || active === document.body) el.focus();
}

interface StoragePersistenceProps {
  minimized: boolean;
  setMinimized: Dispatch<SetStateAction<boolean>>;
}

export function StoragePersistence({
  minimized = false,
  setMinimized = () => {},
}: StoragePersistenceProps) {
  const [done, setDone] = useState(false);
  const [, setStoragePersisted] = useState<boolean | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [prevStep, setPrevStep] = useState(currentStep);
  const [stepDir, setStepDir] = useState(1);
  const [picking, setPicking] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const pickerHintId = useId();
  const pickerSupported = useSyncExternalStore(noopSubscribe, pickerSupportedSnapshot, pickerSupportedServer);
  const minimizedByUser = useRef(false);
  // Latest setter in a ref so the mount-only init effect never needs to re-run.
  const setMinimizedRef = useRef(setMinimized);
  useEffect(() => {
    setMinimizedRef.current = setMinimized;
  }, [setMinimized]);

  // Focus the dialog heading whenever the overlay (re)appears.
  const focusHeading = useCallback((el: HTMLElement | null) => {
    el?.focus({ preventScroll: true });
  }, []);

  // Return focus to the minimized button when the user minimized the setup.
  const focusMinimizedButton = useCallback((el: HTMLElement | null) => {
    if (el && minimizedByUser.current) {
      minimizedByUser.current = false;
      el.focus();
    }
  }, []);
  if (prevStep !== currentStep) {
    setPrevStep(currentStep);
    setStepDir(currentStep > prevStep ? 1 : -1);
  }

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt().catch(() => {
      // prompt failed, user likely already has the app installed
    });
    const choice = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    if (choice.outcome === 'accepted') {
      setCurrentStep(3);
    }
  };

  const handleStep1 = async () => {
    if (picking || !pickerSupported) return;
    setPicking(true);
    setStatus(null);
    const result = await selectBackupSource(setStoragePersisted);
    if (result === "ok") setCurrentStep(2);
    else if (result === "cancelled") setStatus({ kind: "info", text: "No folder was selected. Choose a folder to continue, or skip setup." });
    else setStatus({ kind: "error", text: "Could not use that folder. Try a different folder, or skip setup." });
    setPicking(false);
  };

  const handleStep2Skip = () => {
    setCurrentStep(3);
  };

  const stepperContent = [
    <div key="step-select-folder" className="flex flex-col gap-8 max-md:w-full">
      <Button
        className={
          cx(
            "flex items-center gap-2 h-max p-3",
            "bg-blue-600 text-white rounded-md hover:bg-blue-700",
            "cursor-pointer w-full aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          )
        }
        aria-disabled={picking || !pickerSupported}
        aria-busy={picking}
        aria-describedby={!pickerSupported ? pickerHintId : undefined}
        onClick={handleStep1}
      >
        <IconFolderSymlink size={16} aria-hidden="true" />
        <span className="min-w-0 whitespace-normal break-words max-md:text-xs">Select a folder to store/import your backup</span>
      </Button>
      {!pickerSupported && (
        <p id={pickerHintId} className="text-xs leading-6 text-left text-slate-700">
          This browser cannot pick a backup folder. Use &quot;Continue without a backup&quot; below to start exploring.
        </p>
      )}
      {status && (
        <p
          role={status.kind === "error" ? "alert" : undefined}
          aria-hidden={status.kind === "info" ? true : undefined}
          className={cx("text-xs leading-6 text-left", status.kind === "error" ? "text-red-700" : "text-slate-700")}
        >
          {status.text}
        </p>
      )}
      <p className="text-xs leading-6 tracking-wide text-left">
        Your backup file <Kbd className="px-2 border mx-1 text-xs">backup.tar.gz</Kbd> will be created in the selected folder if it does not already exist.
      </p>
    </div>,
    <div key="step-install" className="flex flex-col gap-3 items-center w-full">
      <Button
        ref={focusIfLost}
        className={
          cx(
            "flex items-center gap-2 h-max w-full p-3",
            "bg-blue-600 text-white rounded-md hover:bg-blue-700",
            "cursor-pointer"
          )
        }
        onClick={handleInstall}
      >
        <IconDownload size={16} aria-hidden="true" />
        Install App
      </Button>
      <Button
        variant="ghost"
        onClick={handleStep2Skip}
        className={
          cx(
            "w-full min-h-12 cursor-pointer hover:bg-slate-100",
            "text-sm text-slate-700 hover:text-slate-900 underline"
          )
        }
      >
        Skip
      </Button>
    </div>,
    <div key="step-complete" className="flex flex-col gap-4 items-center w-full">
      <div className="text-sm text-slate-700 text-center">
        <p className="font-semibold mb-2">Setup complete!</p>
        <p className="text-xs">Your data is now secure and will persist across browser sessions.</p>
      </div>
      <Button
        ref={focusIfLost}
        className={
          cx(
            "flex items-center gap-2 h-max p-3",
            "bg-green-700 text-white rounded-md hover:bg-green-800",
            "cursor-pointer w-full"
          )
        }
        onClick={() => {
          setDone(true);
          setMinimized(true);
        }}
      >
        <IconCheck size={16} aria-hidden="true" />
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
      // Dev chunk URLs aren't content-hashed, so a cache-first SW serves stale JS and breaks hydration.
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Offline support is optional; ignore registration failures.
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.filter((key) => key.startsWith('boolstack-')).forEach((key) => caches.delete(key));
          });
        }
      }
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
          setMinimizedRef.current(true);
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
            exit={{ opacity: 0, x: "-30%" }}
            transition={screenSpring}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="fixed inset-0 z-[100]"
          >
            <GradientBackground
              showGrain={true}
              grainOpacity={0.15}
              className={
                cx(
                  "p-4 bg-black text-slate-100 w-full h-full flex",
                  "justify-center transition-all [&>[data-gradient-children]]:flex-1"
                )
              }
            >
              <div className="flex flex-1 flex-col items-start justify-end gap-4 w-full h-full max-w-screen-sm max-md:max-w-[340px] mx-auto">
                <div className="flex flex-1 flex-col items-start justify-end gap-4 w-full xl:justify-center">
                  <div className="flex-1 max-h-[180px] flex items-end justify-end">
                    <BrandLogo className="[@media(max-height:768px)]:mb-6" />
                  </div>
                  <div className="flex flex-col items-start justify-center gap-8 w-full mb-10">
                    <h1 id={headingId} ref={focusHeading} tabIndex={-1} className="font-medium text-4xl tracking-tight outline-none [@media(max-height:768px)]:sr-only">Your apps, your way. Start building today.</h1>
                    <Card className="w-full relative overflow-visible">
                      <Badge variant="secondary" className="absolute -top-3 left-0 border border-blue-800 bg-blue-950 text-blue-400 px-3 py-3 text-xs rounded-sm">
                        Initial Set-up
                      </Badge>
                      <CardContent className="p-4 pt-8 relative">
                        <div className="w-[calc(100%_-_2rem)] mx-auto flex items-center justify-center gap-10">
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
                                <IconLoader className="size-3.5 motion-safe:animate-spin" />
                              ),
                            }}
                          >
                            <StepperNav aria-label="Setup progress">
                              {steps.map((step) => (
                                <StepperItem key={step} step={step} disabled={step > currentStep} completed={step < currentStep} loading={false}>
                                  <StepperTrigger>
                                    <StepperIndicator className="bg-muted text-muted-foreground data-[state=completed]:bg-green-700 data-[state=completed]:text-white">
                                      {step}
                                    </StepperIndicator>
                                    <span className="sr-only">Step {step}: {stepLabels[step - 1]}</span>
                                  </StepperTrigger>
                                  {steps.length > step && (
                                    <StepperSeparator className="group-data-[state=completed]/step:bg-green-700" />
                                  )}
                                </StepperItem>
                              ))}
                            </StepperNav>

                            <LiveStatus
                              message={
                                status?.kind === "info"
                                  ? status.text
                                  : `Step ${currentStep} of ${steps.length}: ${stepLabels[currentStep - 1]}`
                              }
                            />
                            <div data-slot="stepper-panel" data-state={currentStep} className="w-full overflow-hidden">
                              <AnimatePresence mode="wait" initial={false} custom={stepDir}>
                                <motion.div
                                  key={currentStep}
                                  custom={stepDir}
                                  variants={pushVariants}
                                  initial="enter"
                                  animate="center"
                                  exit="exit"
                                  transition={screenSpring}
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
                      <hr aria-hidden="true" className="flex-grow border-t border-slate-700" />
                      <p className="text-xs whitespace-nowrap">Or, skip setup and start exploring</p>
                      <hr aria-hidden="true" className="flex-grow border-t border-slate-700" />
                    </div>

                    <div className="flex flex-col justify-center items-center gap-4 -mt-4 pb-4 w-full text-center">
                      <Button
                        className="bg-transparent text-slate-100 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-blue-400 cursor-pointer p-5 px-4 gap-3"
                        onClick={() => {
                          minimizedByUser.current = true;
                          setMinimized(true);
                        }}
                      >
                        Continue without a backup
                        <IconArrowRight size={16} aria-hidden="true" className="stroke-[1.25px] relative top-[1px]" />
                      </Button>
                      <Badge variant="destructive" className="h-auto! whitespace-normal! border border-red-900 bg-red-950! py-3 px-4 text-xs text-red-400">
                        <IconAlertHexagon aria-hidden="true" className="relative -left-0.5 max-md:scale-150" />
                        <span>
                          Without a backup file, your data will be <strong>lost</strong> if you clear your browser storage.
                        </span>
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
            className="absolute bottom-0 left-0 m-4 z-10"
          >
            <Button
              ref={focusMinimizedButton}
              onClick={() => setMinimized(false)}
              aria-label="Backup not set up. Open setup"
              size="icon"
              className="p-6 hover:bg-yellow-950 bg-slate-900 border border-yellow-900 cursor-pointer motion-safe:transition-transform motion-safe:hover:-translate-y-1 focus-visible:ring-blue-400"
            >
              <div aria-hidden="true" className="text-yellow-600 z-10 h-6 w-6 flex items-end justify-end absolute right-1.5 bottom-1.5 rounded-md">
                <IconAlertTriangle size={16} />
              </div>
              <div aria-hidden="true" className="relative scale-200 flex items-center justify-center">
                <Grid
                  size="14"
                  speed={reduceMotion ? "0" : "2"}
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