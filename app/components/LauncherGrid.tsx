'use client';

import { useRef, useState } from "react";
import { IconAdjustmentsHorizontal, IconPencil, IconTrash } from "@tabler/icons-react";
import { Artifact } from "../lib/types";
import { AppIcon } from "./app-icon";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;
const manageButton =
  "absolute -top-2 z-10 grid size-8 place-items-center rounded-full border border-slate-600 bg-slate-900 text-slate-100 outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-400";

type Props = {
  artifacts: Artifact[];
  onOpen: (artifact: Artifact) => void;
  onEdit: (artifact: Artifact) => void;
  onDelete: (artifact: Artifact) => void;
};

/** Android-style launcher: icon tile + label per app; long-press for actions. */
export function LauncherGrid({ artifacts, onOpen, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const longFired = useRef(false);
  const editRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const actedRef = useRef(false);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  const showMenu = (artifact: Artifact) => {
    longFired.current = true;
    actedRef.current = false;
    setSelected(artifact);
    setOpen(true);
  };

  const onPointerDown = (e: React.PointerEvent, artifact: Artifact) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    longFired.current = false;
    clearTimer();
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      timer.current = null;
      showMenu(artifact);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || !timer.current) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) clearTimer();
  };

  const onClick = (e: React.MouseEvent, artifact: Artifact) => {
    if (longFired.current) {
      e.preventDefault();
      longFired.current = false;
      return;
    }
    onOpen(artifact);
  };

  const act = (fn: (a: Artifact) => void) => {
    if (!selected) return;
    actedRef.current = true;
    setOpen(false);
    fn(selected);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          aria-pressed={manage}
          onClick={() => setManage((m) => !m)}
          className="inline-flex min-h-8 items-center gap-2 rounded-full border border-slate-600 px-4 text-xs text-slate-100 outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-400 aria-pressed:border-blue-400 aria-pressed:bg-slate-800"
        >
          <IconAdjustmentsHorizontal size={16} aria-hidden="true" />
          Manage apps
        </button>
      </div>
      <ul ref={gridRef} role="list" className="grid grid-cols-4 max-[359px]:grid-cols-3 gap-x-2 gap-y-6 justify-items-center">
        {artifacts.map((artifact) => (
          <li key={artifact.namespace} className="relative">
            <button
              type="button"
              data-artifact-trigger={artifact.namespace}
              aria-keyshortcuts="Shift+F10"
              className="select-none rounded-xl outline-none motion-safe:transition-transform motion-safe:active:scale-90 focus-visible:ring-2 focus-visible:ring-blue-400 [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
              onPointerDown={(e) => onPointerDown(e, artifact)}
              onPointerMove={onPointerMove}
              onPointerUp={clearTimer}
              onPointerCancel={clearTimer}
              onPointerLeave={clearTimer}
              onContextMenu={(e) => {
                e.preventDefault();
                clearTimer();
                showMenu(artifact);
              }}
              onClick={(e) => onClick(e, artifact)}
            >
              <AppIcon
                title={artifact.namespace}
                icon={artifact.icon}
                color={artifact.color}
                variant={artifact.mobile_variant}
                size="md"
                showLabel
              />
            </button>
            {manage && (
              <>
                <button
                  type="button"
                  aria-label={`Edit ${artifact.namespace}`}
                  onClick={() => onEdit(artifact)}
                  className={manageButton + " -left-1"}
                >
                  <IconPencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${artifact.namespace}`}
                  onClick={() => onDelete(artifact)}
                  className={manageButton + " -right-1 text-red-300"}
                >
                  <IconTrash size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {artifacts.length > 0 && (
        <p className="mt-8 text-center text-xs text-slate-400">
          Hold an app or press Shift+F10 for options, or use Manage apps
        </p>
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          className="border-slate-800 bg-slate-950 text-slate-100"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            editRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            // Edit/Delete open their own dialog, which manages focus (and returns it to the tile).
            if (actedRef.current) return;
            const ns = selected?.namespace;
            Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-artifact-trigger]") ?? [])
              .find((el) => el.dataset.artifactTrigger === ns)
              ?.focus();
          }}
        >
          <DrawerTitle className="sr-only">{selected?.namespace ?? "App options"}</DrawerTitle>
          <DrawerDescription className="sr-only">Options for this app</DrawerDescription>
          {selected && (
            <div className="flex flex-col gap-2 p-4 pb-8">
              <div className="mb-2 flex justify-center">
                <AppIcon
                  title={selected.namespace}
                  icon={selected.icon}
                  color={selected.color}
                  variant={selected.mobile_variant}
                  size="sm"
                  showLabel
                />
              </div>
              <button
                ref={editRef}
                type="button"
                className="flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-400"
                onClick={() => act(onEdit)}
              >
                <IconPencil size={18} aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                className="flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm text-red-400 outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-400"
                onClick={() => act(onDelete)}
              >
                <IconTrash size={18} aria-hidden="true" />
                Delete
              </button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
