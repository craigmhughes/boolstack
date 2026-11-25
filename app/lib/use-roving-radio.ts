import { useRef, useState } from "react"
import type { KeyboardEvent } from "react"

type Options = {
  /** Number of options in the group. */
  count: number
  /** Index of the checked option, or -1 when none. */
  selectedIndex: number
  /** Called when an option is chosen by keyboard (or all moves when selectOnMove). */
  onSelect: (index: number) => void
  /** Items per row for Up/Down movement. Defaults to 1 (Up/Down behave like Left/Right). */
  columns?: number
  /**
   * When true (default, native radio behaviour) arrow keys also select.
   * When false arrows only move focus; Space/Enter (click) selects.
   */
  selectOnMove?: boolean
}

/**
 * Roving-tabindex helper for role="radiogroup" widgets. Spread `groupProps`
 * on the container and `getItemProps(i)` on each role="radio" element.
 * Arrow keys move (wrapping), Home/End jump to the first/last option.
 */
export function useRovingRadio({
  count,
  selectedIndex,
  onSelect,
  columns = 1,
  selectOnMove = true,
}: Options) {
  const groupRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)

  const tabbable = Math.min(
    Math.max(
      selectOnMove
        ? selectedIndex >= 0
          ? selectedIndex
          : 0
        : (active ?? (selectedIndex >= 0 ? selectedIndex : 0)),
      0,
    ),
    Math.max(count - 1, 0),
  )

  function move(index: number) {
    setActive(index)
    if (selectOnMove) onSelect(index)
    const items = groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')
    items?.[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    let next: number | null = null
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % count
        break
      case "ArrowLeft":
        next = (index - 1 + count) % count
        break
      case "ArrowDown":
        next = index + columns < count ? index + columns : columns === 1 ? 0 : index % columns
        break
      case "ArrowUp":
        next =
          index - columns >= 0
            ? index - columns
            : columns === 1
              ? count - 1
              : Math.min(count - 1, index + Math.floor((count - 1 - (index % columns)) / columns) * columns)
        break
      case "Home":
        next = 0
        break
      case "End":
        next = count - 1
        break
      default:
        return
    }
    event.preventDefault()
    if (next !== null) move(next)
  }

  return {
    groupProps: { ref: groupRef },
    getItemProps: (index: number) => ({
      role: "radio" as const,
      "aria-checked": index === selectedIndex,
      tabIndex: index === tabbable ? 0 : -1,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => onKeyDown(event, index),
      onFocus: () => setActive(index),
    }),
  }
}
