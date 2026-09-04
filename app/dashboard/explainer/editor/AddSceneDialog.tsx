'use client'

import * as React from 'react'
import api from '@/lib/axios'
import { AlertTriangle, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { headingOf } from './SceneFilmstrip'
import type { Storyboard } from './types'

/**
 * AddSceneDialog — say where the new beat goes and what it covers.
 *
 * There is deliberately no blank card behind this. A scene is not an empty
 * box: it needs narration in the video's voice, a layout template that suits
 * what it says, filled slots and a duration that fits its neighbours. Handing
 * the user an empty one would just move all four problems onto them. So this
 * collects the only two things a person actually knows — WHERE and WHAT — and
 * the planner writes the rest, splicing it in through the same revision path
 * that already inserts cards, which is what keeps every other scene's uploads
 * and cached voiceover untouched.
 */
export function AddSceneDialog({
  board,
  projectId,
  defaultAfterSceneId,
  onClose,
  onQueued,
}: {
  board: Storyboard
  projectId: string
  /** Where the user clicked "+" — pre-selected in the dropdown. */
  defaultAfterSceneId: string | null
  onClose: () => void
  onQueued: () => void
}) {
  const [after, setAfter] = React.useState(
    defaultAfterSceneId ?? board.scenes[board.scenes.length - 1]?.scene_id ?? 'start'
  )
  const [description, setDescription] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const ref = React.useRef<HTMLTextAreaElement | null>(null)

  React.useEffect(() => {
    setTimeout(() => ref.current?.focus(), 40)
  }, [])

  const submit = async () => {
    const text = description.trim()
    if (text.length < 3 || sending) return
    setSending(true)
    setError(null)
    try {
      await api.post(`/api/explainer/projects/${projectId}/scenes`, {
        description: text,
        after_scene_id: after,
      })
      onQueued()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'The scene could not be added. Try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  const examples = [
    'A quick worked example with real numbers.',
    'Why the common explanation for this is wrong.',
    'A recap of the three points so far, as a checklist.',
    'The single statistic that makes the case.',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-popover text-popover-foreground shadow-soft-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            <Plus className="h-4 w-4 text-primary" /> Add a scene
          </span>
          <button onClick={onClose} className="text-ink3 transition-colors hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 p-4">
          <div>
            <label
              htmlFor="add-scene-where"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-ink3"
            >
              Where it goes
            </label>
            <select
              id="add-scene-where"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              className="w-full rounded-xl border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="start">At the very start — before scene 1</option>
              {board.scenes.map((scene) => (
                <option key={scene.scene_id} value={scene.scene_id}>
                  After scene {scene.order} — {headingOf(scene).slice(0, 58)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="add-scene-what"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-ink3"
            >
              What it should cover
            </label>
            <textarea
              id="add-scene-what"
              ref={ref}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit()
                if (e.key === 'Escape') onClose()
              }}
              rows={4}
              maxLength={600}
              placeholder="e.g. “Show what happens if you skip this step — one wrong result next to the right one.”"
              className="w-full resize-y rounded-xl border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => setDescription(example)}
                  className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-inset"
                >
                  {example.length > 40 ? `${example.slice(0, 38)}…` : example}
                </button>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            The AI writes the narration, picks the card type and fills it in this video&apos;s voice, then fits it
            between its neighbours. Every other scene keeps its pictures and the voiceover already made for it.
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-inset"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={sending || description.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Write the scene
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
