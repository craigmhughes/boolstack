'use client';

import { useRef, useState } from "react";
import { IconPencil, IconTrash } from "@tabler/icons-react";
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

type Props = {
  artifacts: Artifact[];
  onOpen: (artifact: Artifact) => void;
  onEdit: (artifact: Artifact) => void;
  onDelete: (artifact: Artifact) => void;
};

/** Android-style launcher: icon tile + label per app; long-press for actions. */
export function LauncherGrid({ artifacts, onOpen, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const longFired = useRef(false);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };

  const showMenu = (artifact: Artifact) => {
    longFired.current = true;
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
    setOpen(false);
    fn(selected);
  };

  return (
    <>
      <div className="grid grid-cols-4 max-[359px]:grid-cols-3 gap-x-2 gap-y-6 justify-items-center">
        {artifacts.map((artifact) => (
          <button
            key={artifact.namespace}
            type="button"
            aria-label={artifact.namespace}
            className="select-none rounded-xl outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-blue-500 [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
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
        ))}
      </div>
      {artifacts.length > 0 && (
        <p className="mt-8 text-center text-[11px] text-slate-500">Hold an app for options</p>
      )}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-slate-800 bg-slate-950 text-slate-100">
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
                type="button"
                className="flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm hover:bg-slate-800"
                onClick={() => act(onEdit)}
              >
                <IconPencil size={18} />
                Edit
              </button>
              <button
                type="button"
                className="flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800"
                onClick={() => act(onDelete)}
              >
                <IconTrash size={18} />
                Delete
              </button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
