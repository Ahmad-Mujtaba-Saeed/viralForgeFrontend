'use client'

import * as React from 'react'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, CaseSensitive, EyeOff, Italic, Minus, MousePointer2,
  Palette, Plus, RotateCcw, SquareDashed, Type,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  labelForEditId, type EditPatch, type ElementEdit, type ElementEditsApi, type Selection,
} from './elementEdits'
import { ColorSwatches } from './ColorSwatches'

/**
 * EditStage — click, drag and restyle the elements of the frame on screen.
 *
 * A transparent layer over the player. It never draws the video itself: the
 * composition underneath is the real renderer, and every change here goes
 * into the scene's `element_edits`, which that renderer applies (see
 * lib/remotion/components/Editable.tsx). So what you drag is what renders.
 *
 * Picking is DOM hit-testing: editable elements carry `data-edit-id` and
 * `data-edit-scene`, and `elementsFromPoint` finds the innermost one under the
 * pointer (Alt+click takes its parent, so the card behind a heading is always
 * reachable). Boxes are re-measured every animation frame, because the
 * elements under them animate and the camera moves.
 *
 * Offsets are stored as fractions of the frame and applied in the element's
 * parent's coordinate space, so a screen-pixel drag is divided by that
 * parent's on-screen scale — right in slides, in the scaled canvas stations,
 * and at any player size.
 */

type Box = { left: number; top: number; width: number; height: number }

type Drag =
  | null
  | {
      mode: 'move' | 'scale' | 'rotate'
      sel: Selection
      startX: number
      startY: number
      base: ElementEdit
      /** Screen px per local px of the element's parent. */
      parentScale: number
      cx: number
      cy: number
      startDist: number
      startAngle: number
      moved: boolean
    }

const CASE_CYCLE: (ElementEdit['case'] | undefined)[] = [undefined, 'upper', 'lower', 'title']
const CASE_LABEL: Record<string, string> = { upper: 'AA', lower: 'aa', title: 'Aa' }

const selector = (sel: { sceneId: string; id: string }): string =>
  `[data-edit-scene="${CSS.escape(sel.sceneId)}"][data-edit-id="${CSS.escape(sel.id)}"]`

const toSelection = (el: Element): Selection | null => {
  const id = el.getAttribute('data-edit-id')
  const sceneId = el.getAttribute('data-edit-scene')
  if (!id || !sceneId) return null
  const kind = (el.getAttribute('data-edit-kind') as Selection['kind']) || 'text'
  return { sceneId, id, kind }
}

export function EditStage({
  rootRef,
  compositionWidth,
  compositionHeight,
  selection,
  onSelect,
  onEditText,
  onInteract,
  edits,
  swatches,
  slotKeysOf,
}: {
  /** The element that contains the player (and only the player). */
  rootRef: React.RefObject<HTMLDivElement | null>
  compositionWidth: number
  compositionHeight: number
  selection: Selection | null
  onSelect: (sel: Selection | null) => void
  /** Double-click on text, or the toolbar's "Edit text". */
  onEditText: (sel: Selection) => void
  /** Any pointer-down on the stage (the deck pauses playback). */
  onInteract: () => void
  edits: ElementEditsApi
  swatches: string[]
  slotKeysOf: (sceneId: string) => string[]
}) {
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const [hover, setHover] = React.useState<{ sel: Selection; box: Box } | null>(null)
  const [box, setBox] = React.useState<Box | null>(null)
  const drag = React.useRef<Drag>(null)
  const [dragging, setDragging] = React.useState<NonNullable<Drag>['mode'] | null>(null)
  const hoverPoint = React.useRef<{ x: number; y: number } | null>(null)

  const editOf = React.useCallback(
    (sel: Selection): ElementEdit => edits.edits[sel.sceneId]?.[sel.id] ?? {},
    [edits.edits]
  )

  const findEl = React.useCallback(
    (sel: { sceneId: string; id: string }): HTMLElement | null => {
      const root = rootRef.current
      if (!root) return null
      const all = root.querySelectorAll<HTMLElement>(selector(sel))
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) return el
      }
      return null
    },
    [rootRef]
  )

  const pick = React.useCallback(
    (x: number, y: number, parent = false): Element | null => {
      const root = rootRef.current
      if (!root) return null
      for (const node of document.elementsFromPoint(x, y)) {
        if (!root.contains(node)) continue
        let hit = node.closest('[data-edit-id]')
        if (hit && parent) hit = hit.parentElement?.closest('[data-edit-id]') ?? hit
        if (hit && root.contains(hit)) return hit
      }
      return null
    },
    [rootRef]
  )

  const measure = React.useCallback((el: Element | null): Box | null => {
    const o = overlayRef.current?.getBoundingClientRect()
    if (!el || !o) return null
    const r = el.getBoundingClientRect()
    return { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height }
  }, [])

  // Re-measure every frame: the element animates, the camera moves, the
  // player resizes, and the edit itself moves it.
  React.useEffect(() => {
    let raf = 0
    const tick = () => {
      if (selection) {
        const next = measure(findEl(selection))
        setBox((prev) =>
          prev && next && prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.height === next.height
            ? prev
            : next
        )
      } else {
        setBox(null)
      }
      const p = hoverPoint.current
      if (p && !drag.current) {
        const el = pick(p.x, p.y)
        const sel = el ? toSelection(el) : null
        const hb = el ? measure(el) : null
        setHover((prev) =>
          sel && hb
            ? prev && prev.sel.id === sel.id && prev.sel.sceneId === sel.sceneId &&
              prev.box.left === hb.left && prev.box.top === hb.top && prev.box.width === hb.width && prev.box.height === hb.height
              ? prev
              : { sel, box: hb }
            : null
        )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [selection, findEl, measure, pick])

  const parentScaleOf = (el: HTMLElement | null): number => {
    const parent = el?.parentElement
    const o = overlayRef.current?.getBoundingClientRect()
    const fallback = o && compositionWidth ? o.width / compositionWidth : 1
    if (!parent || !parent.offsetWidth) return fallback
    const s = parent.getBoundingClientRect().width / parent.offsetWidth
    return Number.isFinite(s) && s > 0 ? s : fallback
  }

  const startDrag = (mode: 'move' | 'scale' | 'rotate', sel: Selection, e: React.PointerEvent) => {
    const el = findEl(sel)
    const r = el?.getBoundingClientRect()
    const cx = r ? r.left + r.width / 2 : e.clientX
    const cy = r ? r.top + r.height / 2 : e.clientY
    drag.current = {
      mode,
      sel,
      startX: e.clientX,
      startY: e.clientY,
      base: editOf(sel),
      parentScale: parentScaleOf(el),
      cx,
      cy,
      startDist: Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy)),
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      moved: false,
    }
    overlayRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    onInteract()
    overlayRef.current?.focus({ preventScroll: true })
    const el = pick(e.clientX, e.clientY, e.altKey)
    const sel = el ? toSelection(el) : null
    onSelect(sel)
    if (sel) startDrag('move', sel, e)
  }

  const onHandleDown = (mode: 'scale' | 'rotate') => (e: React.PointerEvent) => {
    e.stopPropagation()
    if (!selection || e.button !== 0) return
    onInteract()
    startDrag(mode, selection, e)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    hoverPoint.current = { x: e.clientX, y: e.clientY }
    const d = drag.current
    if (!d) return
    let dx = e.clientX - d.startX
    let dy = e.clientY - d.startY
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 3) return
      d.moved = true
      edits.beginGesture()
      setDragging(d.mode)
      setHover(null)
    }
    const { sceneId, id } = d.sel
    if (d.mode === 'move') {
      // Shift locks to the dominant axis.
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0
        else dx = 0
      }
      const W = compositionWidth || 1920
      const H = compositionHeight || 1080
      let x = (d.base.x ?? 0) + dx / d.parentScale / W
      let y = (d.base.y ?? 0) + dy / d.parentScale / H
      // A soft snap back onto the designed position (6 screen px).
      if (Math.abs(x * W * d.parentScale) < 6) x = 0
      if (Math.abs(y * H * d.parentScale) < 6) y = 0
      edits.update(sceneId, id, { x: round(x, 4), y: round(y, 4) }, false)
    } else if (d.mode === 'scale') {
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy)
      const scale = clamp((d.base.scale ?? 1) * (dist / d.startDist), 0.2, 5)
      edits.update(sceneId, id, { scale: round(scale, 3) }, false)
    } else {
      const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx)
      let deg = (d.base.rotate ?? 0) + ((angle - d.startAngle) * 180) / Math.PI
      deg = ((((deg + 180) % 360) + 360) % 360) - 180
      if (e.shiftKey) deg = Math.round(deg / 15) * 15
      else if (Math.abs(deg) < 3) deg = 0
      edits.update(sceneId, id, { rotate: round(deg, 1) }, false)
    }
  }

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current) {
      try {
        overlayRef.current?.releasePointerCapture(e.pointerId)
      } catch {
        // already released
      }
    }
    drag.current = null
    setDragging(null)
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const el = pick(e.clientX, e.clientY)
    const sel = el ? toSelection(el) : null
    if (sel && sel.kind === 'text') onEditText(sel)
  }

  // Keyboard: nudge, hide, deselect, undo/redo.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) edits.redo()
      else edits.undo()
      return
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      edits.redo()
      return
    }
    if (!selection) return
    const { sceneId, id } = selection
    const current = editOf(selection)
    const step = e.shiftKey ? 0.02 : 0.002
    const nudge: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    if (nudge[e.key]) {
      e.preventDefault()
      const [nx, ny] = nudge[e.key]
      edits.update(sceneId, id, { x: round((current.x ?? 0) + nx, 4), y: round((current.y ?? 0) + ny, 4) })
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      edits.update(sceneId, id, { hidden: true })
      onSelect(null)
    } else if (e.key === 'Escape') {
      onSelect(null)
    }
  }

  const sel = selection
  const current = sel ? editOf(sel) : {}
  const label = sel ? labelForEditId(sel.id, slotKeysOf(sel.sceneId)) : ''
  const patch = (p: EditPatch) => sel && edits.update(sel.sceneId, sel.id, p)

  const toolbarAbove = box ? box.top > 54 : true

  return (
    <div
      ref={overlayRef}
      tabIndex={0}
      role="application"
      aria-label="Edit the frame: click an element to select it, drag to move it"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        hoverPoint.current = null
        setHover(null)
      }}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      className={`absolute inset-0 z-10 select-none outline-none ${
        dragging === 'move' ? 'cursor-grabbing' : hover ? 'cursor-grab' : 'cursor-default'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Hover outline — what a click would pick. */}
      {hover && !dragging && !(sel && hover.sel.id === sel.id && hover.sel.sceneId === sel.sceneId) && (
        <div
          className="pointer-events-none absolute rounded-[3px] border border-dashed border-white/70"
          style={{ ...hover.box, boxShadow: '0 0 0 1px rgba(0,0,0,.35)' }}
        >
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {labelForEditId(hover.sel.id, slotKeysOf(hover.sel.sceneId))}
          </span>
        </div>
      )}

      {sel && box && (
        <>
          <div
            className="pointer-events-none absolute rounded-[3px] border-2 border-primary"
            style={{ ...box, boxShadow: '0 0 0 1px rgba(0,0,0,.4)' }}
          />
          {/* Resize handles on the corners, rotation above. */}
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <span
              key={corner}
              onPointerDown={onHandleDown('scale')}
              className="absolute z-20 h-3 w-3 rounded-[3px] border-2 border-primary bg-white shadow"
              style={{
                left: (corner.includes('w') ? box.left : box.left + box.width) - 6,
                top: (corner.includes('n') ? box.top : box.top + box.height) - 6,
                cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
              }}
              title="Drag to resize"
            />
          ))}
          <span
            onPointerDown={onHandleDown('rotate')}
            className="absolute z-20 grid h-5 w-5 place-items-center rounded-full border-2 border-primary bg-white text-primary shadow"
            style={{
              left: box.left + box.width / 2 - 10,
              top: toolbarAbove ? box.top + box.height + 8 : box.top - 26,
              cursor: 'grab',
            }}
            title="Drag to rotate (Shift snaps to 15°)"
          >
            <RotateCcw className="h-3 w-3" />
          </span>

          {!dragging && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="absolute z-30 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-soft-lg"
              style={{
                left: clamp(box.left, 4, Math.max(4, (overlayRef.current?.clientWidth ?? 0) - 380)),
                top: toolbarAbove ? box.top - 44 : Math.min(box.top + box.height + 34, (overlayRef.current?.clientHeight ?? 0) - 40),
              }}
            >
              <span className="px-1.5 text-[11px] font-bold text-foreground">{label}</span>
              <Sep />
              <ToolButton title="Smaller" onClick={() => patch({ scale: round(clamp((current.scale ?? 1) / 1.1, 0.2, 5), 3) })}>
                <Minus className="h-3.5 w-3.5" />
              </ToolButton>
              <span className="w-10 text-center font-mono text-[11px] text-muted-foreground">
                {Math.round((current.scale ?? 1) * 100)}%
              </span>
              <ToolButton title="Bigger" onClick={() => patch({ scale: round(clamp((current.scale ?? 1) * 1.1, 0.2, 5), 3) })}>
                <Plus className="h-3.5 w-3.5" />
              </ToolButton>

              {(sel.kind === 'text' || sel.kind === 'group') && (
                <>
                  <Sep />
                  <ToolButton
                    title="Bold"
                    active={(current.weight ?? 0) >= 700}
                    onClick={() => patch({ weight: (current.weight ?? 0) >= 700 ? 400 : 800 })}
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </ToolButton>
                  <ToolButton title="Italic" active={Boolean(current.italic)} onClick={() => patch({ italic: current.italic ? null : true })}>
                    <Italic className="h-3.5 w-3.5" />
                  </ToolButton>
                  <ToolButton
                    title="Letter case"
                    active={Boolean(current.case)}
                    onClick={() => {
                      const i = CASE_CYCLE.indexOf(current.case)
                      patch({ case: CASE_CYCLE[(i + 1) % CASE_CYCLE.length] ?? null })
                    }}
                  >
                    {current.case && CASE_LABEL[current.case] ? (
                      <span className="text-[10px] font-bold">{CASE_LABEL[current.case]}</span>
                    ) : (
                      <CaseSensitive className="h-3.5 w-3.5" />
                    )}
                  </ToolButton>
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <ToolButton
                      key={a}
                      title={`Align ${a}`}
                      active={current.align === a}
                      onClick={() => patch({ align: current.align === a ? null : a })}
                    >
                      {a === 'left' ? <AlignLeft className="h-3.5 w-3.5" /> : a === 'center' ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                    </ToolButton>
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        title="Colour"
                        className="grid h-7 w-7 place-items-center rounded-md hover:bg-inset"
                      >
                        <span className="relative">
                          <Palette className="h-3.5 w-3.5" />
                          {current.color && (
                            <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded" style={{ background: current.color }} />
                          )}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-56 p-2.5" onPointerDown={(e) => e.stopPropagation()}>
                      <ColorSwatches
                        value={current.color}
                        swatches={swatches}
                        onChange={(c) => patch({ color: c })}
                      />
                    </PopoverContent>
                  </Popover>
                  {sel.kind === 'text' && (
                    <ToolButton title="Edit the wording" onClick={() => onEditText(sel)}>
                      <Type className="h-3.5 w-3.5" />
                    </ToolButton>
                  )}
                </>
              )}

              <Sep />
              {sel.id !== 'card' && (
                <ToolButton
                  title="Select the whole card"
                  onClick={() => onSelect({ sceneId: sel.sceneId, id: 'card', kind: 'card' })}
                >
                  <SquareDashed className="h-3.5 w-3.5" />
                </ToolButton>
              )}
              <ToolButton
                title="Reset this element"
                disabled={Object.keys(current).length === 0}
                onClick={() => patch({
                  x: null, y: null, scale: null, rotate: null, opacity: null, color: null, weight: null,
                  italic: null, underline: null, case: null, align: null, tracking: null, hidden: null,
                })}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                title="Remove from the frame (Delete)"
                onClick={() => {
                  patch({ hidden: true })
                  onSelect(null)
                }}
              >
                <EyeOff className="h-3.5 w-3.5" />
              </ToolButton>
            </div>
          )}
        </>
      )}

      {!sel && !hover && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-[11px] font-medium text-white">
          <MousePointer2 className="mr-1 inline h-3 w-3" />
          Click any text or picture to edit it · Alt+click selects the card behind
        </div>
      )}
    </div>
  )
}

function ToolButton({
  children,
  title,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 min-w-7 place-items-center rounded-md px-1 transition-colors disabled:opacity-40 ${
        active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-inset'
      }`}
    >
      {children}
    </button>
  )
}

const Sep = () => <span className="mx-0.5 h-5 w-px bg-border" />

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const round = (v: number, d: number): number => {
  const f = 10 ** d
  return Math.round(v * f) / f
}
