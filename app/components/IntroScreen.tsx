'use client';

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { BrandLogo } from "./brand/BrandLogo";

export type IntroTarget = 'setup' | 'dashboard' | null;

type IntroScreenProps = {
  target: IntroTarget;
  onDone: () => void;
};

const IN_EASE = [0.2, 0.8, 0.2, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
const TARGET_TIMEOUT = 4000;
const POLL_MS = 50;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function IntroScreen({ target, onDone }: IntroScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<IntroTarget>(target);
  const onDoneRef = useRef(onDone);
  const skipRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    targetRef.current = target;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const root = rootRef.current;
    const bg = bgRef.current;
    const logo = logoRef.current;
    const spinner = spinnerRef.current;
    if (!root || !bg || !logo || !spinner) return;

    if (document.documentElement.dataset.intro !== 'play') {
      onDoneRef.current();
      return;
    }

    let finished = false;
    let skipped = false;
    let cancelled = false;
    const controls: { stop: () => void }[] = [];
    const run = (c: { stop: () => void; then: (r: () => void) => unknown }) => {
      controls.push(c);
      return new Promise<void>((resolve) => c.then(resolve));
    };
    const stopAll = () => controls.splice(0).forEach((c) => c.stop());
    const aborted = () => cancelled || skipped || finished;

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      delete document.documentElement.dataset.intro;
      window.dispatchEvent(new CustomEvent('intro:done'));
      onDoneRef.current();
    };

    const skip = () => {
      if (skipped || finished || cancelled) return;
      skipped = true;
      stopAll();
      animate(root, { opacity: 0 }, { duration: 0.25, ease: 'easeOut' }).then(finish);
    };
    skipRef.current = skip;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('intro:done', skip);
    root.focus({ preventScroll: true });

    const sequence = async () => {
      const start = performance.now();
      const minSpin = 500 + Math.random() * 1000;

      // Large intro logo: ~420px wide on desktop, 80% of viewport width on mobile (BrandLogo md is ~110px wide).
      const scale = Math.max(1, Math.min(window.innerWidth * 0.8, 420) / logo.offsetWidth);
      await run(animate(logo, { opacity: [0, 1], y: [16, 0], scale: [scale, scale] }, { duration: 0.5, ease: IN_EASE }));
      if (aborted()) return;

      run(animate(spinner, { opacity: 1 }, { duration: 0.25 }));
      const spinStart = performance.now();
      while (
        !aborted() &&
        (performance.now() - spinStart < minSpin || targetRef.current === null) &&
        performance.now() - start < TARGET_TIMEOUT
      ) {
        await sleep(POLL_MS);
      }
      if (aborted()) return;

      await run(animate(spinner, { opacity: 0 }, { duration: 0.15 }));
      if (aborted()) return;

      const t = targetRef.current;
      if (!t) {
        // No target known in time: fade out in place.
        await run(animate(root, { opacity: 0 }, { duration: 0.4, ease: 'easeOut' }));
        if (!aborted()) finish();
        return;
      }

      // Target may be mid-layout: measure after two frames.
      await nextFrame();
      await nextFrame();
      if (aborted()) return;
      const el = document.querySelector<HTMLElement>(`[data-logo-target="${t}"]`);
      if (!el) {
        await run(animate(root, { opacity: 0 }, { duration: 0.4, ease: 'easeOut' }));
        if (!aborted()) finish();
        return;
      }
      const a = logo.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const opts = { duration: 0.7, ease: EASE_IN_OUT };
      await Promise.all([
        run(animate(logo, { x: dx, y: dy, scale: 1 }, opts)),
        run(animate(bg, { opacity: 0 }, opts)),
      ]);
      if (!aborted()) finish();
    };
    void sequence();

    return () => {
      cancelled = true;
      stopAll();
      skipRef.current = null;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('intro:done', skip);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Loading Boolstack"
      tabIndex={-1}
      onClick={() => skipRef.current?.()}
      className="fixed inset-0 z-[9999] flex items-center justify-center outline-none"
    >
      <div
        ref={bgRef}
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--color-brand-black)' }}
      />
      <div className="relative flex flex-col items-center">
        <div ref={logoRef} style={{ opacity: 0 }}>
          <BrandLogo color="#E6E3DA" />
        </div>
      </div>
      <div
        ref={spinnerRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="absolute bottom-1/4 left-1/2 -ml-3 size-6 rounded-full border-2 border-[#E6E3DA] border-t-transparent motion-safe:animate-spin"
      />
    </div>
  );
}
