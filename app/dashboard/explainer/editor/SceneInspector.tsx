'use client'

import * as React from 'react'
import api from '@/lib/axios'
import { Clock, LayoutGrid, Loader2, Wand2 } from 'lucide-react'
import { NarrationEditor } from './NarrationEditor'
import { SlotCard } from './SlotCard'
import { TransitionPicker } from './TransitionPicker'
import { TEMPLATE_ICON, type Scene, type Storyboard } from './types'

/**
 * SceneInspector — everything about ONE beat.
 *
 * The old board expanded every scene at once; this shows the scene the stage
 * is parked on. Nothing was dropped in the move: the spoken line, the words on
 * the card, every slot (including the thirty-odd natively-drawn content types
 * that have nothing to upload), the camera move, the incoming transition and —
 * new here — the scene's length, which the API has always accepted and no
 * screen ever offered.
 */
export function SceneInspector({
  board,
  projectId,
  scene,
  index,
  onChange,
  onAskAi,
  targeted,
  revising,
}: {
  board: Storyboard
  projectId: string
  scene: Scene
  index: number
  onChange: () => void
  onAskAi: (sceneId: string) => void
  targeted: boolean
  revising: boolean
}) {
  const templateLabel = board.templates?.[scene.layout_template]?.label || scene.layout_template
  const slotKeys = Object.keys(scene.slots)

  const [savingTransition, setSavingTransition] = React.useState(false)
  const updateTransition = async (t: string) => {
    setSavingTransition(true)
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${scene.scene_id}`, { transition: t })
      await onChange()
    } catch {
      alert('Failed to update transition')
    } finally {
      setSavingTransition(false)
    }
  }

  // Scene length. The endpoint clamps to 2–20s; the control says so rather
  // than letting the server silently disagree with the number on screen.
  const [duration, setDuration] = React.useState(scene.duration_seconds)
  const [savingDuration, setSavingDuration] = React.useState(false)
  React.useEffect(() => setDuration(scene.duration_seconds), [scene.scene_id, scene.duration_seconds])

  const saveDuration = async () => {
    const next = Math.max(2, Math.min(20, Number(duration) || scene.duration_seconds))
    if (next === scene.duration_seconds) return
    setSavingDuration(true)
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${scene.scene_id}`, {
        duration_seconds: next,
      })
      await onChange()
    } catch {
      alert('Failed to change the scene length')
    } finally {
      setSavingDuration(false)
    }
  }

  const words = scene.narration.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-none items-center justify-between gap-2.5 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-[26px] min-w-[26px] place-items-center rounded-lg bg-accent-soft px-1.5 font-mono text-[11px] font-bold text-primary">
            {scene.order}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
              <span className="text-primary [&>svg]:h-3.5 [&>svg]:w-3.5">
                {TEMPLATE_ICON[scene.layout_template] || <LayoutGrid className="h-3.5 w-3.5" />}
              </span>
              <span className="truncate">{templateLabel}</span>
            </div>
            <div className="text-[11px] text-ink3">
              Scene {index + 1} of {board.scenes.length} · {Math.round(scene.duration_seconds)}s
            </div>
          </div>
        </div>
        <button
          onClick={() => onAskAi(scene.scene_id)}
          disabled={revising}
          title={targeted ? 'This scene is part of your next request' : 'Ask the AI to change this scene'}
          className={`inline-flex h-[30px] flex-none items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors disabled:opacity-50 ${
            targeted
              ? 'bg-foreground text-background'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          {targeted ? 'Selected' : 'Ask AI'}
        </button>
      </div>

      <div className="flex flex-col gap-3.5 px-4 py-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">Narration</span>
            <span className="font-mono text-[10px] text-ink3">{words} words</span>
          </div>
          <NarrationEditor
            projectId={projectId}
            sceneId={scene.scene_id}
            narration={scene.narration}
            disabled={revising}
            onChange={onChange}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">
            On-screen &amp; visuals
          </span>
          <div className="flex flex-col gap-2.5">
            {slotKeys.map((slotKey) => (
              <SlotCard
                key={`${scene.scene_id}:${slotKey}`}
                projectId={projectId}
                sceneId={scene.scene_id}
                slotKey={slotKey}
                slot={scene.slots[slotKey]}
                cameraMoves={board.camera_moves || []}
                autoVisuals={Boolean(board.auto_visuals)}
                mediaLibrary={board.media_library}
                disabled={revising}
                onChange={onChange}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border px-2.5 py-2 text-xs">
            <span className="text-ink3">Transition</span>
            {/* The first scene has nothing to cut FROM — `scene[i].transition`
                is the cut INTO scene i, so the control is meaningless there. */}
            {index > 0 ? (
              <TransitionPicker
                value={scene.transition}
                options={board.transitions || []}
                meanings={board.transition_meanings}
                onSelect={updateTransition}
                disabled={revising || savingTransition}
                saving={savingTransition}
              />
            ) : (
              <span className="font-semibold text-muted-foreground">opens the video</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-border px-2.5 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-ink3">
              <Clock className="h-3 w-3" /> Length
            </span>
            <span className="inline-flex items-center gap-1">
              <input
                type="number"
                min={2}
                max={20}
                step={0.5}
                value={duration}
                disabled={revising || savingDuration}
                onChange={(e) => setDuration(Number(e.target.value))}
                onBlur={saveDuration}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                title="2–20 seconds. The render re-paces this to the recorded narration."
                className="w-12 rounded-md border border-border bg-card px-1.5 py-0.5 text-right text-xs font-semibold text-foreground outline-none focus:border-primary disabled:opacity-60"
              />
              {savingDuration ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <span className="text-ink3">s</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
