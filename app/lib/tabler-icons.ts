import type { TablerIcon } from "@tabler/icons-react"

export type TablerIconMap = Record<string, TablerIcon | undefined>

let iconsPromise: Promise<TablerIconMap> | undefined

// Loaded on demand so the full icon set stays out of the initial bundle.
export function loadTablerIcons(): Promise<TablerIconMap> {
  iconsPromise ??= import("@tabler/icons-react").then(
    (module) => module.icons as unknown as TablerIconMap,
  )
  return iconsPromise
}

export function isTablerIconName(value: string): boolean {
  return value.startsWith("Icon")
}

// "IconArrowLeftFilled" -> "Arrow Left Filled"
export function tablerIconLabel(name: string): string {
  return name.slice(4).replace(/([a-z0-9])([A-Z])/g, "$1 $2")
}

// Lowercase, no "Icon" prefix, no spaces or hyphens, so "arrow left" matches "IconArrowLeft".
export function toSearchKey(value: string): string {
  return value.replace(/^icon/i, "").replace(/[\s-]+/g, "").toLowerCase()
}
