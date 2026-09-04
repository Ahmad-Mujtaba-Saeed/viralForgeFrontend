'use client'

import { useState } from 'react'
import api from '@/lib/axios'
import { Loader2, X, Check, Plus } from 'lucide-react'
import type { Slot } from './types'

/**
 * The words ON the card (as opposed to the words spoken over it). The
 * endpoint has accepted these since the storyboard shipped; nothing ever
 * offered them.
 */
export function TextBlockEditor({
  projectId, sceneId, slotKey, slot, disabled = false, onChange, onDone,
}: {
  projectId: string
  sceneId: string
  slotKey: string
  slot: Slot
  disabled?: boolean
  onChange: () => void
  onDone: () => void
}) {
  const [heading, setHeading] = useState(slot.heading ?? '')
  const [bullets, setBullets] = useState<string[]>(slot.bullets?.length ? [...slot.bullets] : [''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setBullet = (i: number, value: string) =>
    setBullets((prev) => prev.map((b, index) => (index === i ? value : b)))

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}`, {
        heading,
        bullets: bullets.map((b) => b.trim()).filter(Boolean),
      })
      await onChange()
      onDone()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save this card.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-primary bg-inset p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink3">{slotKey}</div>
      <input
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
        maxLength={80}
        placeholder="Heading"
        className="mb-1.5 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-semibold text-foreground outline-none placeholder:text-ink3 focus:border-primary"
      />
      <div className="space-y-1">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-primary">›</span>
            <input
              value={bullet}
              onChange={(e) => setBullet(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bullets.length < 5) setBullets((prev) => [...prev, ''])
              }}
              maxLength={160}
              placeholder="A line on the card"
              className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
            />
            <button
              onClick={() => setBullets((prev) => prev.filter((_, index) => index !== i))}
              className="shrink-0 text-ink3 hover:text-foreground"
              title="Remove this line"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setBullets((prev) => [...prev, ''])}
          disabled={bullets.length >= 5}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> Add line {bullets.length >= 5 ? '(5 max)' : ''}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDone}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-card"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || disabled}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
          </button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-warn">{error}</p>}
    </div>
  )
}

