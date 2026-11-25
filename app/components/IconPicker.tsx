"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { IconSearch, type TablerIcon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { LiveStatus } from "./LiveStatus"
import { useRovingRadio } from "../lib/use-roving-radio"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  isTablerIconName,
  loadTablerIcons,
  tablerIconLabel,
  toSearchKey,
  type TablerIconMap,
} from "../lib/tabler-icons"

const MAX_RESULTS = 120
const GRID_COLUMNS = 6 // keep in sync with grid-cols-6 below

type IconPickerProps = {
  id?: string
  value?: string
  onChange: (name: string) => void
}

export function IconPicker({ id, value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const [icons, setIcons] = useState<TablerIconMap>()

  const names = useMemo(
    () => (icons ? Object.keys(icons).filter(isTablerIconName) : []),
    [icons],
  )

  const matches = useMemo(() => {
    const key = toSearchKey(deferredQuery)
    return key ? names.filter((name) => toSearchKey(name).includes(key)) : names
  }, [names, deferredQuery])

  const visible = useMemo(
    () => (icons ? matches.slice(0, MAX_RESULTS).filter((name) => icons[name]) : []),
    [icons, matches],
  )

  const roving = useRovingRadio({
    count: visible.length,
    selectedIndex: value ? visible.indexOf(value) : -1,
    onSelect: () => {},
    columns: GRID_COLUMNS,
    selectOnMove: false,
  })

  const statusMessage = !icons
    ? "Loading icons"
    : visible.length === 0
      ? "No icons found"
      : `Showing ${visible.length} of ${matches.length}`

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      loadTablerIcons().then(setIcons)
    }
  }

  const handleSelect = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={value ? `Icon: ${tablerIconLabel(value)}` : "Choose an icon"}
          className="w-full justify-start gap-2"
        >
          {value ? (
            <ArtifactIcon icon={value} className="size-4" />
          ) : null}
          <span>{value ? tablerIconLabel(value) : "Choose an icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex flex-col gap-3">
          <InputGroup>
            <InputGroupInput
              aria-label="Search icons"
              placeholder="Search icons"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              {icons ? <IconSearch aria-hidden="true" /> : <Spinner aria-hidden="true" />}
            </InputGroupAddon>
          </InputGroup>

          <ScrollArea className="h-64">
            {icons && visible.length === 0 ? (
              <div aria-hidden="true">
                <Empty className="p-4">
                  <EmptyHeader>
                    <EmptyTitle>No icons found</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <TooltipProvider>
                <div
                  role="radiogroup"
                  aria-label="Icons"
                  className="grid grid-cols-6 gap-1 pr-3"
                  {...roving.groupProps}
                >
                  {visible.map((name, index) => {
                    const Icon = icons?.[name]
                    if (!Icon) {
                      return null
                    }
                    const label = tablerIconLabel(name)
                    return (
                      <Tooltip key={name}>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant={name === value ? "secondary" : "ghost"}
                            aria-label={label}
                            {...roving.getItemProps(index)}
                            onClick={() => handleSelect(name)}
                          >
                            <Icon aria-hidden="true" className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </TooltipProvider>
            )}
          </ScrollArea>

          <LiveStatus
            visible
            className="text-muted-foreground text-xs"
            message={statusMessage}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

type ArtifactIconProps = {
  icon: string
  className?: string
}

// Renders a stored Tabler icon name, or falls back to text for legacy emoji values.
export function ArtifactIcon({ icon, className }: ArtifactIconProps) {
  const [entry, setEntry] = useState<{ name: string; Icon: TablerIcon }>()
  const isTabler = isTablerIconName(icon)

  useEffect(() => {
    if (!isTabler) {
      return
    }
    let active = true
    loadTablerIcons().then((icons) => {
      const Icon = icons[icon]
      if (active && Icon) {
        setEntry({ name: icon, Icon })
      }
    })
    return () => {
      active = false
    }
  }, [icon, isTabler])

  if (!isTabler) {
    return (
      <span aria-hidden="true" className={className}>
        {icon}
      </span>
    )
  }

  if (entry?.name !== icon) {
    return null
  }

  const { Icon } = entry
  return <Icon aria-hidden="true" className={className} />
}
