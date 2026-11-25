"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconArrowLeft, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fetchRegistryApps, fetchRegistryHtml } from "../lib/registry-client";
import type { RegistryApp } from "../lib/registry-types";
import { AppIcon } from "./app-icon";
import { ArtifactEdit } from "./ArtifactEdit";
import { BrandHeading, BrandTag } from "./brand";
import { BrandLogoMotion } from "./brand/BrandLogoMotion";
import { FeatureCard } from "./feature-card";
import { GradientBackground } from "./GradientBackground";
import { headerVariants, pushVariants, screenSpring } from "../lib/motion";
import { ErrorBadge, RegistryInfoPanel, RegistryPreviewFrame } from "./RegistryPreview";

const MOBILE_QUERY = "(max-width: 639px)";

function subscribeMobile(cb: () => void) {
  const m = window.matchMedia(MOBILE_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/** True below 640px (launcher layout). SSR default is the desktop layout. */
function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
}

const NARROW_QUERY = "(max-width: 359px)";

function subscribeNarrow(cb: () => void) {
  const m = window.matchMedia(NARROW_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

function useIsNarrow() {
  return useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW_QUERY).matches, () => false);
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

const ghostOnBlack = "cursor-pointer bg-transparent text-slate-100 hover:bg-slate-800 hover:text-slate-100";

export function RegistryBrowser({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element | null {
  // The overlay is mounted only while open, so every open starts from fresh state.
  return <AnimatePresence>{open && <RegistryOverlay key="registry" onOpenChange={onOpenChange} />}</AnimatePresence>;
}

function RegistryOverlay({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const isMobile = useIsMobile();
  const isNarrow = useIsNarrow();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [attempt, setAttempt] = useState(0);
  const [listResult, setListResult] = useState<{ attempt: number; apps?: RegistryApp[]; error?: string } | null>(null);
  const [selected, setSelected] = useState<RegistryApp | null>(null);
  const [dir, setDir] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [htmls, setHtmls] = useState<Record<string, string>>({});
  const [htmlAttempt, setHtmlAttempt] = useState(0);
  const [htmlError, setHtmlError] = useState<{ slug: string; attempt: number; error: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const slug = selected?.slug ?? null;
  const html = slug ? (htmls[slug] ?? null) : null;
  const hasHtml = html !== null;

  // Focus management and body scroll lock.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // App list.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchRegistryApps(ctrl.signal).then(
      (apps) => {
        if (!ctrl.signal.aborted) setListResult({ attempt, apps });
      },
      (e) => {
        if (!ctrl.signal.aborted) setListResult({ attempt, error: message(e) });
      },
    );
    return () => ctrl.abort();
  }, [attempt]);

  // Preview HTML (cached per slug for this open session).
  useEffect(() => {
    if (!slug || hasHtml) return;
    const ctrl = new AbortController();
    fetchRegistryHtml(slug, ctrl.signal).then(
      (text) => {
        if (!ctrl.signal.aborted) setHtmls((prev) => ({ ...prev, [slug]: text }));
      },
      (e) => {
        if (!ctrl.signal.aborted) setHtmlError({ slug, attempt: htmlAttempt, error: message(e) });
      },
    );
    return () => ctrl.abort();
  }, [slug, hasHtml, htmlAttempt]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const back = useCallback(() => {
    setDir(-1);
    setSelected(null);
  }, []);

  // Start each screen at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [slug]);

  // Mirror `adding` into a ref so the Escape listener never reads a stale value.
  const addingRef = useRef(adding);
  useEffect(() => {
    addingRef.current = adding;
  }, [adding]);

  useEffect(() => {
    // Capture phase on window runs before Radix's document-level Escape handling,
    // so an Escape meant for the Add dialog is seen while it is still open.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || addingRef.current) return;
      if (selected) back();
      else close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selected, back, close]);

  const listLoading = !listResult || listResult.attempt !== attempt;
  const apps = listResult && !listLoading ? listResult.apps : undefined;
  const listError = listResult && !listLoading ? listResult.error : undefined;
  const previewError =
    slug && !hasHtml && htmlError && htmlError.slug === slug && htmlError.attempt === htmlAttempt
      ? htmlError.error
      : null;

  const select = (app: RegistryApp) => {
    setHtmlError(null);
    setDir(1);
    setSelected(app);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="App registry"
      variants={pushVariants}
      custom={1}
      initial="enter"
      animate="center"
      exit={{ x: "100%" }}
      transition={screenSpring}
      className="fixed inset-0 z-50 flex flex-col bg-black text-slate-100"
    >
      <GradientBackground className="!fixed !inset-0 !min-h-0 -z-10 pointer-events-none" />
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate="shown"
        exit="hidden"
        transition={{ ...screenSpring, delay: 0.08 }}
        className="box-content flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3 pt-[env(safe-area-inset-top)] sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <AnimatePresence initial={false}>
            {selected && (
              <motion.div
                key="back"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={screenSpring}
              >
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Back to registry"
                  className={ghostOnBlack}
                  onClick={back}
                >
                  <IconArrowLeft />
                  <span>Back</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={selected ? "max-sm:hidden" : undefined}>
            <BrandLogoMotion size="sm" />
          </div>
        </div>
        <Button ref={closeRef} variant="ghost" aria-label="Close registry" className={ghostOnBlack} onClick={close}>
          <IconX />
          <span className="max-md:hidden">Close</span>
        </Button>
      </motion.header>

      <div ref={scrollRef} className="relative flex-1 overflow-x-hidden overflow-y-auto">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
        {selected ? (
          <motion.div
            key={selected.slug}
            custom={dir}
            variants={pushVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={screenSpring}
            className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-6 sm:px-6 lg:min-h-full lg:flex-row lg:px-10"
          >
            <RegistryInfoPanel
              app={selected}
              ready={hasHtml}
              onAdd={() => setAdding(true)}
              onBack={back}
            />
            <RegistryPreviewFrame
              app={selected}
              html={html}
              error={previewError}
              onRetry={() => {
                setHtmlError(null);
                setHtmlAttempt((n) => n + 1);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            custom={dir}
            variants={pushVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={screenSpring}
            className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-10"
          >
            <div className="flex flex-wrap items-center gap-3">
              <BrandHeading as="h2" className="max-sm:text-3xl">Registry</BrandHeading>
              {apps && <BrandTag>{apps.length} {apps.length === 1 ? "app" : "apps"}</BrandTag>}
            </div>
            <p className="mt-3 mb-6 max-w-xl text-sm text-slate-400">
              Ready-made apps you can add to your library. A copy is stored in your local database, so it keeps
              working even if it changes or is removed from the registry.
            </p>

            {listLoading ? (
              <div
                aria-live="polite"
                aria-busy="true"
                className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              >
                <span className="sr-only">Loading registry...</span>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[230px] animate-pulse rounded-[24px] bg-slate-800/60" />
                ))}
              </div>
            ) : listError ? (
              <div className="flex flex-col items-start gap-4">
                <ErrorBadge message={listError} />
                <Button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                >
                  Retry
                </Button>
              </div>
            ) : apps && apps.length === 0 ? (
              <Card className="relative w-full max-w-xl overflow-visible">
                <BrandTag className="absolute -top-3 left-0">Empty</BrandTag>
                <CardContent className="p-4 pt-8">
                  <p>The registry has no apps right now.</p>
                </CardContent>
              </Card>
            ) : isMobile ? (
              <div
                className={`grid ${isNarrow ? "grid-cols-3" : "grid-cols-4"} justify-items-center gap-x-2 gap-y-6`}
              >
                {apps?.map((app) => (
                  <button
                    key={app.slug}
                    type="button"
                    onClick={() => select(app)}
                    className="cursor-pointer rounded-xl p-1 outline-none focus-visible:ring-3 focus-visible:ring-blue-500/60"
                  >
                    <AppIcon
                      showLabel
                      title={app.name}
                      icon={app.icon}
                      color={app.color}
                      variant={app.mobile_variant}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {apps?.map((app) => (
                  <FeatureCard
                    key={app.slug}
                    title={app.name}
                    description={app.description}
                    icon={app.icon}
                    color={app.color}
                    variant={app.variant}
                    onClick={() => select(app)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <Dialog open={adding && !!selected && hasHtml} onOpenChange={setAdding}>
        <DialogContent className="md:max-w-[min(56rem,calc(100%-2rem))]">
          <DialogTitle className="sr-only">Add {selected?.name} to my apps</DialogTitle>
          <DialogDescription className="sr-only">Add a copy of this app to your library.</DialogDescription>
          {selected && html !== null && (
            <ArtifactEdit
              key={selected.slug}
              template={{
                name: selected.name,
                description: selected.description,
                htmlfile: html,
                icon: selected.icon,
                color: selected.color,
                variant: selected.variant,
                mobile_variant: selected.mobile_variant,
              }}
              onSaved={() => {
                setAdding(false);
                onOpenChange(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
