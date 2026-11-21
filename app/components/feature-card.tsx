import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Blocks,
  BookOpen,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  Code2,
  Compass,
  Grid2X2,
  HeartPulse,
  type LucideIcon,
  Layers3,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Palette,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const iconMap: Record<string, LucideIcon> = {
  Activity, ArrowUpRight, BarChart3, Bell, Blocks, BookOpen, CalendarDays,
  Check, CircleHelp, Clock3, Code2, Compass, Grid2X2, HeartPulse, Layers3,
  Lightbulb, LockKeyhole, MessageCircle, Moon, MoreHorizontal, Palette, Rocket,
  Search, Settings2, ShieldCheck, Sparkles, Star, Target, Users, Zap,
}

export type FeatureCardVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | number

export type FeatureCardProps = {
  title: string
  icon: string
  description?: string
  color?: string
  variant?: FeatureCardVariant
  className?: string
  onClick?: () => void
  onDelete?: () => void | Promise<void>
}

const base = {
  root: `
    relative flex min-h-[230px] min-[561px]:min-h-[260px] flex-col justify-between overflow-hidden
    rounded-[24px] border bg-(--card-accent) border-[#101010]/12 p-[22px] text-(--card-ink)
    shadow-[0_5px_0_rgba(16,16,16,.16)] transition-[transform,box-shadow] duration-250 ease-in-out
    hover:-translate-y-1 hover:shadow-[0_9px_0_rgba(16,16,16,.14)] transition-all
  `,
  icon: 'grid size-[52px] place-items-center rounded-2xl bg-(--card-icon) text-(--card-accent) [&_svg]:size-[27px]',
  title: 'max-w-[230px] text-[length:clamp(1.45rem,2.2vw,2.2rem)] leading-[.95] font-medium tracking-[-.06em]',
  description: 'mt-3 max-w-[235px] text-[13px] leading-[1.4] text-[rgba(27,27,25,.68)]',
  delete: 'absolute top-5 right-5 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100',
}

// Per-variant overrides, merged over `base` by cn (tailwind-merge resolves conflicts)
const variants: Record<string, Partial<typeof base> & { arrow?: string }> = {
  'icon-led': {
    icon: 'size-[90px] rounded-3xl [&_svg]:size-[50px] bg-black',
  },
  'title-led': {
    root: 'justify-end',
    icon: 'absolute top-5 right-5 size-[38px] bg-transparent text-black',
    title: 'text-[length:clamp(2rem,3vw,3.2rem)] leading-[1]',
    delete: 'left-5 right-auto',
  },
  wide: {
    root: 'col-span-1 min-[561px]:col-span-2 flex-row items-end',
    icon: 'size-[76px] self-start rounded-[22px] [&_svg]:size-[38px] bg-black',
  },
  slimline: {
    root: 'col-span-1 min-[561px]:col-span-2 min-h-[120px] min-[561px]:min-h-[122px] flex-row items-center gap-[18px] pr-[62px]',
    icon: 'shrink-0 bg-black',
    description: 'mt-1.5',
    delete: 'top-1/2 -mt-3.5',
  },
  split: {
    root: 'justify-end',
    icon: 'absolute right-5 top-5 size-[105px] rounded-full bg-transparent text-(--card-icon) [&_svg]:size-24 rotate-15',
    delete: 'left-5 right-auto',
  },
  outlined: {
    root: 'border-[#101010] bg-[#fffaf2]',
    icon: 'border border-[#101010]/20 bg-[#ece6dc] text-black',
  },
  dark: {
    root: 'border-[#272727] bg-[#171717] text-[#f8f3eb] shadow-none',
    icon: 'text-[#171717]',
    description: 'text-[rgba(248,243,235,.68)]',
    arrow: 'absolute top-5 right-5 w-[21px]',
    delete: 'top-4 right-[52px]',
  },
  minimal: {
    root: 'border-[#101010] bg-[#b8dfe0]',
    icon: 'size-[54px] rounded-[10px] [&_svg]:size-8 bg-black text-[#b8dfe0]',
  },
}

const variantNames = Object.keys(variants)

export function FeatureCard({
  title,
  icon,
  description,
  color = '#ff5003',
  variant = 1,
  className,
  onClick,
  onDelete,
}: FeatureCardProps) {
  const Icon = iconMap[icon] ?? Sparkles
  const index = Math.min(Math.max(Math.round(variant), 1), 8) - 1
  const variantName = variantNames[index]
  const v = variants[variantName]
  const isDark = variantName === 'dark'

  return (
    <article
      className={cn(base.root, v.root, 'group select-none', className)}
      style={{
        '--card-accent': color,
        '--card-ink': color.toLowerCase() === '#004b2c' ? '#ffffff' : '#1c1c1c',
        '--card-icon': 'color-mix(in srgb, var(--card-accent) 88%, #1c1c1c)',
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className={cn(base.icon, v.icon)} aria-hidden="true">
        <Icon strokeWidth={1.7} />
      </div>
      <div className="relative z-10">
        <h2 className={cn(base.title, v.title)}>{title}</h2>
        {description && <p className={cn(base.description, v.description)}>{description}</p>}
      </div>
      {isDark && <ArrowUpRight className={v.arrow} aria-hidden="true" />}
      {onDelete && (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={`Delete ${title}`}
          className={cn(base.delete, v.delete)}
          onClick={(event) => {
            event.stopPropagation()
            void onDelete()
          }}
        >
          <Trash2 />
        </Button>
      )}
    </article>
  )
}

export const featureCardIconNames = Object.keys(iconMap)
export const featureCardVariantNames = variantNames
