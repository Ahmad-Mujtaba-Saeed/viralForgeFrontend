'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

/** Neutral picks that read on any scheme, after the video's own colours. */
const BASICS = ['#ffffff', '#111111', '#f5c542', '#ef4444', '#22c55e', '#3b82f6']

const toHex = (c: string): string | null => {
  const v = c.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  return null
}

/**
 * Colour choice for an element: the video's own scheme first (so an edit
 * stays on-brand by default), a few neutrals, then any colour at all.
 */
export function ColorSwatches({
  value,
  swatches,
  onChange,
}: {
  value?: string
  /** The scheme's colours (text, accent, …), as hex. */
  swatches: string[]
  onChange: (color: string | null) => void
}) {
  const scheme = Array.from(new Set(swatches.map(toHex).filter((c): c is string => Boolean(c))))
  const basics = BASICS.filter((c) => !scheme.includes(c))
  const current = value ? toHex(value) : null

  const chip = (c: string) => (
    <button
      key={c}
      type="button"
      title={c}
      onClick={() => onChange(c)}
      className="relative grid h-6 w-6 place-items-center rounded-full border border-border"
      style={{ background: c }}
    >
      {current === c && <Check className="h-3 w-3" style={{ color: luminance(c) > 0.55 ? '#111' : '#fff' }} />}
    </button>
  )

  return (
    <div className="flex flex-col gap-2">
      {scheme.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink3">This video</p>
          <div className="flex flex-wrap gap-1.5">{scheme.map(chip)}</div>
        </div>
      )}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink3">More</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {basics.map(chip)}
          <label
            title="Any colour"
            className="relative grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-full border border-border"
            style={{ background: 'conic-gradient(#f43f5e,#f59e0b,#22c55e,#06b6d4,#6366f1,#d946ef,#f43f5e)' }}
          >
            <input
              type="color"
              value={current ?? '#ffffff'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={!value}
        className="self-start text-[11px] font-semibold text-primary disabled:opacity-40"
      >
        Use the card&apos;s own colour
      </button>
    </div>
  )
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
