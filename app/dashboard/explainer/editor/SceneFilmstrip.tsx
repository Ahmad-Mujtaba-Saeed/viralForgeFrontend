'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ImageOff, Plus, Sparkles, Wand2 } from 'lucide-react'
import type { PlayerPayload } from './PlayerStage'
import type { Scene, Storyboard } from './types'

/**
 * Real frames, from the same composition the stage plays. Shares that
 * chunk, so by the time the strip is on screen it is already loaded.
 */
const SceneThumb = dynamic(() => import('./SceneThumb'), { ssr: false })

/**
 * SceneFilmstrip — the whole video at a glance, one tile per beat.
 *
 * Replaces the tall column of expanded scene cards: every scene is here, the
 * one you picked opens in the inspector. The tile shows what the storyboard
 * actually knows — order, heading, template, length, and whether the beat is
 * still missing a picture — over a plate tinted from the video's own palette,
 * so the strip reads as this video rather than as a generic list.
 */

/** The words on the card, if the planner wrote any. */
export function headingOf(scene: Scene): string {
  for (const slot of Object.values(scene.slots)) {
    const heading = (slot as unknown as Record<string, unknown>).heading
    if (typeof heading === 'string' && heading.trim()) return heading.trim()
  }
  const first = Object.values(scene.slots)[0] as unknown as Record<string, unknown> | undefined
  for (const key of ['term', 'prompt', 'formula', 'root', 'fact', 'label', 'finding']) {
    const value = first?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return scene.narration?.trim().slice(0, 70) || `Scene ${scene.order}`
}

/**
 * The plate under a tile: this video's own paper. It is what a tile shows
 * before its real frame has rendered, and what it keeps if the composition
 * cannot be loaded at all — so the strip is never a row of grey boxes.
 */
export function plateFor(board: Storyboard, index: number): string {
  const from = board.theme?.bg_from ?? '#1B2340'
  const to = board.theme?.bg_to ?? '#0E1222'
  return `linear-gradient(150deg, ${from}, ${to})`
}

export function SceneFilmstrip({
  board,
  payload,
  activeSceneId,
  onSelect,
  onAddScene,
  disabled = false,
}: {
  board: Storyboard
  /** The shot list, shared with the stage — tiles render frames from it. */
  payload: PlayerPayload | null
  activeSceneId: string | null
  onSelect: (sceneId: string) => void
  /** There is no create-scene endpoint — this asks the AI for one instead. */
  onAddScene: () => void
  disabled?: boolean
}) {
  const missingBySceneId = React.useMemo(() => {
    const map = new Set<string>()
    for (const miss of board.missing_slots ?? []) map.add(miss.scene_id)
    return map
  }, [board.missing_slots])

  const last = board.revision?.running ? null : board.revision?.last
  const addedIds = new Set(last?.state === 'done' ? last.added ?? [] : [])
  const changedIds = new Set(last?.state === 'done' ? last.changed ?? [] : [])

  const stripRef = React.useRef<HTMLDivElement | null>(null)

  // Keep the selected tile in view when the playhead — not a click — moves it.
  React.useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-scene="${activeSceneId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [activeSceneId])

  return (
    <div className="flex-none">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink3">
          Scenes · click to edit
        </span>
        <span className="font-mono text-[11px] text-ink3">
          {missingBySceneId.size > 0
            ? `${board.missing_slots.length} slot${board.missing_slots.length === 1 ? '' : 's'} need a visual`
            : 'every slot is filled'}
        </span>
      </div>

      <div ref={stripRef} className="flex gap-2.5 overflow-x-auto pb-1.5">
        {board.scenes.map((scene, index) => {
          const active = scene.scene_id === activeSceneId
          const templateLabel = board.templates?.[scene.layout_template]?.label || scene.layout_template
          return (
            <button
              key={scene.scene_id}
              data-scene={scene.scene_id}
              onClick={() => onSelect(scene.scene_id)}
              className={`w-[156px] flex-none rounded-xl border p-1 text-left transition-transform hover:-translate-y-0.5 ${
                active ? 'border-primary bg-card' : 'border-transparent bg-transparent hover:bg-inset'
              }`}
            >
              <div
                className="relative flex aspect-video flex-col justify-end overflow-hidden rounded-[9px] p-2.5"
                style={{ background: plateFor(board, index) }}
              >
                {payload ? (
                  <SceneThumb
                    payload={payload}
                    sceneIndex={index}
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                  />
                ) : null}
                {/* The heading rides ON the frame, on a scrim, because a
                    156px still of a real scene is often unreadable and the
                    tile still has to say which beat it is. */}
                <span className="relative line-clamp-2 rounded-[4px] bg-black/55 px-1 py-0.5 text-[10px] font-bold leading-tight text-white/95">
                  {headingOf(scene)}
                </span>
                <span className="absolute left-1.5 top-1.5 z-10 grid h-[17px] min-w-[17px] place-items-center rounded-[5px] bg-black/55 px-1 font-mono text-[9px] font-bold text-white">
                  {scene.order}
                </span>
                <span className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1">
                  {addedIds.has(scene.scene_id) && (
                    <span className="grid h-[17px] w-[17px] place-items-center rounded-[5px] bg-good text-white" title="Added by the last AI revision">
                      <Plus className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {changedIds.has(scene.scene_id) && (
                    <span className="grid h-[17px] w-[17px] place-items-center rounded-[5px] bg-primary text-primary-foreground" title="Rewritten by the last AI revision">
                      <Wand2 className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {missingBySceneId.has(scene.scene_id) && (
                    <span
                      className="grid h-[17px] w-[17px] place-items-center rounded-[5px] bg-warn text-white"
                      title={board.auto_visuals ? 'AI will draw this at render' : 'This scene still needs a picture'}
                    >
                      {board.auto_visuals ? <Sparkles className="h-2.5 w-2.5" /> : <ImageOff className="h-2.5 w-2.5" />}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1.5">
                <span
                  className={`truncate text-[10px] font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}
                  title={templateLabel}
                >
                  {templateLabel}
                </span>
                <span className="font-mono text-[10px] text-ink3">{Math.round(scene.duration_seconds)}s</span>
              </div>
            </button>
          )
        })}

        <button
          onClick={onAddScene}
          disabled={disabled}
          title="Ask the AI to write a new scene here"
          className="flex w-24 flex-none flex-col items-center justify-center gap-1.5 self-stretch rounded-xl border border-dashed border-border bg-inset text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add scene
        </button>
      </div>
    </div>
  )
}
