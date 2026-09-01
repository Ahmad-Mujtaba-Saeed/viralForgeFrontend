'use client'

import * as React from 'react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

/**
 * StylePicker — the look controls, with the look actually shown.
 *
 * Every style row in the storyboard used to be a strip of words with a
 * tooltip: "Crisp | Classic | Bounce | Elegant | Swiss". None of those names
 * tells you what the video will do, and the only way to find out was to pick
 * one and render.
 *
 * So each option carries a RECORDED loop of the real renderer doing that
 * thing (remotion-render/scripts/style-previews.ts writes them; they are the
 * genuine `Explainer` composition with one setting changed, not a CSS
 * impression of it). Hovering plays it. Nothing renders live, nothing is
 * fetched until a pointer is actually resting on an option, and the still
 * frame is shown underneath so the card never opens empty.
 */

export type StyleOption = {
  key: string
  label: string
  /** One line: when this choice is the right one. */
  hint?: string
  /** Shown under the label when this option is the resolved 'auto' pick. */
  autoLabel?: string
}

type Props = {
  /** Preview folder under /style-previews — 'motion' | 'skin' | … */
  group: string
  /** Row label ("Motion", "Skin"). */
  title: string
  options: StyleOption[]
  value: string
  onSelect: (key: string) => void
  pendingKey?: string | null
  disabled?: boolean
  /** Shown on the row when nothing has a preview yet. */
  icon?: React.ReactNode
}

/** Hover previews are decoration for anyone who asked not to see motion. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

/**
 * The preview panel. The poster paints immediately; the GIF is only requested
 * once the card has actually opened, and it fades in over the poster when it
 * has decoded — so a slow connection shows a still image rather than a hole.
 */
function Preview({
  group,
  option,
  reduced,
}: {
  group: string
  option: StyleOption
  reduced: boolean
}) {
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const poster = `/style-previews/${group}/${option.key}.png`
  const clip = `/style-previews/${group}/${option.key}.gif`

  return (
    <div className="w-[320px]">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-inset">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
        {!reduced && !failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip}
            alt={`${option.label} motion preview`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
        {failed && (
          <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-muted-foreground">
            No preview recorded for this option yet.
          </div>
        )}
        {!reduced && !loaded && !failed && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
            loading…
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <p className="text-sm font-semibold text-foreground">{option.label}</p>
        {option.hint ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{option.hint}</p>
        ) : null}
        {reduced ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Showing a still — your system asks for reduced motion.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function StylePicker({
  group,
  title,
  options,
  value,
  onSelect,
  pendingKey = null,
  disabled = false,
  icon,
}: Props) {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {title}:
      </span>
      <div
        role="radiogroup"
        aria-label={title}
        className="inline-flex overflow-hidden rounded-lg border border-border"
      >
        {options.map((option) => {
          const active = value === option.key
          const busy = pendingKey === option.key
          const button = (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(option.key)}
              disabled={disabled}
              className={`relative px-3 py-1.5 text-sm font-semibold outline-none transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-inset hover:text-foreground'
              }`}
            >
              {busy ? (
                <Loader2 className="mx-3 h-4 w-4 animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  {option.key === 'auto' ? <Sparkles className="h-3.5 w-3.5" /> : null}
                  {option.label}
                  {active && option.key !== 'auto' ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
              )}
            </button>
          )

          // `auto` has nothing of its own to show — it resolves to one of the
          // others, and the row already says which.
          if (option.key === 'auto') {
            return (
              <HoverCard key={option.key} openDelay={120} closeDelay={80}>
                <HoverCardTrigger asChild>{button}</HoverCardTrigger>
                <HoverCardContent className="w-[320px]" side="top" align="center">
                  <p className="text-sm font-semibold text-foreground">Auto</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {option.hint ?? 'Let the system choose to suit the topic.'}
                    {option.autoLabel ? ` Right now that is ${option.autoLabel}.` : ''}
                  </p>
                </HoverCardContent>
              </HoverCard>
            )
          }

          return (
            <HoverCard key={option.key} openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>{button}</HoverCardTrigger>
              <HoverCardContent className="w-auto p-3" side="top" align="center">
                <Preview group={group} option={option} reduced={reduced} />
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
    </div>
  )
}
