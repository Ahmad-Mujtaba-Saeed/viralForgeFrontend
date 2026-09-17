'use client'

import * as React from 'react'
import api from '@/lib/axios'
import {
  AlignCenter, AlignLeft, AlignRight, Eye, EyeOff, Loader2, MousePointerClick, Redo2, RotateCcw,
  Undo2, X,
} from 'lucide-react'
import type { Scene } from '../types'
import {
  labelForEditId, parseEditId, type EditPatch, type ElementEdit, type ElementEditsApi, type Selection,
} from './elementEdits'
import { ColorSwatches } from './ColorSwatches'

/**
 * ElementPanel — the sidebar half of stage editing.
 *
 * Everything the floating toolbar does, with exact numbers, plus the wording.
 * Wording goes to the card itself when the element IS the card's own field (a
 * text card's heading or line — so the type is re-fitted and the storyboard
 * reads true); anything else gets a display-only replacement on the edit.
 * Below it, every element this scene has edited, including the ones removed
 * from the frame, so nothing hidden is ever unreachable.
 */

const WEIGHTS: [number | null, string][] = [
  [null, 'As designed'],
  [300, 'Light'],
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'Semibold'],
  [700, 'Bold'],
  [900, 'Black'],
]

const CASES: [ElementEdit['case'] | null, string][] = [
  [null, 'As designed'],
  ['upper', 'AA'],
  ['lower', 'aa'],
  ['title', 'Aa'],
]

const RESET_STYLE: EditPatch = {
  x: null, y: null, scale: null, rotate: null, opacity: null, color: null, weight: null,
  italic: null, underline: null, case: null, align: null, tracking: null, hidden: null, text: null,
}

export function ElementPanel({
  projectId,
  scene,
  selection,
  onSelect,
  edits,
  swatches,
  readText,
  focusTextToken,
  onSlotSaved,
  editMode,
  onEnterEditMode,
}: {
  projectId: string
  scene: Scene
  /** Only when it belongs to this scene. */
  selection: Selection | null
  onSelect: (sel: Selection | null) => void
  edits: ElementEditsApi
  swatches: string[]
  /** What the stage currently shows for an element (its rendered words). */
  readText: (sel: Selection) => string
  /** Bumped when the stage asks to edit the wording (double-click). */
  focusTextToken: number
  onSlotSaved: () => void | Promise<void>
  editMode: boolean
  onEnterEditMode: () => void
}) {
  const sceneEdits = edits.edits[scene.scene_id] ?? {}
  const slotKeys = Object.keys(scene.slots)
  const editedIds = Object.keys(sceneEdits).sort((a, b) => (a === 'card' ? -1 : b === 'card' ? 1 : a.localeCompare(b)))

  return (
    <div className="rounded-xl border border-border bg-inset/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">Frame edits</span>
        <div className="flex items-center gap-1">
          {edits.saving ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-ink3">
              <Loader2 className="h-3 w-3 animate-spin" /> saving
            </span>
          ) : null}
          <IconBtn title="Undo (Ctrl+Z)" disabled={!edits.canUndo} onClick={edits.undo}>
            <Undo2 className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Redo (Ctrl+Shift+Z)" disabled={!edits.canRedo} onClick={edits.redo}>
            <Redo2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
      {edits.error && <p className="mb-2 text-[11px] text-warn">{edits.error}</p>}

      {selection ? (
        <SelectedElement
          key={`${selection.sceneId}:${selection.id}`}
          projectId={projectId}
          scene={scene}
          selection={selection}
          edit={sceneEdits[selection.id] ?? {}}
          onPatch={(p) => edits.update(selection.sceneId, selection.id, p)}
          onClose={() => onSelect(null)}
          swatches={swatches}
          readText={readText}
          focusTextToken={focusTextToken}
          onSlotSaved={onSlotSaved}
        />
      ) : !editMode ? (
        <button
          type="button"
          onClick={onEnterEditMode}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <MousePointerClick className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <b className="text-foreground">Edit on the preview.</b> Click any text or picture to move, resize,
            restyle or remove it. Your changes are used in the render.
          </span>
        </button>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          Click an element on the preview to select it. Drag to move, pull a corner to resize.
        </p>
      )}

      {editedIds.length > 0 && (
        <div className="mt-3 border-t border-border pt-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Edited in this scene</span>
            <button
              type="button"
              onClick={() => {
                edits.resetScene(scene.scene_id)
                onSelect(null)
              }}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Reset all
            </button>
          </div>
          <ul className="flex flex-col gap-0.5">
            {editedIds.map((id) => {
              const e = sceneEdits[id]
              const active = selection?.id === id
              return (
                <li
                  key={id}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] ${active ? 'bg-accent-soft' : 'hover:bg-card'}`}
                >
                  <button
                    type="button"
                    disabled={Boolean(e.hidden)}
                    onClick={() =>
                      onSelect({
                        sceneId: scene.scene_id,
                        id,
                        kind: id === 'card' ? 'card' : parseEditId(id, slotKeys).field === 'media' ? 'media' : 'text',
                      })
                    }
                    className={`min-w-0 flex-1 truncate text-left font-semibold ${e.hidden ? 'text-ink3 line-through' : 'text-foreground'}`}
                  >
                    {labelForEditId(id, slotKeys)}
                  </button>
                  <span className="truncate text-[10px] text-ink3">{describe(e)}</span>
                  <IconBtn
                    title={e.hidden ? 'Put it back in the frame' : 'Remove from the frame'}
                    onClick={() => edits.update(scene.scene_id, id, { hidden: e.hidden ? null : true })}
                  >
                    {e.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </IconBtn>
                  <IconBtn title="Reset this element" onClick={() => edits.update(scene.scene_id, id, null)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </IconBtn>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function describe(e: ElementEdit): string {
  const bits: string[] = []
  if (e.hidden) bits.push('removed')
  if (e.x || e.y) bits.push('moved')
  if (e.scale && e.scale !== 1) bits.push(`${Math.round(e.scale * 100)}%`)
  if (e.rotate) bits.push(`${Math.round(e.rotate)}°`)
  if (e.text) bits.push('reworded')
  if (e.color || e.weight || e.italic !== undefined || e.case || e.align || e.tracking !== undefined || e.underline !== undefined) {
    bits.push('styled')
  }
  if (e.opacity !== undefined) bits.push('faded')
  return bits.join(' · ')
}

function SelectedElement({
  projectId,
  scene,
  selection,
  edit,
  onPatch,
  onClose,
  swatches,
  readText,
  focusTextToken,
  onSlotSaved,
}: {
  projectId: string
  scene: Scene
  selection: Selection
  edit: ElementEdit
  onPatch: (p: EditPatch | null) => void
  onClose: () => void
  swatches: string[]
  readText: (sel: Selection) => string
  focusTextToken: number
  onSlotSaved: () => void | Promise<void>
}) {
  const slotKeys = Object.keys(scene.slots)
  const parsed = parseEditId(selection.id, slotKeys)
  const slot = parsed.slotKey ? scene.slots[parsed.slotKey] : undefined
  const isText = selection.kind === 'text'
  const isStyled = isText || selection.kind === 'group'

  // The card's own field when there is one: a text card's heading or a line.
  const canonical =
    isText && slot?.content_type === 'text_block' && (parsed.field === 'heading' || (parsed.field === 'bullets' && parsed.index !== null))
      ? parsed.field === 'heading'
        ? slot.heading ?? ''
        : slot.bullets?.[parsed.index as number] ?? ''
      : null

  const initialText = canonical ?? edit.text ?? readText(selection)
  const [text, setText] = React.useState(initialText)
  const [savingText, setSavingText] = React.useState(false)
  const [textError, setTextError] = React.useState<string | null>(null)
  const textRef = React.useRef<HTMLTextAreaElement | null>(null)

  React.useEffect(() => {
    setText(canonical ?? edit.text ?? readText(selection))
    // Only when the source of truth changes underneath, not while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonical, edit.text])

  React.useEffect(() => {
    if (focusTextToken && textRef.current) {
      textRef.current.focus()
      textRef.current.select()
      textRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [focusTextToken])

  const saveText = async () => {
    const next = text.replace(/\s+/g, ' ').trim()
    if (canonical !== null) {
      if (next === canonical.trim()) return
      if (!next) {
        setTextError('A line cannot be empty — use "Remove from frame" to hide it.')
        return
      }
      setSavingText(true)
      setTextError(null)
      try {
        const body =
          parsed.field === 'heading'
            ? { heading: next }
            : { bullets: (slot?.bullets ?? []).map((b, i) => (i === parsed.index ? next : b)) }
        await api.patch(`/api/explainer/projects/${projectId}/scenes/${scene.scene_id}/slots/${parsed.slotKey}`, body)
        await onSlotSaved()
      } catch (err: any) {
        setTextError(err?.response?.data?.message || 'The wording could not be saved.')
      } finally {
        setSavingText(false)
      }
      return
    }
    const original = readTextWithoutOverride()
    onPatch({ text: next && next !== original ? next : null })
  }

  // The layout's own words, for "is this actually a change?".
  const readTextWithoutOverride = (): string => (edit.text ? '' : readText(selection))

  const pct = (v: number | undefined, d = 0) => Math.round(((v ?? 0) * 100) * 10 ** d) / 10 ** d

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">{labelForEditId(selection.id, slotKeys)}</p>
          <p className="text-[10px] text-ink3">
            {selection.kind === 'card' ? 'Everything on this card moves together' : `Scene ${scene.order}`}
          </p>
        </div>
        <IconBtn title="Deselect (Esc)" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconBtn>
      </div>

      {isText && (
        <Field label={canonical !== null ? 'Wording' : 'Wording on screen'}>
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => void saveText()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ;(e.target as HTMLTextAreaElement).blur()
              }
            }}
            rows={Math.min(4, Math.max(2, Math.ceil(text.length / 34)))}
            maxLength={300}
            className="w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
          />
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-ink3">
            <span>
              {savingText ? (
                <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> saving</span>
              ) : canonical !== null ? (
                'Saved to the card. The voiceover is not changed.'
              ) : (
                'Changes the words on screen only.'
              )}
            </span>
            {canonical === null && edit.text ? (
              <button type="button" onClick={() => onPatch({ text: null })} className="font-semibold text-primary">
                Use original
              </button>
            ) : null}
          </div>
          {textError && <p className="mt-1 text-[11px] text-warn">{textError}</p>}
        </Field>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Left / right %">
          <NumberInput
            value={pct(edit.x, 1)}
            step={0.5}
            onCommit={(v) => onPatch({ x: v / 100 })}
          />
        </Field>
        <Field label="Up / down %">
          <NumberInput
            value={pct(edit.y, 1)}
            step={0.5}
            onCommit={(v) => onPatch({ y: v / 100 })}
          />
        </Field>
      </div>

      <Slider
        label="Size"
        value={Math.round((edit.scale ?? 1) * 100)}
        min={20}
        max={400}
        suffix="%"
        onChange={(v) => onPatch({ scale: v / 100 })}
      />
      <Slider
        label="Rotation"
        value={Math.round(edit.rotate ?? 0)}
        min={-180}
        max={180}
        suffix="°"
        onChange={(v) => onPatch({ rotate: v })}
      />
      <Slider
        label="Opacity"
        value={Math.round((edit.opacity ?? 1) * 100)}
        min={5}
        max={100}
        suffix="%"
        onChange={(v) => onPatch({ opacity: v / 100 })}
      />

      {isStyled && (
        <>
          <Field label="Colour">
            <ColorSwatches value={edit.color} swatches={swatches} onChange={(c) => onPatch({ color: c })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Weight">
              <select
                value={edit.weight ?? ''}
                onChange={(e) => onPatch({ weight: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
              >
                {WEIGHTS.map(([w, l]) => (
                  <option key={l} value={w ?? ''}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Style">
              <div className="flex gap-1">
                <Toggle active={Boolean(edit.italic)} onClick={() => onPatch({ italic: edit.italic ? null : true })}>
                  <i className="font-serif">I</i>
                </Toggle>
                <Toggle active={Boolean(edit.underline)} onClick={() => onPatch({ underline: edit.underline ? null : true })}>
                  <u>U</u>
                </Toggle>
              </div>
            </Field>
          </div>
          <Field label="Letter case">
            <Segmented
              options={CASES.map(([v, l]) => ({ key: v ?? '', label: l }))}
              value={edit.case ?? ''}
              onChange={(k) => onPatch({ case: (k || null) as ElementEdit['case'] | null })}
            />
          </Field>
          <Field label="Alignment">
            <Segmented
              options={[
                { key: '', label: 'As designed' },
                { key: 'left', label: <AlignLeft className="mx-auto h-3.5 w-3.5" /> },
                { key: 'center', label: <AlignCenter className="mx-auto h-3.5 w-3.5" /> },
                { key: 'right', label: <AlignRight className="mx-auto h-3.5 w-3.5" /> },
              ]}
              value={edit.align ?? ''}
              onChange={(k) => onPatch({ align: (k || null) as ElementEdit['align'] | null })}
            />
          </Field>
          <Slider
            label="Letter spacing"
            value={Math.round((edit.tracking ?? 0) * 100)}
            min={-10}
            max={50}
            suffix=""
            onChange={(v) => onPatch({ tracking: v === 0 ? null : v / 100 })}
          />
        </>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onPatch({ hidden: true })
            onClose()
          }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-semibold text-foreground hover:bg-inset"
        >
          <EyeOff className="h-3.5 w-3.5" /> Remove from frame
        </button>
        <button
          type="button"
          onClick={() => onPatch(canonical !== null ? { ...RESET_STYLE, text: undefined } : RESET_STYLE)}
          disabled={Object.keys(edit).length === 0}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-semibold text-foreground hover:bg-inset disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink3">{label}</span>
      {children}
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  onChange: (v: number) => void
}) {
  // Local while dragging, committed on release: one undo step per slide.
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => setLocal(value), [value])
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink3">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {local}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerUp={() => local !== value && onChange(local)}
        onKeyUp={() => local !== value && onChange(local)}
        onBlur={() => local !== value && onChange(local)}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  )
}

function NumberInput({ value, step, onCommit }: { value: number; step: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = React.useState(String(value))
  React.useEffect(() => setLocal(String(value)), [value])
  const commit = () => {
    const n = Number(local)
    if (Number.isFinite(n) && n !== value) onCommit(Math.max(-150, Math.min(150, n)))
    else setLocal(String(value))
  }
  return (
    <input
      type="number"
      step={step}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-right font-mono text-[12px] text-foreground outline-none focus:border-primary"
    />
  )
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: React.ReactNode }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-border">
      {options.map((o) => (
        <button
          key={o.key || 'default'}
          type="button"
          onClick={() => onChange(o.key)}
          className={`min-w-0 flex-1 truncate px-1.5 py-1 text-[11px] font-semibold transition-colors ${
            value === o.key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-inset'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-[30px] flex-1 rounded-lg border text-[13px] font-semibold transition-colors ${
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-inset'
      }`}
    >
      {children}
    </button>
  )
}

function IconBtn({
  title,
  onClick,
  disabled = false,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-35"
    >
      {children}
    </button>
  )
}
