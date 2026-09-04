'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/axios'
import {
  Loader2, Upload, X, Film, MessageSquare, Move, MapPin, Sparkles, Eye,
  Pencil, Check, Wand2, Plus, Search, Library,
} from 'lucide-react'
import type { Slot, MediaProvider, MediaHit } from './types'
import { TextBlockEditor } from './TextBlockEditor'

/**
 * The free media library, per slot.
 *
 * The third way to fill a picture slot, beside "Generate with AI" and an
 * upload — and for most real-world subjects the best one, because a real
 * photograph of a trading floor beats a diffusion model's idea of one.
 *
 * The search box is pre-seeded with the planner's own `search_query`, which is
 * the point: the user opens the panel and the right results are already
 * there. Picking one posts the provider + id + query — never a URL — and the
 * server downloads it from its own copy of that result.
 */
export function MediaLibraryPanel({
  projectId, sceneId, slotKey, slot, providers, onClose, onChange,
}: {
  projectId: string
  sceneId: string
  slotKey: string
  slot: Slot
  providers: MediaProvider[]
  onClose: () => void
  onChange: () => void | Promise<void>
}) {
  const brief = slot.asset_request
  const wantsVideo = slot.content_type === 'video' || brief?.media_kind === 'video'

  const [query, setQuery] = useState(brief?.search_query || brief?.description?.slice(0, 60) || '')
  const [kind, setKind] = useState<'image' | 'video'>(wantsVideo ? 'video' : 'image')
  const [hits, setHits] = useState<MediaHit[]>([])
  const [searching, setSearching] = useState(false)
  const [adopting, setAdopting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // A video slot can only take footage — offering the toggle would be a lie.
  const kindLocked = slot.content_type === 'video'

  const search = useCallback(async (q: string, k: 'image' | 'video') => {
    const term = q.trim()
    if (!term) return
    setSearching(true)
    setError(null)
    try {
      const res = await api.get(`/api/explainer/projects/${projectId}/media-search`, {
        params: { query: term, kind: k },
      })
      setHits(res.data?.data?.results ?? [])
      setSearched(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'The search could not be run. Try again in a moment.')
    } finally {
      setSearching(false)
    }
  }, [projectId])

  // Search once as soon as the panel opens: the whole promise of this feature
  // is "here are pictures that fit this scene", not "here is a search box".
  useEffect(() => {
    if (query.trim()) void search(query, kind)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const use = async (hit: MediaHit) => {
    setAdopting(hit.id)
    setError(null)
    try {
      await api.post(
        `/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}/media`,
        { provider: hit.provider, id: hit.id, query: query.trim(), kind: hit.kind },
      )
      await onChange()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'That file could not be used. Try another result.')
    } finally {
      setAdopting(null)
    }
  }

  const usable = providers.filter((p) => p.configured && p.kinds.includes(kind))
  const missing = providers.filter((p) => !p.configured)

  return (
    <div className="mt-2 rounded-lg border border-primary bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void search(query, kind) }}
          maxLength={80}
          placeholder="busy trading floor"
          className="min-w-0 flex-1 rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-ink3 focus:border-primary"
        />
        <button
          onClick={() => void search(query, kind)}
          disabled={searching || !query.trim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} Search
        </button>
      </div>

      {!kindLocked && (
        <div className="mb-2 flex items-center gap-1">
          {(['image', 'video'] as const).map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); void search(query, k) }}
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                kind === k ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-inset text-muted-foreground hover:bg-card'
              }`}
            >
              {k === 'image' ? 'Photos' : 'Clips'}
            </button>
          ))}
          <span className="ml-1 truncate text-[10px] text-ink3">
            {usable.length > 0 ? usable.map((p) => p.label).join(' · ') : 'no source for this kind'}
          </span>
        </div>
      )}

      {searching && hits.length === 0 && (
        <div className="flex h-24 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching the free libraries…
        </div>
      )}

      {!searching && searched && hits.length === 0 && (
        <p className="py-4 text-center text-[11px] text-muted-foreground">
          Nothing found for “{query}”. Try fewer, plainer words — or draw it with AI instead.
        </p>
      )}

      {hits.length > 0 && (
        <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto">
          {hits.map((hit) => (
            <button
              key={hit.id}
              onClick={() => void use(hit)}
              disabled={adopting !== null}
              title={`${hit.title || hit.provider_label}${hit.credit?.author ? ` — ${hit.credit.author}` : ''}\n${hit.license}`}
              className="group relative aspect-video overflow-hidden rounded-md border border-border bg-inset disabled:cursor-not-allowed"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hit.thumb} alt={hit.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <span className="absolute bottom-0 left-0 right-0 truncate bg-black/70 px-1 py-0.5 text-left text-[9px] font-semibold text-white">
                {hit.provider_label}{hit.duration ? ` · ${hit.duration}s` : ''}
              </span>
              {adopting === hit.id && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] text-warn">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] text-ink3">
          {missing.length > 0
            ? `Add a ${missing.map((p) => p.label).join(' / ')} key in admin settings for more results.`
            : 'Free to use. Creative Commons results keep their credit on the scene.'}
        </span>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-inset"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export function SlotCard({
  projectId, sceneId, slotKey, slot, cameraMoves, autoVisuals = false, mediaLibrary, disabled = false, onChange,
}: {
  projectId: string
  sceneId: string
  slotKey: string
  slot: Slot
  mediaLibrary?: { available: boolean; providers: MediaProvider[] }
  cameraMoves: string[]
  autoVisuals?: boolean
  disabled?: boolean
  onChange: () => void
}) {
  const [editingText, setEditingText] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // On-demand AI art. Only image slots: there is no model here that makes
  // video, and a stock clip has its own fetcher.
  const source = slot.asset?.source ?? 'upload'
  const canGenerate = slot.content_type === 'image'
  // The free library serves both kinds — a video slot simply searches clips.
  const canBrowse = Boolean(mediaLibrary?.available)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [subject, setSubject] = useState(slot.asset_request?.description ?? '')
  const [instruction, setInstruction] = useState(slot.asset_request?.instruction ?? '')
  const busy = uploading || removing || generating || disabled

  // Seed the fields from the slot every time the panel opens, not once on
  // mount: an AI revision can rewrite the description underneath us, and
  // editing a stale copy would silently revert it.
  const openPanel = () => {
    setSubject(slot.asset_request?.description ?? '')
    setInstruction(slot.asset_request?.instruction ?? '')
    setGenError(null)
    setPanelOpen(true)
  }

  const generate = async () => {
    setGenerating(true)
    setGenError(null)
    try {
      await api.post(
        `/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}/generate`,
        { description: subject, instruction }
      )
      await onChange()
      setPanelOpen(false)
    } catch (err: any) {
      setGenError(err?.response?.data?.message || 'The image could not be generated.')
    } finally {
      setGenerating(false)
    }
  }

  const updateCameraMove = async (move: string) => {
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}`, {
        camera_move: move,
      })
      await onChange()
    } catch {
      alert('Failed to update camera move')
    }
  }

  const upload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post(
        `/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}/asset`,
        fd
      )
      await onChange()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const remove = async () => {
    setRemoving(true)
    try {
      await api.delete(`/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}/asset`)
      await onChange()
    } catch {
      alert('Failed to remove asset')
    } finally {
      setRemoving(false)
    }
  }

  const dockBadge = slot.dock ? (
    <span className="ml-1 rounded bg-inset px-1.5 py-0.5 text-[10px] text-ink3">{slot.dock}</span>
  ) : null

  if (slot.content_type === 'text_block') {
    if (editingText) {
      return (
        <TextBlockEditor
          projectId={projectId}
          sceneId={sceneId}
          slotKey={slotKey}
          slot={slot}
          disabled={disabled}
          onChange={onChange}
          onDone={() => setEditingText(false)}
        />
      )
    }
    return (
      <button
        onClick={() => !disabled && setEditingText(true)}
        disabled={disabled}
        title="Edit the words on this card"
        className="group w-full rounded-xl border border-border bg-inset p-3 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink3">{slotKey}{dockBadge}</span>
          <Pencil className="h-3.5 w-3.5 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {slot.heading && <div className="font-semibold text-primary">{slot.heading}</div>}
        <ul className="mt-1 space-y-0.5 text-sm text-foreground">
          {(slot.bullets || []).map((b, i) => (
            <li key={i} className="flex gap-1.5"><span className="text-primary">›</span>{b}</li>
          ))}
        </ul>
      </button>
    )
  }

  if (slot.content_type === 'explanation_box') {
    return (
      <div className="rounded-xl border border-border bg-inset p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink3">{slotKey}{dockBadge}</span>
          <MessageSquare className="h-3.5 w-3.5 text-ink3" />
        </div>
        {slot.heading && <div className="font-semibold text-primary">{slot.heading}</div>}
        {slot.body && <p className="mt-1 text-sm text-muted-foreground">{slot.body}</p>}
      </div>
    )
  }

  // Structured data-card contents: read-only summaries — the renderer draws
  // these natively, so there is nothing to upload.
  //
  // The test is DELIBERATELY the complement of the two media types rather than
  // a list of native ones. This used to whitelist the native content types,
  // and every card the improvement loop added afterwards (formula, practice,
  // mistake, term, venn, layers, decision, receipt, cycle, spectrum,
  // pictogram, myth_fact — twelve of them) fell through to the media branch
  // and asked the user to upload a photo for an equation. The backend already
  // treats exactly `image`/`video` as the uploadable slots (serializeStoryboard
  // in ExplainerController), so matching that rule here keeps the two sides in
  // agreement and makes the next new card type correct for free.
  if (slot.content_type !== 'image' && slot.content_type !== 'video') {
    const s = slot as Record<string, any>
    let summary: React.ReactNode = null
    if (slot.content_type === 'custom_html') {
      // The bespoke card. Its markup is sanitised server-side, but the
      // storyboard still shows only its TEXT — rendering a fragment here
      // would make the dashboard trust that sanitiser completely, and the
      // user can already SEE the real thing in the style preview, which is a
      // genuine Remotion frame rather than a browser's guess at one.
      const text = String(s.html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const cues = (String(s.html ?? '').match(/data-(at|word)="/g) || []).length
      summary = (
        <div className="text-sm text-foreground">
          <p className="line-clamp-3 text-muted-foreground">{text || 'An empty fragment'}</p>
          <p className="mt-1.5 text-[11px] text-ink3">
            Hand-built card · {cues > 0 ? `${cues} timed reveal${cues === 1 ? '' : 's'}` : 'no timed reveals'}
            {s.css ? ' · custom styling' : ''} — see it in the style preview
          </p>
        </div>
      )
    } else if (slot.content_type === 'versus') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold text-primary">{s.left?.label || '?'}</span>
          <span className="mx-1.5 text-ink3">vs</span>
          <span className="font-semibold text-primary">{s.right?.label || '?'}</span>
          {s.verdict ? <p className="mt-1 text-xs text-muted-foreground">Verdict: {s.verdict}</p> : null}
        </div>
      )
    } else if (slot.content_type === 'chart') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold capitalize text-primary">{s.chart_type || 'bar'} chart</span>
          <span className="ml-1.5 text-muted-foreground">
            {(s.values || []).join(', ')} {s.unit || ''}
          </span>
          {s.caption ? <p className="mt-1 text-xs text-muted-foreground">{s.caption}</p> : null}
        </div>
      )
    } else if (slot.content_type === 'proscons') {
      summary = (
        <div className="text-sm text-foreground">
          {(s.pros || []).map((p: string, i: number) => (
            <div key={`p${i}`} className="flex gap-1.5"><span className="text-primary">✓</span>{p}</div>
          ))}
          {(s.cons || []).map((c: string, i: number) => (
            <div key={`c${i}`} className="flex gap-1.5 text-muted-foreground"><span>✗</span>{c}</div>
          ))}
        </div>
      )
    } else if (slot.content_type === 'timeline_nodes') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          {(s.nodes || []).map((n: any, i: number) => (
            <div key={i} className="flex gap-1.5">
              <span className="font-mono text-xs text-primary">{n.date}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      )
    } else if (slot.content_type === 'ranking') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          {(s.items || []).map((it: any, i: number) => (
            <div key={i} className="flex gap-1.5">
              <span className="font-mono text-xs text-primary">#{(s.items || []).length - i}</span>
              <span>{typeof it === 'string' ? it : it.label || it.text}</span>
            </div>
          ))}
        </div>
      )
    } else if (slot.content_type === 'meter') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold text-primary">{s.value_pct}{s.unit || '%'}</span>
          <span className="ml-1.5 text-muted-foreground">{s.label}</span>
        </div>
      )
    } else if (slot.content_type === 'map') {
      summary = (
        <div className="text-sm text-foreground">
          {(s.pins || []).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{p.label}</span>
              <span className="font-mono text-[10px] text-ink3">{p.lat}, {p.lon}</span>
            </div>
          ))}
          {s.route ? <p className="mt-1 text-xs text-muted-foreground">Route arc between pins</p> : null}
        </div>
      )
    } else if (slot.content_type === 'headlines') {
      summary = (
        <div className="space-y-1 text-sm text-foreground">
          {(s.items || []).map((it: any, i: number) => (
            <div key={i}>
              “{it.text}”
              {it.source ? <span className="ml-1.5 font-mono text-[10px] uppercase text-ink3">{it.source}</span> : null}
            </div>
          ))}
        </div>
      )
    } else if (slot.content_type === 'math_steps') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          {(s.steps || []).map((st: any, i: number) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-ink3">{String(i + 1).padStart(2, '0')}</span>
              <span className={`font-mono ${i === (s.steps || []).length - 1 ? 'font-semibold text-primary' : ''}`}>
                {st.expr}
              </span>
              {st.note ? <span className="text-[10px] uppercase text-ink3">{st.note}</span> : null}
            </div>
          ))}
          <p className="mt-1 text-[10px] uppercase tracking-wide text-ink3">Rendered as an animated worked solution</p>
        </div>
      )
    } else if (slot.content_type === 'scenario') {
      summary = (
        <div className="text-sm text-foreground">
          <div className="flex flex-wrap items-center gap-1.5">
            {(s.entities || []).map((e: any, i: number) => (
              <Fragment key={i}>
                {i > 0 ? <span className="text-ink3">→</span> : null}
                <span className="rounded border border-border px-1.5 py-0.5 font-semibold">
                  {e?.label}
                  {e?.value ? <span className="ml-1 font-mono text-[10px] text-primary">{e.value}</span> : null}
                </span>
              </Fragment>
            ))}
            {s.question ? <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary">{s.question}</span> : null}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-ink3">Drawn as an animated setup diagram — nothing to upload</p>
        </div>
      )
    } else if (slot.content_type === 'geometry') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold capitalize text-primary">{String(s.shape || 'figure').replace('_', ' ')}</span>
          {(s.points || []).some((p: any) => p?.label) ? (
            <span className="ml-1.5 text-muted-foreground">
              {(s.points || []).map((p: any) => p?.label).filter(Boolean).join('')}
            </span>
          ) : null}
          {(s.side_labels || []).filter(Boolean).length ? (
            <p className="mt-1 text-xs text-muted-foreground">Sides: {(s.side_labels || []).filter(Boolean).join(' · ')}</p>
          ) : null}
          {(s.angle_marks || []).length ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Angles: {(s.angle_marks || []).map((m: any) => (m?.right ? '90° (right)' : m?.label)).filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {s.radius_label ? <p className="mt-0.5 text-xs text-muted-foreground">{s.radius_label}</p> : null}
          <p className="mt-1 text-[10px] uppercase tracking-wide text-ink3">Drawn natively — nothing to upload</p>
        </div>
      )
    } else if (slot.content_type === 'function_plot') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-mono font-semibold text-primary">y = {s.expression}</span>
          <span className="ml-1.5 font-mono text-xs text-muted-foreground">
            x ∈ [{s.x_min ?? -5}, {s.x_max ?? 5}]
          </span>
          {(s.marks || []).length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Marks: {(s.marks || []).map((m: any) => m?.label || `x = ${m?.x}`).join(' · ')}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] uppercase tracking-wide text-ink3">Plotted natively — nothing to upload</p>
        </div>
      )
    } else if (slot.content_type === 'formula') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-mono font-semibold text-primary">{s.formula}</span>
          <div className="mt-1 space-y-0.5">
            {(s.parts || []).map((p: any, i: number) => (
              <div key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono text-primary">{p?.match}</span>
                <span>— {p?.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-ink3">Typeset and labelled natively — nothing to upload</p>
        </div>
      )
    } else if (slot.content_type === 'practice') {
      summary = (
        <div className="text-sm text-foreground">
          <div className="font-mono text-primary">{s.prompt}</div>
          {s.hint ? <p className="mt-1 text-xs text-muted-foreground">Hint: {s.hint}</p> : null}
          {s.answer ? <p className="mt-0.5 font-mono text-xs text-muted-foreground">Answer: {s.answer}</p> : null}
        </div>
      )
    } else if (slot.content_type === 'mistake') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          <div className="flex gap-1.5 text-muted-foreground"><span>✗</span><span className="font-mono">{s.wrong}</span></div>
          <div className="flex gap-1.5"><span className="text-primary">✓</span><span className="font-mono">{s.correct}</span></div>
          {s.why ? <p className="mt-1 text-xs text-muted-foreground">{s.why}</p> : null}
        </div>
      )
    } else if (slot.content_type === 'term') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold text-primary">{s.term}</span>
          {s.definition ? <p className="mt-0.5 text-xs text-muted-foreground">{s.definition}</p> : null}
          {s.example ? <p className="mt-0.5 text-xs text-muted-foreground">e.g. {s.example}</p> : null}
        </div>
      )
    } else if (slot.content_type === 'myth_fact') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          <div className="text-muted-foreground line-through">{s.myth}</div>
          <div className="font-semibold text-primary">{s.fact}</div>
        </div>
      )
    } else if (slot.content_type === 'spectrum') {
      summary = (
        <div className="text-sm text-foreground">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{s.axis?.left_label}</span>
            <span className="flex-1 border-t border-border" />
            <span>{s.axis?.right_label}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {(s.spectrum_items || []).map((it: any, i: number) => (
              <span key={i} className={`rounded bg-card px-1.5 py-0.5 ${i === s.highlight_index ? 'font-semibold text-primary' : ''}`}>
                {it?.label}
              </span>
            ))}
          </div>
        </div>
      )
    } else if (slot.content_type === 'pictogram') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold text-primary">{s.filled}{s.unit === '%' ? '%' : ` in ${s.of}`}</span>
          <span className="ml-1.5 text-muted-foreground">{s.label}</span>
        </div>
      )
    } else if (slot.content_type === 'venn') {
      summary = (
        <div className="text-sm text-foreground">
          <span className="font-semibold text-primary">{s.left?.label}</span>
          <span className="mx-1.5 text-ink3">∩</span>
          <span className="font-semibold text-primary">{s.right?.label}</span>
          {s.overlap?.label ? <p className="mt-1 text-xs text-muted-foreground">Overlap: {s.overlap.label}</p> : null}
        </div>
      )
    } else if (slot.content_type === 'receipt') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          {(s.lines || []).map((l: any, i: number) => (
            <div key={i} className="flex justify-between gap-2">
              <span>{l?.label}</span>
              <span className="font-mono text-primary">{l?.value}</span>
            </div>
          ))}
          {s.total ? (
            <div className="flex justify-between gap-2 border-t border-border pt-0.5 font-semibold">
              <span>{s.total.label || 'Total'}</span>
              <span className="font-mono text-primary">{s.total.value ?? s.total}</span>
            </div>
          ) : null}
        </div>
      )
    } else if (slot.content_type === 'evidence') {
      summary = (
        <div className="space-y-1 text-sm text-foreground">
          <p className="font-medium">{s.finding}</p>
          <p className="text-xs text-muted-foreground">
            — {s.source}
            {s.year ? `, ${s.year}` : ''}
            {s.sample ? ` · ${s.sample}` : ''}
          </p>
        </div>
      )
    } else if (slot.content_type === 'scale') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          {(s.scale_items || []).map((it: any, i: number) => (
            <div key={i} className="flex justify-between gap-2">
              <span className={i === s.highlight_index ? 'font-semibold text-primary' : ''}>{it?.label}</span>
              <span className="font-mono text-primary">{it?.value}{s.unit ? ` ${s.unit}` : ''}</span>
            </div>
          ))}
          {s.to_scale === false ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Too wide a spread to draw — the ratios are stated instead.
            </p>
          ) : null}
        </div>
      )
    } else if (slot.content_type === 'proportion') {
      summary = (
        <div className="space-y-0.5 text-sm text-foreground">
          {s.source_label ? <div className="text-xs text-muted-foreground">{s.source_label}</div> : null}
          {(s.slices || []).map((sl: any, i: number) => (
            <div key={i} className="flex justify-between gap-2">
              <span className={i === s.highlight_index ? 'font-semibold text-primary' : ''}>{sl?.label}</span>
              {/* The share is the validator's, not a number computed here — the
                  review UI must show exactly what the card will draw. */}
              <span className="font-mono text-primary">
                {typeof sl?.share === 'number' ? `${Math.round(sl.share * 100)}%` : sl?.value}
              </span>
            </div>
          ))}
        </div>
      )
    } else if (slot.content_type === 'hierarchy') {
      summary = (
        <div className="space-y-1 text-sm text-foreground">
          <div className="font-semibold text-primary">{s.root}</div>
          <div className="space-y-0.5 pl-3">
            {(s.children || []).map((c: any, i: number) => (
              <div key={i}>
                <span className={i === s.highlight_index ? 'font-semibold text-primary' : ''}>{c?.label}</span>
                {Array.isArray(c?.children) && c.children.length ? (
                  <span className="text-xs text-muted-foreground">
                    {' — '}
                    {c.children.map((g: any) => g?.label).filter(Boolean).join(', ')}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )
    } else if (Array.isArray(s.items) && s.items.length) {
      // icons / steps / layers / decision / cycle / ranking-shaped contents:
      // chips of labels.
      summary = (
        <div className="flex flex-wrap gap-1.5 text-xs text-foreground">
          {s.items.map((it: any, i: number) => (
            <span key={i} className="rounded bg-card px-1.5 py-0.5">
              {typeof it === 'string' ? it : it.label || it.text || it.icon}
            </span>
          ))}
        </div>
      )
    } else {
      // Unknown/new content type: show whatever scalar fields it carries. A
      // card the loop adds tomorrow reads as text here instead of silently
      // becoming an upload box again.
      summary = (
        <div className="space-y-0.5 text-xs text-foreground">
          {Object.entries(s)
            .filter(([k, v]) =>
              !['content_type', 'heading', 'caption', 'reveal', 'camera_move', 'dock', 'label'].includes(k) &&
              (typeof v === 'string' || typeof v === 'number') && String(v) !== '')
            .map(([k, v]) => (
              <div key={k} className="flex gap-1.5">
                <span className="text-ink3">{k.replace(/_/g, ' ')}:</span>
                <span>{String(v)}</span>
              </div>
            ))}
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-border bg-inset p-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink3">
          {slotKey}
          <span className="ml-1.5 normal-case text-ink3/70">{slot.content_type.replace(/_/g, ' ')}</span>
        </div>
        {(slot as Record<string, any>).heading ? (
          <div className="mb-1 font-semibold text-primary">{(slot as Record<string, any>).heading}</div>
        ) : null}
        {summary}
      </div>
    )
  }

  // image / video slot
  return (
    <div className="rounded-xl border border-border bg-inset p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink3">
          {slotKey} {slot.label ? `· ${slot.label}` : ''}
          {slot.frame ? (
            <span className="ml-1 rounded bg-inset px-1.5 py-0.5 text-[10px] text-ink3">{slot.frame}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Move className="h-3 w-3" />
          <select
            value={slot.camera_move || ''}
            onChange={(e) => updateCameraMove(e.target.value)}
            className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground outline-none focus:border-primary"
            title="Camera movement"
          >
            {cameraMoves.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {slot.asset?.url ? (
        <div className="relative overflow-hidden rounded-lg">
          {slot.asset.type === 'video' ? (
            <video src={slot.asset.url} className="h-32 w-full object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slot.asset.url} alt="" className="h-32 w-full object-cover" />
          )}
          {/* Where the picture came from. Without it an AI fill and a file the
              user uploaded look identical, and the whole point of showing the
              generated image is that they can tell it apart and redo it. */}
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {source === 'ai' ? <><Sparkles className="h-3 w-3" /> AI</>
              : source === 'stock' ? <><Film className="h-3 w-3" /> stock</>
                : source === 'library' ? <><Library className="h-3 w-3" /> free</>
                  : <><Upload className="h-3 w-3" /> yours</>}
          </span>
          <button
            onClick={remove}
            disabled={removing || busy}
            title="Remove this media"
            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
          {generating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 text-xs font-semibold text-white">
              <Loader2 className="h-5 w-5 animate-spin" /> Drawing…
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-center">
          {generating ? (
            <><Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs font-semibold text-primary">Drawing…</span></>
          ) : (
            <>
              <span className="line-clamp-2 text-[11px] text-ink3">
                {slot.asset_request?.description || 'No picture yet'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {canGenerate && (
                  <button
                    onClick={openPanel}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" /> Generate with AI
                  </button>
                )}
                {canBrowse && (
                  <button
                    onClick={() => { setPanelOpen(false); setLibraryOpen((open) => !open) }}
                    disabled={busy}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                      libraryOpen ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-inset'
                    }`}
                  >
                    <Library className="h-3 w-3" /> Free media
                  </button>
                )}
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading || busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-inset disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ''
        }}
      />

      {/* Actions for a slot that already HAS media. Redrawing is offered on
          every image slot, whatever is in it now — an upload can be replaced
          by a generated picture just as easily as the other way round. */}
      {slot.asset?.url && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {canGenerate && (
            <button
              onClick={() => (panelOpen ? setPanelOpen(false) : openPanel())}
              disabled={busy}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                panelOpen ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-inset'
              }`}
            >
              <Sparkles className="h-3 w-3" /> {source === 'ai' ? 'Redraw with AI' : 'Replace with AI'}
            </button>
          )}
          {canBrowse && (
            <button
              onClick={() => { setPanelOpen(false); setLibraryOpen((open) => !open) }}
              disabled={busy}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                libraryOpen ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-inset'
              }`}
            >
              <Library className="h-3 w-3" /> Free media
            </button>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || busy}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-inset disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload instead
          </button>
        </div>
      )}

      {panelOpen && canGenerate && (
        <div className="mt-2 rounded-lg border border-primary bg-card p-2.5">
          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            What the picture shows
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={400}
            placeholder="a busy video rental counter in 1998"
            className="mb-2 w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-ink3 focus:border-primary"
          />
          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            Extra direction <span className="font-normal text-ink3">(optional — kept for future renders)</span>
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="seen from above, at night, no people in frame"
            className="w-full resize-y rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-ink3 focus:border-primary"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-ink3">
              Drawn flat, in this video&apos;s palette, with no text — the house style.
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-inset"
              >
                Cancel
              </button>
              <button
                onClick={generate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {slot.asset?.url ? 'Draw again' : 'Draw it'}
              </button>
            </div>
          </div>
          {genError && <p className="mt-1.5 text-[11px] text-warn">{genError}</p>}
        </div>
      )}

      {libraryOpen && canBrowse && (
        <MediaLibraryPanel
          projectId={projectId}
          sceneId={sceneId}
          slotKey={slotKey}
          slot={slot}
          providers={mediaLibrary?.providers ?? []}
          onClose={() => setLibraryOpen(false)}
          onChange={onChange}
        />
      )}

      {/* The brief, in plain words: what shot works here and what to avoid.
          It is the answer to "what am I supposed to put in this box?", which
          the description alone — written as an image PROMPT — never gave. */}
      {!libraryOpen && !panelOpen && slot.asset_request?.guidance && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Eye className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <span>{slot.asset_request.guidance}</span>
        </p>
      )}

      {/* Attribution for a library picture. Most of these licences require it
          and all of them deserve it. */}
      {slot.asset?.source === 'library' && slot.media_credit && (
        <p className="mt-1.5 text-[10px] text-ink3">
          {slot.media_credit.author ? `${slot.media_credit.author} · ` : ''}
          {slot.media_credit.source_url ? (
            <a href={slot.media_credit.source_url} target="_blank" rel="noreferrer" className="underline hover:text-primary">
              {slot.media_credit.provider_label}
            </a>
          ) : slot.media_credit.provider_label}
          {slot.media_credit.license ? ` · ${slot.media_credit.license}` : ''}
        </p>
      )}

      {!panelOpen && slot.asset_request?.instruction && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Wand2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          Your direction: “{slot.asset_request.instruction}”
        </p>
      )}

      {!slot.asset?.url && slot.stock_query && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-primary">
          <Film className="mt-0.5 h-3 w-3 shrink-0" />
          Stock b-roll “{slot.stock_query}” is fetched automatically at render — upload only to override it.
        </p>
      )}
      {!slot.asset?.url && !slot.stock_query && autoVisuals && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-primary">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
          AI draws this at render anyway — generate now if you want to see it and shape it first.
        </p>
      )}
    </div>
  )
}
