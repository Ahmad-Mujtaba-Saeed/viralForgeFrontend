'use client'

import * as React from 'react'
import { Check, Film, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePrefersReducedMotion } from './StylePicker'

/**
 * TransitionPicker — the cut between two scenes, shown as the cut.
 *
 * The other look controls got recorded previews (StylePicker); the per-scene
 * transition did not, and it is the one setting whose name explains itself
 * least. "stack_push", "match_dissolve" and "column_reveal" are meaningless as
 * words and obvious as two seconds of video, so this is a grid of the real
 * renderer performing each one — the SAME recording pipeline
 * (remotion-render/scripts/style-previews.ts, group `transition`), a two-beat
 * storyboard with the option under test on the cut.
 *
 * It is a popover grid rather than StylePicker's segmented row because there
 * are eighteen of these and they live on a scene card, not the composition
 * bar. Nothing loads until the popover opens, and each clip is only fetched
 * once a pointer rests on its tile — the poster PNG carries the tile until
 * then, so the grid paints complete and cheap.
 */

/**
 * Fallback one-liners for the transitions the registry does not describe.
 *
 * `transition_meanings` in explainer_registry.json exists to teach the PLANNER
 * the §3.1 relation grammar, so it only covers the seven signature cuts.
 * Adding the other eleven there would rewrite a live LLM prompt to fix a
 * tooltip, so the plain mechanical ones are described here instead. Anything
 * the registry does describe wins over this map.
 */
const FALLBACK_HINTS: Record<string, string> = {
  none: 'A hard cut — the next scene simply replaces this one, with nothing in between.',
  fade: 'The plain crossfade. The safe, quiet default when no cut is trying to say anything.',
  push_left: 'Both scenes travel together to the left, the new one arriving from the right.',
  push_right: 'Both scenes travel together to the right, the new one arriving from the left.',
  push_up: 'Both scenes travel up together, the new one arriving from below.',
  push_down: 'Both scenes travel down together, the new one arriving from above.',
  wipe: 'The new scene sweeps across the old one from the left, which stays put underneath.',
  wipe_up: 'The new scene sweeps up over the old one, which stays put underneath.',
  zoom_through: 'The camera punches IN through the frame into a detail. Energetic, best used sparingly.',
  zoom_out_in: 'The camera pulls back and settles into a new topic — the exhale between subjects.',
  whip_pan: 'A fast lateral throw with motion blur. The most energetic cut in the set.',
}

const labelFor = (key: string): string => key.replace(/_/g, ' ')

/** One tile: poster always, clip once hovered, ring when it is the choice. */
function Tile({
  option,
  active,
  reduced,
  onSelect,
}: {
  option: string
  active: boolean
  reduced: boolean
  onSelect: () => void
}) {
  // The GIF is only ever requested for a tile a pointer has actually touched;
  // eighteen autoplaying clips at once would be both ugly and wasteful.
  const [woken, setWoken] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const poster = `/style-previews/transition/${option}.png`
  const clip = `/style-previews/transition/${option}.gif`

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      onMouseEnter={() => setWoken(true)}
      onFocus={() => setWoken(true)}
      className={`group rounded-lg border p-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
        active ? 'border-primary bg-accent-soft' : 'border-border bg-card hover:bg-inset'
      }`}
    >
      <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-inset">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
        {woken && !reduced && !failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip}
            alt={`${labelFor(option)} transition preview`}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100"
          />
        )}
        {failed && (
          <div className="absolute inset-0 grid place-items-center px-2 text-center text-[9px] leading-tight text-muted-foreground">
            no preview recorded
          </div>
        )}
        {active && (
          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <p
        className={`mt-1 truncate text-[11px] font-semibold capitalize ${
          active ? 'text-primary' : 'text-foreground'
        }`}
      >
        {labelFor(option)}
      </p>
    </button>
  )
}

export function TransitionPicker({
  value,
  options,
  meanings = {},
  onSelect,
  disabled = false,
  saving = false,
}: {
  value: string
  options: string[]
  /** Registry `transition_meanings`; falls back to FALLBACK_HINTS. */
  meanings?: Record<string, string>
  onSelect: (key: string) => void
  disabled?: boolean
  saving?: boolean
}) {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = React.useState(false)
  // What the description line under the grid is talking about: whatever the
  // pointer is on, or the current choice when it is on nothing.
  const [hovered, setHovered] = React.useState<string | null>(null)
  const described = hovered ?? value
  const hint = meanings[described] ?? FALLBACK_HINTS[described] ?? ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Change the cut into this scene"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold capitalize text-muted-foreground outline-none transition-colors hover:bg-inset hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          ) : (
            <Film className="h-3 w-3" />
          )}
          {labelFor(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-[420px] p-3">
        <p className="text-sm font-semibold text-foreground">Transition in</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          How this scene arrives from the one before it.
        </p>
        <div
          role="radiogroup"
          aria-label="Scene transition"
          onMouseLeave={() => setHovered(null)}
          className="mt-2.5 grid max-h-[46vh] grid-cols-3 gap-1.5 overflow-y-auto pr-1"
        >
          {options.map((option) => (
            <div key={option} onMouseEnter={() => setHovered(option)}>
              <Tile
                option={option}
                active={option === value}
                reduced={reduced}
                onSelect={() => {
                  setOpen(false)
                  if (option !== value) onSelect(option)
                }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2.5 min-h-8 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold capitalize text-foreground">{labelFor(described)}</span>
          {hint ? ` — ${hint}` : ''}
        </p>
        {reduced ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Showing stills — your system asks for reduced motion.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
