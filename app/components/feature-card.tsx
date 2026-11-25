import { useId } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArtifactIcon } from './IconPicker'

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
  onEdit?: () => void
  /** Static display (editor preview): no hover lift, no action buttons. */
  preview?: boolean
  /** Heading level for the title (default 3). Ignored in preview. */
  headingLevel?: 2 | 3 | 4
}

const base = {
  root: `
    relative flex min-h-[230px] min-[561px]:min-h-[260px] flex-col justify-between overflow-hidden
    rounded-[24px] border bg-(--card-accent) border-[#101010]/12 p-[22px] text-(--card-ink)
    shadow-[0_5px_0_rgba(16,16,16,.16)] transition-[transform,box-shadow] duration-250 ease-in-out
    transition-all motion-reduce:transition-none
  `,
  icon: 'grid size-[52px] place-items-center rounded-2xl bg-(--card-icon) text-(--card-accent) [&_svg]:size-[27px]',
  title: 'max-w-[230px] text-[length:clamp(1.45rem,2.2vw,2.2rem)] leading-[.95] font-medium tracking-[-.06em]',
  description: 'mt-3 max-w-[235px] text-[13px] leading-[1.4] text-[color-mix(in_srgb,var(--card-ink)_90%,transparent)]',
  actions: 'absolute top-5 right-5 z-20 flex gap-1.5 opacity-0 [@media(hover:none)]:opacity-100 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100',
}

// Per-variant overrides, merged over `base` by cn (tailwind-merge resolves conflicts)
const variants: Record<string, Partial<typeof base> & { arrow?: string }> = {
  'icon-led': {
    icon: 'size-[90px] rounded-3xl [&_svg]:size-[50px] bg-black',
  },
  'title-led': {
    root: 'justify-end',
    icon: 'absolute top-5 right-5 size-[38px] bg-transparent text-(--card-ink)',
    title: 'text-[length:clamp(2rem,3vw,3.2rem)] leading-[1]',
    actions: 'left-5 right-auto',
  },
  wide: {
    root: 'col-span-1 min-[561px]:col-span-2 flex-row items-end',
    icon: 'size-[76px] self-start rounded-[22px] [&_svg]:size-[38px] bg-black',
  },
  slimline: {
    root: 'col-span-1 min-[561px]:col-span-2 min-h-[120px] min-[561px]:min-h-[122px] flex-row items-center gap-[18px] pr-[112px]',
    icon: 'shrink-0 bg-black',
    description: 'mt-1.5',
    actions: 'top-1/2 -mt-3.5',
  },
  split: {
    root: 'justify-end',
    icon: 'absolute right-5 top-5 size-[105px] rounded-full bg-transparent text-(--card-icon) [&_svg]:size-24 rotate-15',
    actions: 'left-5 right-auto',
  },
  outlined: {
    root: 'border-[#101010] bg-[#fffaf2] text-[#1c1c1c]',
    icon: 'border border-[#101010]/20 bg-(--card-accent) text-(--card-ink)',
    description: 'text-[color-mix(in_srgb,#1c1c1c_90%,transparent)]',
    actions: '[&_button]:text-[#1c1c1c] [&_button]:hover:text-[#1c1c1c]',
  },
  dark: {
    root: 'border-[#272727] bg-[#171717] text-[#f8f3eb] shadow-none',
    icon: 'bg-(--card-accent) text-(--card-ink)',
    description: 'text-[rgba(248,243,235,.9)]',
    arrow: 'absolute top-5 right-5 w-[21px]',
    actions: 'top-4 right-[52px]',
  },
  minimal: {
    root: 'border-[#101010] bg-[#b8dfe0] text-[#1c1c1c]',
    icon: 'size-[54px] rounded-[10px] [&_svg]:size-8 bg-(--card-accent) text-(--card-ink)',
    description: 'text-[color-mix(in_srgb,#1c1c1c_90%,transparent)]',
    actions: '[&_button]:text-[#1c1c1c] [&_button]:hover:text-[#1c1c1c]',
  },
}

const hoverLift = 'motion-safe:hover:-translate-y-1 hover:shadow-[0_9px_0_rgba(16,16,16,.14)]'

// Edit/Delete buttons take the card's own ink and tint (currentColor), so they follow the theme.
const actionButton =
  'bg-[color-mix(in_srgb,currentColor_14%,transparent)] text-current hover:bg-[color-mix(in_srgb,currentColor_26%,transparent)] hover:text-current focus-visible:ring-2 focus-visible:ring-current [&_svg]:size-4'

// WCAG relative luminance; supports #rgb and #rrggbb. Returns null if unparseable.
function luminance(hex: string): number | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function inkFor(color: string) {
  const l = luminance(color)
  // Contrast against white vs #1c1c1c: pick whichever reads better.
  return l !== null && l < 0.18 ? '#ffffff' : '#1c1c1c'
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
  onEdit,
  preview = false,
  headingLevel = 3,
}: FeatureCardProps) {
  const descId = useId()
  const index = Math.min(Math.max(Math.round(variant), 1), 8) - 1
  const variantName = variantNames[index]
  const v = variants[variantName]
  const isDark = variantName === 'dark'

  const interactive = !preview
  const clickable = interactive && !!onClick
  const Root = preview ? 'div' : 'article'
  const Heading = `h${headingLevel}` as 'h3'
  return (
    <Root
      className={cn(
        base.root,
        interactive && hoverLift,
        // Two-tone focus: inner ink ring (stretched button) plus a white outer outline for contrast against the page.
        interactive && 'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white',
        v.root,
        'group select-none',
        interactive && onClick && 'cursor-pointer',
        className,
      )}
      style={{
        '--card-accent': color,
        '--card-ink': inkFor(color),
        '--card-icon': 'color-mix(in srgb, var(--card-accent) 88%, #1c1c1c)',
      } as React.CSSProperties}
    >
      <div className={cn(base.icon, v.icon)} aria-hidden="true">
        {icon ? <ArtifactIcon icon={icon} /> : <Sparkles strokeWidth={1.7} />}
      </div>
      <div className="pointer-events-none z-10">
        {preview ? (
          <p className={cn(base.title, v.title)}>{title}</p>
        ) : (
          <Heading className={cn(base.title, v.title)}>
            {clickable ? (
              // Stretched link: the ::after covers the card so the title is the single click/keyboard target.
              <button
                type="button"
                data-artifact-trigger={title}
                aria-describedby={description ? descId : undefined}
                onClick={onClick}
                className="pointer-events-auto cursor-pointer rounded-sm text-left font-[inherit] tracking-[inherit] outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-(--card-ink) focus-visible:after:ring-inset"
              >
                {title}
              </button>
            ) : (
              title
            )}
          </Heading>
        )}
        {description && <p id={descId} className={cn(base.description, v.description)}>{description}</p>}
      </div>
      {isDark && <ArrowUpRight className={v.arrow} aria-hidden="true" />}
      {interactive && (onEdit || onDelete) && (
        <div className={cn(base.actions, v.actions)}>
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={actionButton}
              aria-label={`Edit ${title}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit()
              }}
            >
              <IconPencil aria-hidden="true" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={actionButton}
              aria-label={`Delete ${title}`}
              onClick={(event) => {
                event.stopPropagation()
                void onDelete()
              }}
            >
              <IconTrash aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </Root>
  )
}

export const featureCardVariantNames = variantNames
