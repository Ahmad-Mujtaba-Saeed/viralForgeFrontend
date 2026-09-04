'use client'

import { useRef, useState } from 'react'
import api from '@/lib/axios'
import { Loader2, Check, Mic, Pencil } from 'lucide-react'

/**
 * The scene's spoken line, editable in place.
 *
 * Safe to hand over because nothing has been spoken yet: the voiceover is
 * synthesised at render time and cached under a hash of this exact text, so
 * editing one scene re-records that scene and leaves every other wav — and
 * the credits already spent on it — alone. The card's duration is only an
 * estimate until then, which is why saving re-estimates it from the new words.
 */
export function NarrationEditor({
  projectId, sceneId, narration, disabled = false, onChange,
}: {
  projectId: string
  sceneId: string
  narration: string
  disabled?: boolean
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(narration)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const open = () => {
    if (disabled) return
    setDraft(narration)
    setError(null)
    setEditing(true)
    setTimeout(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(narration.length, narration.length)
    }, 30)
  }

  const save = async () => {
    if (draft === narration) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${sceneId}`, { narration: draft })
      await onChange()
      setEditing(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save that line.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={open}
        disabled={disabled}
        className="group mb-3 flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-inset disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
        title="Edit what the voiceover says here"
      >
        <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3" />
        <span className={`flex-1 text-sm ${narration ? 'italic text-muted-foreground' : 'text-ink3'}`}>
          {narration ? `“${narration}”` : 'No voiceover on this scene — click to write one.'}
        </span>
        <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    )
  }

  return (
    <div className="mb-3 rounded-xl border border-primary bg-inset p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Mic className="h-3.5 w-3.5 text-primary" /> Voiceover for this scene
      </div>
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save()
          if (e.key === 'Escape') setEditing(false)
        }}
        rows={3}
        maxLength={1500}
        placeholder="What the narrator says over this scene. Leave empty for a silent beat."
        className="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
      />
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-ink3">
          {draft.trim().split(/\s+/).filter(Boolean).length} words · about{' '}
          {Math.max(3, Math.round(draft.trim().split(/\s+/).filter(Boolean).length / 2.5))}s spoken · the voice is
          recorded at render, so only this scene is re-recorded
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-card"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
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

