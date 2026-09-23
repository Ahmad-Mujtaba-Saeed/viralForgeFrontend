'use client'

import * as React from 'react'
import { Loader2, X, Zap } from 'lucide-react'

export interface CreditLine {
  label: string
  /** Credits; 0 renders as "Free". */
  amount: number
  note?: string
}

/**
 * CreditConfirmDialog — "this is what it costs, go ahead?" before anything
 * that spends credits: rendering, and switching AI visuals on. Itemised so
 * the user sees exactly what the total is made of (the free first render,
 * N pictures x the per-picture price, aspect variants).
 */
export function CreditConfirmDialog({
  open,
  title,
  intro,
  lines,
  balance,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  intro?: React.ReactNode
  lines: CreditLine[]
  balance: number
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  const short = total > balance

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 mt-[10vh] w-full max-w-md rounded-2xl border border-border bg-popover text-popover-foreground shadow-soft-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            <Zap className="h-4 w-4 text-primary" /> {title}
          </span>
          <button onClick={onClose} className="text-ink3 transition-colors hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 text-[13px]">
          {intro && <div className="leading-snug text-muted-foreground">{intro}</div>}

          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {lines.map((line) => (
              <li key={line.label} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-foreground">{line.label}</span>
                  {line.note && <span className="block text-[11px] text-muted-foreground">{line.note}</span>}
                </span>
                <span className="shrink-0 font-mono font-semibold text-foreground">
                  {line.amount === 0 ? 'Free' : `${line.amount.toLocaleString()} cr`}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 bg-inset px-3 py-2 font-bold">
              <span>Total</span>
              <span className="font-mono">{total === 0 ? 'Free' : `${total.toLocaleString()} credits`}</span>
            </li>
          </ul>

          <p className={`text-[12px] ${short ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
            You have {balance.toLocaleString()} credits
            {short ? ` — ${(total - balance).toLocaleString()} short.` : total > 0 ? ` · ${(balance - total).toLocaleString()} left after this.` : '.'}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-inset"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {short ? 'Get credits' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
