import type { TargetAndTransition, Transition, Variants } from "motion/react";

export const screenSpring: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.45,
};

export const LOGO_LAYOUT_ID = "brand-logo";

/** Use with `custom={dir}`: 1 = forward, -1 = back. */
export const pushVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-30%",
    opacity: dir > 0 ? 1 : 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-30%" : "100%",
    opacity: dir > 0 ? 0 : 1,
  }),
};

export const headerVariants: Variants = {
  hidden: { y: "-100%", opacity: 0 },
  shown: { y: 0, opacity: 1 },
};

export function recedeAnimate(active: boolean): TargetAndTransition {
  return { x: active ? "-30%" : 0, opacity: active ? 0 : 1 };
}
