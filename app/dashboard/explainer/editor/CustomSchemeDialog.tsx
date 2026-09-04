'use client'

import * as React from 'react'
import api from '@/lib/axios'
import { AlertTriangle, Loader2, Palette, Sliders, X } from 'lucide-react'

/**
 * CustomSchemeDialog — mix a palette and keep it.
 *
 * The registry ships fourteen schemes and that was the whole choice. This adds
 * the user's own, saved to their account and offered on every project they
 * make afterwards.
 *
 * It asks for two colours, not seven. Paper and accent are the two decisions a
 * person actually has in mind; the other five are consequences of them, and
 * getting a readable `muted` or `panel` by eye is a job for the derivation
 * below rather than for five more colour inputs. Anyone who does want the
 * other five gets them behind "All seven colours" — the API validates each one
 * independently either way.
 *
 * The preview is a real scene layout in the palette, not a row of dots,
 * because the thing being judged is ink-on-paper contrast at type sizes.
 */

type Scheme = {
  label: string
  bg_from: string
  bg_to: string
  accent: string
  accent2: string
  text: string
  muted: string
  panel: string
}

const FIELDS: (keyof Omit<Scheme, 'label'>)[] = [
  'bg_from',
  'bg_to',
  'accent',
  'accent2',
  'text',
  'muted',
  'panel',
]

const FIELD_LABEL: Record<string, string> = {
  bg_from: 'Paper (top)',
  bg_to: 'Paper (bottom)',
  accent: 'Accent',
  accent2: 'Second accent',
  text: 'Ink',
  muted: 'Muted ink',
  panel: 'Panel',
}

/* ------------------------------------------------------------- colour -- */

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (h.length !== 6) return [0, 0, 0]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase()

/** Perceived brightness — the test for whether ink should be light or dark. */
function luminance(hex: string): number {
  const [r, g, b] = parse(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Move a colour toward white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex)
  const f = (c: number) => (amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))
  return toHex(f(r), f(g), f(b))
}

/** Blend two colours; `t` = 0 is `a`, 1 is `b`. */
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

/** Rotate the hue, keeping saturation and lightness — the second accent. */
function rotate(hex: string, deg: number): string {
  const [r, g, b] = parse(hex).map((c) => c / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return hex
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  h = (h + deg / 360 + 1) % 1

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number) => {
    let x = (t + 1) % 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return toHex(channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255)
}

/**
 * The five colours nobody wants to pick, derived from the two they do.
 * Ink flips with the paper's brightness so the result is always readable;
 * everything else is a controlled step away from paper or accent.
 */
function derive(paper: string, accent: string): Omit<Scheme, 'label'> {
  const dark = luminance(paper) < 0.5
  const text = dark ? shade(paper, 0.92) : shade(paper, -0.86)
  return {
    bg_from: paper.toUpperCase(),
    bg_to: (dark ? shade(paper, -0.15) : shade(paper, -0.05)).toUpperCase(),
    accent: accent.toUpperCase(),
    accent2: rotate(accent, dark ? 28 : -28),
    text,
    muted: mix(text, paper, 0.45),
    panel: dark ? shade(paper, 0.08) : shade(paper, -0.04),
  }
}

/* --------------------------------------------------------------- view -- */

export function CustomSchemeDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  /** The saved scheme's `name`, so the caller can apply it straight away. */
  onCreated: (name: string) => void
}) {
  const [label, setLabel] = React.useState('')
  const [paper, setPaper] = React.useState('#12142B')
  const [accent, setAccent] = React.useState('#F45B3C')
  const [advanced, setAdvanced] = React.useState(false)
  const [manual, setManual] = React.useState<Omit<Scheme, 'label'> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // While "All seven" is closed the derived set IS the palette; opening it
  // seeds the manual fields from whatever is on screen, so the two views can
  // never disagree about what is being previewed.
  const derived = React.useMemo(() => derive(paper, accent), [paper, accent])
  const palette = advanced && manual ? manual : derived

  const openAdvanced = () => {
    setManual(derived)
    setAdvanced(true)
  }

  const setField = (field: keyof Omit<Scheme, 'label'>, value: string) =>
    setManual((prev) => ({ ...(prev ?? derived), [field]: value.toUpperCase() }))

  const save = async () => {
    const name = label.trim()
    if (name.length < 2 || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await api.post('/api/explainer/color-schemes', { label: name, ...palette })
      onCreated(res.data?.data?.scheme?.name ?? '')
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'That colour scheme could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-popover text-popover-foreground shadow-soft-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <Palette className="h-4 w-4 text-primary" /> New colour scheme
          </span>
          <button onClick={onClose} className="text-ink3 transition-colors hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 p-4">
          {/* A real scene in the palette — dots do not show ink on paper. */}
          <div
            className="overflow-hidden rounded-xl border border-border"
            style={{ background: `linear-gradient(160deg, ${palette.bg_from}, ${palette.bg_to})` }}
          >
            <div className="flex flex-col gap-2 p-4">
              <span className="flex gap-1.5">
                <span className="h-2 w-10 rounded-sm" style={{ background: palette.accent }} />
                <span className="h-2 w-3.5 rounded-sm" style={{ background: palette.accent2 }} />
              </span>
              <span className="text-lg font-bold leading-tight" style={{ color: palette.text }}>
                The heading sits here
              </span>
              <span className="text-[11px]" style={{ color: palette.muted }}>
                › a supporting line, in the muted ink
              </span>
              <span
                className="mt-1 inline-flex w-fit rounded-md px-2 py-1 text-[11px] font-semibold"
                style={{ background: palette.panel, color: palette.text }}
              >
                a panel
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="scheme-label" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">
              Name
            </label>
            <input
              id="scheme-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
                if (e.key === 'Escape') onClose()
              }}
              maxLength={40}
              placeholder="Studio Night"
              className="w-full rounded-xl border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
            />
          </div>

          {!advanced ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'paper', title: 'Paper', value: paper, set: setPaper },
                  { id: 'accent', title: 'Accent', value: accent, set: setAccent },
                ].map((c) => (
                  <div key={c.id}>
                    <label htmlFor={`scheme-${c.id}`} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">
                      {c.title}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`scheme-${c.id}`}
                        type="color"
                        value={c.value}
                        onChange={(e) => c.set(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-card"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{c.value.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={openAdvanced}
                className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
              >
                <Sliders className="h-3 w-3" /> All seven colours
              </button>
              <p className="text-[11px] leading-snug text-muted-foreground">
                The ink, the muted ink, the second accent and the panel are worked out from these two — the ink flips
                light or dark so it always reads on your paper.
              </p>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {FIELDS.map((field) => (
                <div key={field}>
                  <label htmlFor={`scheme-${field}`} className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink3">
                    {FIELD_LABEL[field]}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`scheme-${field}`}
                      type="color"
                      value={palette[field]}
                      onChange={(e) => setField(field, e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-card"
                    />
                    <span className="font-mono text-[10px] text-muted-foreground">{palette[field]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink3">Saved to your account — only you can see it.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-inset"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || label.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
                Save &amp; use
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
