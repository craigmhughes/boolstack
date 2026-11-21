"use client";

import { IconAlertHexagon, IconPlus } from "@tabler/icons-react";
import { Grid } from "ldrs/react";
import "ldrs/react/Grid.css";
import { Button } from "@/components/ui/button";
import { injectPreviewShim } from "../lib/registry-preview";
import type { RegistryApp } from "../lib/registry-types";
import { AppIcon } from "./app-icon";
import { BrandHeading, BrandTag } from "./brand";
import { FeatureCard } from "./feature-card";

export function RegistryInfoPanel({
  app,
  ready,
  onAdd,
  onBack,
}: {
  app: RegistryApp;
  ready: boolean;
  onAdd: () => void;
  onBack: () => void;
}) {
  return (
    <aside className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
      <div className="flex flex-col gap-4">
        <AppIcon title={app.name} icon={app.icon} color={app.color} variant={app.mobile_variant} size="lg" className="self-start" />
        <FeatureCard
          preview
          title={app.name}
          icon={app.icon}
          color={app.color}
          variant={app.variant}
          className="max-lg:hidden"
        />
      </div>
      <BrandHeading as="h2" className="text-3xl">{app.name}</BrandHeading>
      <p className="text-sm text-slate-400">{app.description}</p>
      <div className="flex flex-col gap-2">
        <BrandTag className="self-start">Preview</BrandTag>
        <p className="text-xs text-slate-400">
          Nothing you do here is saved. Add the app to your library to keep its data.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={!ready}
          onClick={onAdd}
          className="h-auto w-full cursor-pointer rounded-md bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <IconPlus />
          Add to my apps
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full cursor-pointer bg-transparent text-slate-100 hover:bg-slate-800 hover:text-slate-100"
        >
          Back to registry
        </Button>
      </div>
    </aside>
  );
}

export function RegistryPreviewFrame({
  app,
  html,
  error,
  onRetry,
}: {
  app: RegistryApp;
  html: string | null;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="h-[70dvh] min-h-0 w-full shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-white lg:h-[calc(100dvh-7.5rem)] lg:min-h-[480px] lg:flex-1">
      {html !== null ? (
        <iframe
          title={`${app.name} preview`}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          srcDoc={injectPreviewShim(html)}
          className="size-full border-0 bg-white"
        />
      ) : error ? (
        <div className="flex size-full flex-col items-center justify-center gap-4 bg-black p-6">
          <ErrorBadge message={error} />
          <Button type="button" onClick={onRetry} className="cursor-pointer bg-blue-500 text-white hover:bg-blue-600">
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex size-full items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-8" aria-live="polite">
            <Grid size="60" speed="1.5" color="white" />
            <p className="text-[11px] tracking-wider text-slate-400">Loading preview...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBadge({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex max-w-md items-center gap-2 rounded-md border border-red-900 bg-red-950 px-4 py-3 text-[11px] text-red-400"
    >
      <IconAlertHexagon size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
