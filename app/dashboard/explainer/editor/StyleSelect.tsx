'use client'

import * as React from 'react'
import { Check, ChevronDown, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePrefersReducedMotion, type StyleOption } from './StylePicker'

/**
 * StyleSelect — a look control as one line: `Typeface · · · Editorial ⌄`.
 *
 * The segmented rows (StylePicker) put every option on screen at once, which
 * reads fine as a full-width composition bar and badly as five stacked rows in
 * a 380px inspector — four of them wrapped, and the panel became a wall of
 * chips. This is the same set of choices as a value + chevron, so a section
 * answers "what is this video set to" at a glance and only opens when you want
 * to change it.
 *
 * The recorded previews survive the move, and get bigger: the popover carries
 * one preview pane at the top and every row you hover plays into it. That is
 * strictly more than the old hover cards offered, because you can now sweep
 * the list and watch each option in place rather than re-opening a card per
 * chip.
 */

export type SelectOption = StyleOption & {
  /** Colours to show when this option has no recording — custom palettes. */
  swatch?: string[]
  /** Offered on rows the user owns (their own colour schemes). */
  onDelete?: () => void
}

/** The preview pane: poster instantly, clip once it has decoded. */
function PreviewPane({
  group,
  option,
  reduced,
}: {
  group: string
  option: SelectOption | null
  reduced: boolean
}) {
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  // A different option means a different file; forget what the last one did.
  React.useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [option?.key])

  if (!option) return null

  const poster = `/style-previews/${group}/${option.key}.png`
  const clip = `/style-previews/${group}/${option.key}.gif`
  const swatch = option.swatch

  return (
    <div className="border-b border-border p-2.5">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-inset">
        {swatch ? (
          // A palette the user mixed has no recording — show the colours
          // themselves rather than an empty box claiming nothing was found.
          <div className="absolute inset-0 flex">
            {swatch.map((color, i) => (
              <span key={i} className="h-full flex-1" style={{ background: color }} />
            ))}
          </div>
        ) : (
          <>
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
                alt={`${option.label} preview`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
              />
            )}
            {failed && (
              <div className="absolute inset-0 grid place-items-center px-4 text-center text-[11px] text-muted-foreground">
                No preview recorded for this option yet.
              </div>
            )}
          </>
        )}
      </div>
      <p className="mt-2 text-[13px] font-semibold text-foreground">
        {option.label}
        {option.autoLabel ? <span className="ml-1.5 font-normal text-ink3">→ {option.autoLabel}</span> : null}
      </p>
      {option.hint ? (
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{option.hint}</p>
      ) : null}
    </div>
  )
}

export function StyleSelect({
  group,
  label,
  options,
  value,
  onSelect,
  pendingKey = null,
  disabled = false,
  footer,
}: {
  /** Preview folder under /style-previews — 'motion' | 'skin' | 'scheme' | … */
  group: string
  label: string
  options: SelectOption[]
  value: string
  onSelect: (key: string) => void
  pendingKey?: string | null
  disabled?: boolean
  /** An extra action under the list — "New colour scheme", say. */
  footer?: React.ReactNode
}) {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = React.useState(false)
  const [hovered, setHovered] = React.useState<string | null>(null)

  const selected = options.find((o) => o.key === value) ?? options[0] ?? null
  const shown = options.find((o) => o.key === (hovered ?? value)) ?? selected
  const busy = pendingKey !== null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            title={selected?.hint}
            className="inline-flex max-w-[190px] items-center gap-1.5 rounded-lg border border-border bg-inset px-2.5 py-1 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
            ) : selected?.key === 'auto' ? (
              <Sparkles className="h-3 w-3 shrink-0 text-primary" />
            ) : null}
            <span className="truncate">{selected?.label ?? value}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-ink3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="left" sideOffset={10} className="w-[300px] overflow-hidden p-0">
          <PreviewPane group={group} option={shown} reduced={reduced} />
          <div
            role="radiogroup"
            aria-label={label}
            onMouseLeave={() => setHovered(null)}
            className="max-h-[42vh] overflow-y-auto p-1.5"
          >
            {options.map((option) => {
              const active = option.key === value
              return (
                <div
                  key={option.key}
                  onMouseEnter={() => setHovered(option.key)}
                  className={`group/row flex items-center gap-1.5 rounded-lg ${
                    active ? 'bg-accent-soft' : 'hover:bg-inset'
                  }`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setOpen(false)
                      if (!active) onSelect(option.key)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-[13px] outline-none"
                  >
                    {option.swatch ? (
                      <span className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full border border-border">
                        {option.swatch.slice(0, 3).map((c, i) => (
                          <span key={i} className="h-full flex-1" style={{ background: c }} />
                        ))}
                      </span>
                    ) : option.key === 'auto' ? (
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <span className={`truncate ${active ? 'font-semibold text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                    {pendingKey === option.key ? (
                      <Loader2 className="ml-auto h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                    ) : active ? (
                      <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : null}
                  </button>
                  {option.onDelete ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        option.onDelete?.()
                      }}
                      title={`Delete “${option.label}” from your library`}
                      className="mr-1 shrink-0 rounded-md p-1 text-ink3 opacity-0 transition-opacity hover:text-destructive group-hover/row:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
          {footer ? <div className="border-t border-border p-1.5">{footer}</div> : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}
