'use client'

import * as React from 'react'
import api from '@/lib/axios'
import type { ElementEdit, ElementEdits } from '@/lib/remotion/types'
import type { PlayerPayload } from '../PlayerStage'
import type { Storyboard } from '../types'

/**
 * Hand edits made on the preview stage, for the whole storyboard.
 *
 * The page owns one map per scene. A change lands in local state at once —
 * the player is re-fed a shot list with the new `element_edits`, so the frame
 * moves under the pointer — and the scene's WHOLE map is saved a moment later
 * (PUT, debounced). The renderer applies the map through
 * components/Editable.tsx, so what the stage shows is what the MP4 renders.
 *
 * Undo/redo is a snapshot stack of the entire map: every edit is small, the
 * stack is capped, and a snapshot can never half-apply.
 */

export type { ElementEdit, ElementEdits }
export type EditsByScene = Record<string, ElementEdits>

export type Selection = {
  sceneId: string
  id: string
  kind: 'text' | 'group' | 'media' | 'card' | 'shape'
}

/** A patch: `undefined`/`null` values REMOVE that field. */
export type EditPatch = { [K in keyof ElementEdit]?: ElementEdit[K] | null }

const HISTORY_LIMIT = 80
const SAVE_DELAY_MS = 600

const isEmptyEdit = (e: ElementEdit | undefined): boolean => !e || Object.keys(e).length === 0

export function applyPatch(current: ElementEdit | undefined, patch: EditPatch | null): ElementEdit | undefined {
  if (patch === null) return undefined
  const next: Record<string, unknown> = { ...(current ?? {}) }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) delete next[k]
    else next[k] = v
  }
  // Neutral values carry nothing — drop them so "moved back" means "not edited".
  if (next.x === 0) delete next.x
  if (next.y === 0) delete next.y
  if (next.scale === 1) delete next.scale
  if (next.rotate === 0) delete next.rotate
  if (next.opacity === 1) delete next.opacity
  if (next.hidden === false) delete next.hidden
  if (typeof next.text === 'string' && next.text.trim() === '') delete next.text
  return Object.keys(next).length ? (next as ElementEdit) : undefined
}

const fromBoard = (board: Storyboard | null): EditsByScene => {
  const out: EditsByScene = {}
  for (const scene of board?.scenes ?? []) {
    const e = scene.element_edits
    out[scene.scene_id] = e && typeof e === 'object' && !Array.isArray(e) ? { ...e } : {}
  }
  return out
}

export function useElementEdits(projectId: string, board: Storyboard | null, onSaved?: () => void) {
  const [edits, setEdits] = React.useState<EditsByScene>(() => fromBoard(board))
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const past = React.useRef<EditsByScene[]>([])
  const future = React.useRef<EditsByScene[]>([])
  const [historyTick, setHistoryTick] = React.useState(0)

  // Scenes with unsaved local changes: the board's copy must not overwrite them.
  const dirty = React.useRef<Set<string>>(new Set())
  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const latest = React.useRef(edits)
  latest.current = edits
  const onSavedRef = React.useRef(onSaved)
  onSavedRef.current = onSaved

  // Adopt the server's copy for every scene that is not mid-edit (a revision,
  // a new scene, another tab).
  React.useEffect(() => {
    if (!board) return
    const incoming = fromBoard(board)
    setEdits((prev) => {
      const next: EditsByScene = {}
      for (const sceneId of Object.keys(incoming)) {
        next[sceneId] = dirty.current.has(sceneId) ? prev[sceneId] ?? {} : incoming[sceneId]
      }
      return next
    })
  }, [board])

  // One request per scene at a time. Two PUTs in flight can finish in either
  // order, and the older map landing last would silently undo the newer one —
  // so a save requested mid-flight waits and then sends the latest map.
  const inFlight = React.useRef<Set<string>>(new Set())
  const again = React.useRef<Set<string>>(new Set())

  const save = React.useCallback(
    async (sceneId: string): Promise<void> => {
      if (inFlight.current.has(sceneId)) {
        again.current.add(sceneId)
        return
      }
      inFlight.current.add(sceneId)
      const map = latest.current[sceneId] ?? {}
      setSaving(true)
      setError(null)
      try {
        await api.put(`/api/explainer/projects/${projectId}/scenes/${sceneId}/element-edits`, { edits: map })
        // Only clear the flag if nothing changed while the request was out.
        if (latest.current[sceneId] === map && !again.current.has(sceneId)) dirty.current.delete(sceneId)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Your edit could not be saved. It will retry on the next change.')
      } finally {
        inFlight.current.delete(sceneId)
        if (again.current.delete(sceneId)) {
          void save(sceneId)
        } else {
          const busy = Object.keys(timers.current).length > 0 || inFlight.current.size > 0
          setSaving(busy)
          if (!busy && dirty.current.size === 0) onSavedRef.current?.()
        }
      }
    },
    [projectId]
  )

  const schedule = React.useCallback(
    (sceneId: string) => {
      dirty.current.add(sceneId)
      clearTimeout(timers.current[sceneId])
      timers.current[sceneId] = setTimeout(() => {
        delete timers.current[sceneId]
        void save(sceneId)
      }, SAVE_DELAY_MS)
      setSaving(true)
    },
    [save]
  )

  // Flush pending saves when the editor goes away.
  React.useEffect(
    () => () => {
      for (const [sceneId, t] of Object.entries(timers.current)) {
        clearTimeout(t)
        void save(sceneId)
      }
    },
    [save]
  )

  const commitSnapshot = React.useCallback(() => {
    past.current.push(latest.current)
    if (past.current.length > HISTORY_LIMIT) past.current.shift()
    future.current = []
    setHistoryTick((n) => n + 1)
  }, [])

  /**
   * Change one element. `record: false` is for the frames of a drag — the
   * caller records ONE history entry when the gesture starts (`beginGesture`).
   */
  const update = React.useCallback(
    (sceneId: string, id: string, patch: EditPatch | null, record = true) => {
      if (record) commitSnapshot()
      setEdits((prev) => {
        const sceneMap = { ...(prev[sceneId] ?? {}) }
        const next = applyPatch(sceneMap[id], patch)
        if (isEmptyEdit(next)) delete sceneMap[id]
        else sceneMap[id] = next as ElementEdit
        const out = { ...prev, [sceneId]: sceneMap }
        latest.current = out
        return out
      })
      schedule(sceneId)
    },
    [commitSnapshot, schedule]
  )

  const resetScene = React.useCallback(
    (sceneId: string) => {
      commitSnapshot()
      setEdits((prev) => {
        const out = { ...prev, [sceneId]: {} }
        latest.current = out
        return out
      })
      schedule(sceneId)
    },
    [commitSnapshot, schedule]
  )

  const travel = React.useCallback(
    (from: React.MutableRefObject<EditsByScene[]>, to: React.MutableRefObject<EditsByScene[]>) => {
      const target = from.current.pop()
      if (!target) return
      to.current.push(latest.current)
      const changed = new Set([...Object.keys(target), ...Object.keys(latest.current)])
      for (const sceneId of changed) {
        if (target[sceneId] !== latest.current[sceneId]) schedule(sceneId)
      }
      latest.current = target
      setEdits(target)
      setHistoryTick((n) => n + 1)
    },
    [schedule]
  )
  const undo = React.useCallback(() => travel(past, future), [travel])
  const redo = React.useCallback(() => travel(future, past), [travel])

  return {
    edits,
    update,
    beginGesture: commitSnapshot,
    resetScene,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyTick,
    saving,
    error,
  }
}

export type ElementEditsApi = ReturnType<typeof useElementEdits>

/** The shot list with the live (possibly unsaved) edits laid over it. */
export function withLiveEdits(payload: PlayerPayload | null, edits: EditsByScene): PlayerPayload | null {
  if (!payload) return payload
  const scenes = payload.shot_list?.scenes
  if (!Array.isArray(scenes)) return payload
  let changed = false
  const next = scenes.map((scene) => {
    const live = edits[scene.scene_id]
    if (!live) return scene
    const current = scene.element_edits ?? {}
    if (JSON.stringify(current) === JSON.stringify(live)) return scene
    changed = true
    return { ...scene, element_edits: live }
  })
  return changed ? { ...payload, shot_list: { ...payload.shot_list, scenes: next } } : payload
}

/* ------------------------------------------------------------------------ */
/* Naming: an element id, in words.                                          */
/* ------------------------------------------------------------------------ */

const FIELD_LABELS: Record<string, string> = {
  card: 'Whole card',
  heading: 'Heading',
  title: 'Title',
  kicker: 'Eyebrow label',
  caption: 'Caption',
  source: 'Source line',
  note: 'Note',
  verdict: 'Verdict',
  why: 'Explanation',
  phonetic: 'Pronunciation',
  support: 'Supporting line',
  subtitle: 'Subtitle',
  term: 'Term',
  finding: 'Finding',
  quote: 'Quote',
  attribution: 'Attribution',
  mark: 'Quote mark',
  media: 'Picture',
  label: 'Label',
  punchline: 'Punchline',
  bullets: 'Line',
}

export type ParsedId = { slotKey: string | null; field: string; index: number | null }

export function parseEditId(id: string, slotKeys: string[]): ParsedId {
  const parts = id.split('.')
  let slotKey: string | null = null
  if (parts.length > 1 && slotKeys.includes(parts[0])) slotKey = parts.shift() as string
  const field = parts[0] ?? id
  const index = parts[1] !== undefined && /^\d+$/.test(parts[1]) ? Number(parts[1]) : null
  return { slotKey, field, index }
}

export function labelForEditId(id: string, slotKeys: string[]): string {
  const { field, index } = parseEditId(id, slotKeys)
  const base = FIELD_LABELS[field] ?? field.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
  return index !== null ? `${base} ${index + 1}` : base
}
