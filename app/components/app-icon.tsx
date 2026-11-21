'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { inkForColor } from '../lib/color'
import { ArtifactIcon } from './IconPicker'

export const appIconVariantNames = ['squircle', 'circle', 'rounded', 'gradient', 'outline', 'glass']

export type AppIconSize = 'sm' | 'md' | 'lg'

export type AppIconProps = {
  title: string
  icon: string
  color?: string
  variant?: number
  size?: AppIconSize
  showLabel?: boolean
  className?: string
}

const tilePx: Record<AppIconSize, number> = { sm: 44, md: 60, lg: 76 }
// ~45% of the tile; static strings so Tailwind can see them
const glyphClass: Record<AppIconSize, string> = {
  sm: 'size-5 text-xl leading-none',
  md: 'size-[27px] text-[27px] leading-none',
  lg: 'size-[34px] text-[34px] leading-none',
}

export function AppIcon({
  title,
  icon,
  color = '#ff5003',
  variant = 1,
  size = 'md',
  showLabel = false,
  className,
}: AppIconProps) {
  const v = Math.min(6, Math.max(1, Math.round(Number(variant)) || 1))
  const tile = tilePx[size]

  let shape = 'rounded-[28%]'
  let style: CSSProperties = { backgroundColor: color, color: inkForColor(color) }
  let extra = ''

  if (v === 2) shape = 'rounded-full'
  else if (v === 3) shape = 'rounded-xl'
  else if (v === 4) {
    style = {
      backgroundImage: `linear-gradient(145deg, color-mix(in srgb, ${color} 70%, white), ${color} 55%, color-mix(in srgb, ${color} 75%, black))`,
      color: inkForColor(color),
    }
    extra = 'shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_14px_rgba(0,0,0,.45)]'
  } else if (v === 5) {
    style = { borderColor: color, color }
    extra = 'bg-black border-2'
  } else if (v === 6) {
    style = {
      backgroundColor: `color-mix(in srgb, ${color} 28%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
      color: `color-mix(in srgb, ${color} 40%, white)`,
    }
    extra = 'border backdrop-blur-md'
  }

  return (
    <div
      className={cn('flex flex-col items-center gap-[6px]', className)}
      style={{ width: tile + 16 }}
    >
      <div
        aria-hidden="true"
        className={cn('flex shrink-0 items-center justify-center', shape, extra)}
        style={{ width: tile, height: tile, ...style }}
      >
        <ArtifactIcon icon={icon} className={glyphClass[size]} />
      </div>
      {showLabel && (
        <span className="text-[11px] leading-tight text-slate-100 text-center line-clamp-2 break-words w-full">
          {title}
        </span>
      )}
    </div>
  )
}
