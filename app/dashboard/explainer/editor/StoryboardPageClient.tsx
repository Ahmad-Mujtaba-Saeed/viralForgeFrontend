'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { useBilling } from '@/hooks/useBilling'
import { useProjectProgress } from '@/hooks/usePusher'
import { ProcessingStartedDialog } from '@/components/create/processing-started-dialog'
import {
  AlertTriangle, Check, CornerDownRight, Film, Loader2, X,
} from 'lucide-react'
import { EditorHeader } from './EditorHeader'
import { QuickToggles } from './QuickToggles'
import { StageDeck } from './StageDeck'
import { SceneFilmstrip } from './SceneFilmstrip'
import { SceneInspector } from './SceneInspector'
import { SettingsSections, type SettingsHandlers } from './SettingsSections'
import { RevisePanel } from './RevisePanel'
import type { Storyboard } from './types'

/**
 * The explainer storyboard editor.
 *
 * Three zones, one selection. The stage plays the REAL composition (there is
 * no frozen still any more — @remotion/player runs the same `ExplainerVideo`
 * the MP4 is rendered from); the filmstrip is the whole video at a glance; the
 * inspector edits whichever beat the other two are pointing at. Project-wide
 * settings fold into the inspector under the scene, so a colour change and its
 * effect are on screen together.
 */
export function StoryboardPageClient() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { credits, hasSubscription, costFor, fetchBilling } = useBilling()
  const [board, setBoard] = useState<Storyboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [switchingMode, setSwitchingMode] = useState<string | null>(null)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const projectProgress = useProjectProgress(id ?? null)

  // Generic in-flight tracker so every settings button gets the same
  // "yes, your click registered" feedback (spinner + disabled) without a
  // separate useState per action. Keys are free-form; segmented controls use
  // "group:value" (e.g. "skin:outline") so a specific option can show its own
  // spinner while `groupPending` disables its siblings during the request.
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const withPending = useCallback(async (key: string, fn: () => Promise<void>) => {
    setPending((p) => ({ ...p, [key]: true }))
    try {
      await fn()
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[key]
        return next
      })
    }
  }, [])
  const isPending = useCallback((key: string) => Boolean(pending[key]), [pending])
  const groupPending = useCallback(
    (prefix: string) => Object.keys(pending).some((k) => k.startsWith(`${prefix}:`) && pending[k]),
    [pending]
  )
  /** Which option of a group is mid-flight, for the pickers' spinner. */
  const pendingKeyIn = useCallback(
    (prefix: string) => {
      const hit = Object.keys(pending).find((k) => k.startsWith(`${prefix}:`) && pending[k])
      return hit ? hit.slice(prefix.length + 1) : null
    },
    [pending]
  )

  const baseCost = costFor('ai_explainer_video')
  // The §10.6 aspect-variant bundle multiplies the render charge.
  const explainerCost = board?.aspect_variants
    ? Math.ceil(baseCost * (board.aspect_variants_multiplier ?? 2.5))
    : baseCost
  const canAffordRender = hasSubscription && credits >= explainerCost

  useEffect(() => {
    fetchBilling().catch(() => {})
  }, [fetchBilling])

  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get(`/api/explainer/projects/${id}/storyboard`)
      setBoard(res.data.data)
    } catch {
      // ignore transient errors during polling
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  // Realtime instead of polling: the backend broadcasts on the same
  // project.{id} Pusher channel during both analysis and rendering. Any one
  // of these event types can fire depending on which phase is running — the
  // analysis-failure path in particular only emits `project.progress` (not
  // project.error/status) — so every event just re-fetches the full board
  // rather than trying to merge partial payloads client-side.
  useEffect(() => {
    const cleanups = [
      projectProgress.onProgress(() => fetchBoard()),
      projectProgress.onStatus(() => fetchBoard()),
      projectProgress.onCompletion(() => fetchBoard()),
      projectProgress.onError(() => fetchBoard()),
    ]
    return () => cleanups.forEach((cleanup) => cleanup?.())
  }, [projectProgress, fetchBoard])

  // Park on the first scene once the board arrives, and never point at a
  // scene an AI revision has since deleted.
  useEffect(() => {
    if (!board?.scenes.length) return
    setActiveSceneId((current) =>
      current && board.scenes.some((s) => s.scene_id === current) ? current : board.scenes[0].scene_id
    )
  }, [board?.scenes])

  const handleRender = async () => {
    // Credit gate (server enforces this too).
    if (!canAffordRender) {
      router.push('/dashboard/billing')
      return
    }
    setRendering(true)
    try {
      await api.post(`/api/explainer/projects/${id}/render`)
      await fetchBoard()
      fetchBilling().catch(() => {})
      setShowProcessingModal(true)
    } catch (err: any) {
      if (err.response?.status === 402) {
        router.push('/dashboard/billing')
        return
      }
      alert(err.response?.data?.message || 'Failed to start render')
    } finally {
      setRendering(false)
    }
  }

  // ---- AI revision: "here is what is wrong with this storyboard" ----------
  // The note goes to a planner that names the scenes it is about, and only
  // those cards are rebuilt. `targets` is the optional scoping the scene
  // cards offer, so "make this shorter" has a subject.
  const [reviseOpen, setReviseOpen] = useState(false)
  const [reviseText, setReviseText] = useState('')
  const [reviseTargets, setReviseTargets] = useState<string[]>([])
  const [reviseError, setReviseError] = useState<string | null>(null)
  const [reviseSending, setReviseSending] = useState(false)
  const [resultDismissed, setResultDismissed] = useState(false)
  const reviseRef = useRef<HTMLTextAreaElement | null>(null)
  const revising = Boolean(board?.revision?.running)

  const openRevise = useCallback(() => {
    setReviseOpen(true)
    setTimeout(() => reviseRef.current?.focus(), 50)
  }, [])

  const askAiAbout = useCallback(
    (sceneId: string) => {
      setReviseTargets((prev) => (prev.includes(sceneId) ? prev.filter((s) => s !== sceneId) : [...prev, sceneId]))
      openRevise()
    },
    [openRevise]
  )

  // There is no create-scene endpoint, and inventing one client-side would be
  // a lie: a new beat has to be written, paced and slotted by the planner. So
  // "Add scene" is a pre-addressed request to the thing that can actually do
  // it, seeded with where the user clicked.
  const addSceneViaAi = useCallback(() => {
    const order = board?.scenes.find((s) => s.scene_id === activeSceneId)?.order ?? board?.scenes.length ?? 1
    setReviseTargets([])
    setReviseText((text) => text || `Add a new scene after scene ${order} that `)
    openRevise()
  }, [board?.scenes, activeSceneId, openRevise])

  const handleRevise = async () => {
    const note = reviseText.trim()
    if (note.length < 3 || revising) return
    setReviseSending(true)
    setReviseError(null)
    try {
      await api.post(`/api/explainer/projects/${id}/revise`, {
        request: note,
        scene_ids: reviseTargets,
      })
      setReviseText('')
      setReviseTargets([])
      setResultDismissed(false)
      setReviseOpen(false)
      await fetchBoard()
    } catch (err: any) {
      setReviseError(err?.response?.data?.message || 'Could not start the revision.')
    } finally {
      setReviseSending(false)
    }
  }

  // Pusher drives the refresh while the job runs, but a revision is short and
  // the storyboard must never look stuck if the socket is unavailable.
  useEffect(() => {
    if (!revising) return
    const timer = setInterval(() => { fetchBoard() }, 4000)
    return () => clearInterval(timer)
  }, [revising, fetchBoard])

  const handleReanalyze = async () => {
    if (!confirm('Re-run analysis? This rebuilds the storyboard — uploads whose scene survives are kept, the rest are removed.')) return
    await withPending('reanalyze', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/reanalyze`)
        await fetchBoard()
      } catch {
        alert('Failed to re-analyze')
      }
    })
  }

  /** Every settings write is the same shape: post, refetch, complain once. */
  const post = useCallback(
    (key: string, path: string, body: unknown, failure: string) =>
      withPending(key, async () => {
        try {
          await api.post(`/api/explainer/projects/${id}/${path}`, body)
          await fetchBoard()
        } catch {
          alert(failure)
        }
      }),
    [withPending, id, fetchBoard]
  )

  const handleCompositionMode = useCallback(
    async (mode: string) => {
      if (mode === board?.composition_mode || switchingMode) return
      setSwitchingMode(mode)
      try {
        // Hybrid may take a while on first switch: the AI plans the chapters.
        await api.post(`/api/explainer/projects/${id}/composition-mode`, { mode })
        await fetchBoard()
      } catch {
        alert('Failed to switch composition style')
      } finally {
        setSwitchingMode(null)
      }
    },
    [board?.composition_mode, switchingMode, id, fetchBoard]
  )

  const handlers: SettingsHandlers = useMemo(
    () => ({
      onShuffleTheme: () => void post('shuffle-theme', 'shuffle-theme', {}, 'Failed to shuffle theme'),
      onFontPack: (pack) => void post(`font-pack:${pack}`, 'font-pack', { pack }, 'Failed to switch typography'),
      onSkin: (skin) => void post(`skin:${skin}`, 'skin', { skin }, 'Failed to switch skin'),
      onCompositionMode: handleCompositionMode,
      onBoardStyle: (style) => {
        if (style === (board?.board_style ?? 'auto')) return
        void post(`board-style:${style}`, 'board-style', { board_style: style }, 'Failed to switch board style')
      },
      onMotionStyle: (style) =>
        void post(`motion-style:${style}`, 'motion-style', { style }, 'Failed to switch motion style'),
      onRenderFps: (fps) => {
        if (fps === (board?.render_fps ?? 30)) return
        void post(`render-fps:${fps}`, 'smooth-motion', { render_fps: fps }, 'Failed to change the frame rate')
      },
      onToggleMotionBlur: () =>
        void post('motion-blur', 'smooth-motion', { motion_blur: !(board?.motion_blur ?? true) }, 'Failed to toggle motion blur'),
      onToggleBackdrop: () =>
        void post('backdrop', 'backdrop', { enabled: !(board?.backdrop_enabled ?? true) }, 'Failed to toggle the backdrop field'),
      onToggleNarration: () =>
        void post('narration', 'narration', { enabled: !(board?.narration_enabled ?? true) }, 'Failed to toggle voiceover'),
      onToggleMusic: () =>
        void post('music', 'music', { enabled: !(board?.music_enabled ?? true) }, 'Failed to toggle background music'),
      onToggleCaptions: () =>
        void post(
          'captions',
          'captions',
          { enabled: !(board?.captions_enabled ?? board?.aspect_ratio === '9:16') },
          'Failed to toggle captions'
        ),
      onToggleAutoVisuals: () =>
        void post('auto-visuals', 'auto-visuals', { enabled: !board?.auto_visuals }, 'Failed to toggle AI visuals'),
      onToggleChapterChip: () =>
        void post('chapter-chip', 'chapter-chip', { enabled: !(board?.chapter_chip ?? false) }, 'Failed to toggle chapter chip'),
      onToggleAccentShift: () =>
        void post('accent-shift', 'accent-shift', { enabled: !(board?.accent_shift ?? false) }, 'Failed to toggle accent shift'),
      onToggleAspectVariants: () =>
        void post(
          'aspect-variants',
          'aspect-variants',
          { enabled: !(board?.aspect_variants ?? false) },
          'Failed to toggle aspect variants'
        ),
      onBrandLogo: (file, removeLogo = false) => {
        const fd = new FormData()
        if (file) fd.append('logo', file)
        if (removeLogo) fd.append('remove_logo', '1')
        void post('brand-logo', 'brand', fd, 'Failed to update brand logo')
      },
      onBrandColor: (color) => void post('brand-color', 'brand', { color }, 'Failed to update brand color'),
    }),
    [post, board, handleCompositionMode]
  )

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading storyboard…
      </div>
    )
  }

  // `id` comes from the query string, so it is nullable until here; every
  // panel below takes it as a plain string.
  if (!board || !id) {
    return <div className="p-10 text-center text-muted-foreground">Project not found.</div>
  }

  const activeScene = board.scenes.find((s) => s.scene_id === activeSceneId) ?? board.scenes[0] ?? null
  const activeIndex = activeScene ? board.scenes.findIndex((s) => s.scene_id === activeScene.scene_id) : -1
  const analyzing = board.status === 'analyzing'
  const lastRevision = board.revision?.running ? null : board.revision?.last ?? null

  const settingsPanel = (
    <div className="flex flex-col gap-2.5 text-[13px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Frame rate</span>
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {(board.render_fps_options ?? [30]).map((fps) => (
            <button
              key={fps}
              onClick={() => handlers.onRenderFps(fps)}
              disabled={groupPending('render-fps')}
              className={`px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                (board.render_fps ?? 30) === fps
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-inset'
              }`}
            >
              {isPending(`render-fps:${fps}`) ? <Loader2 className="mx-1.5 h-3.5 w-3.5 animate-spin" /> : `${fps}`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Aspect ratio</span>
        <span
          className="rounded-lg border border-border bg-inset px-2.5 py-1 text-xs font-semibold text-foreground"
          title="Set when the project was created"
        >
          {board.aspect_ratio}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Motion blur</span>
        <button
          onClick={handlers.onToggleMotionBlur}
          disabled={isPending('motion-blur')}
          className={`relative inline-block h-[22px] w-[38px] rounded-full transition-colors disabled:opacity-60 ${
            (board.motion_blur ?? true) ? 'bg-primary' : 'bg-border'
          }`}
          aria-pressed={board.motion_blur ?? true}
        >
          <span
            className={`absolute top-[3px] h-4 w-4 rounded-full bg-card transition-all ${
              (board.motion_blur ?? true) ? 'left-[19px]' : 'left-[3px]'
            }`}
          />
        </button>
      </div>
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground" title={`${board.aspect_variants_multiplier ?? 2.5}× credits`}>
          Also render 9:16 &amp; 1:1
        </span>
        <button
          onClick={handlers.onToggleAspectVariants}
          disabled={isPending('aspect-variants')}
          className={`relative inline-block h-[22px] w-[38px] rounded-full transition-colors disabled:opacity-60 ${
            board.aspect_variants ? 'bg-primary' : 'bg-border'
          }`}
          aria-pressed={Boolean(board.aspect_variants)}
        >
          <span
            className={`absolute top-[3px] h-4 w-4 rounded-full bg-card transition-all ${
              board.aspect_variants ? 'left-[19px]' : 'left-[3px]'
            }`}
          />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        This render costs {explainerCost} credit{explainerCost === 1 ? '' : 's'}.
      </p>
    </div>
  )

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-3.5 xl:h-[calc(100vh-8rem)]">
      <EditorHeader
        board={board}
        credits={credits}
        cost={explainerCost}
        rendering={rendering}
        canRender={(board.ready_to_render || !canAffordRender) && !rendering && !revising && board.status !== 'processing'}
        canAfford={canAffordRender}
        hasSubscription={hasSubscription}
        onRender={handleRender}
      />

      {board.status === 'failed' && board.error_message && (
        <div className="flex flex-none items-start gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{board.error_message}</span>
        </div>
      )}

      {board.status === 'processing' && (
        <div className="h-1.5 w-full flex-none overflow-hidden rounded-full bg-inset">
          <div className="h-full bg-primary transition-all" style={{ width: `${board.progress}%` }} />
        </div>
      )}

      {analyzing ? (
        <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground">
          <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary" />
          Breaking your script into scenes…
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="flex min-h-0 min-w-0 flex-col gap-3">
            <QuickToggles
              board={board}
              isPending={isPending}
              settingsOpen={settingsOpen}
              onToggleSettings={() => setSettingsOpen((o) => !o)}
              onToggleNarration={handlers.onToggleNarration}
              onToggleMusic={handlers.onToggleMusic}
              onToggleCaptions={handlers.onToggleCaptions}
              onToggleBackdrop={handlers.onToggleBackdrop}
              onToggleMotionBlur={handlers.onToggleMotionBlur}
              onToggleAutoVisuals={handlers.onToggleAutoVisuals}
              onReanalyze={handleReanalyze}
              onAskAi={openRevise}
              revising={revising}
            />

            {revising && (
              <div className="flex flex-none items-center gap-2 rounded-xl border border-accent-line bg-accent-soft px-3.5 py-2 text-[13px] text-primary">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span className="min-w-0 truncate">
                  Applying “{board.revision?.request}” — only the cards it names are rebuilt.
                </span>
              </div>
            )}

            {!revising && lastRevision && !resultDismissed && (
              <button
                onClick={openRevise}
                className="flex flex-none items-start gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-inset"
              >
                {lastRevision.state === 'error' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground">
                    {lastRevision.state === 'error' ? 'The last revision did not go through' : 'Last revision'}
                  </span>
                  {lastRevision.reply || lastRevision.message || lastRevision.summary ? (
                    <span className="ml-1.5 inline-flex min-w-0 items-start gap-1 text-muted-foreground">
                      <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0 text-ink3" />
                      <span className="line-clamp-2">
                        {lastRevision.reply || lastRevision.message || lastRevision.summary}
                      </span>
                    </span>
                  ) : null}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setResultDismissed(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      setResultDismissed(true)
                    }
                  }}
                  className="mt-0.5 shrink-0 text-ink3 hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              </button>
            )}

            <StageDeck
              board={board}
              projectId={id}
              activeSceneId={activeScene?.scene_id ?? null}
              onSelectScene={setActiveSceneId}
              settingsOpen={settingsOpen}
              onToggleSettings={() => setSettingsOpen((o) => !o)}
              settingsPanel={settingsPanel}
            />

            <SceneFilmstrip
              board={board}
              activeSceneId={activeScene?.scene_id ?? null}
              onSelect={setActiveSceneId}
              onAddScene={addSceneViaAi}
              disabled={revising}
            />
          </section>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeScene && activeIndex >= 0 && (
                <SceneInspector
                  board={board}
                  projectId={id}
                  scene={activeScene}
                  index={activeIndex}
                  onChange={fetchBoard}
                  onAskAi={askAiAbout}
                  targeted={reviseTargets.includes(activeScene.scene_id)}
                  revising={revising}
                />
              )}
              <SettingsSections
                board={board}
                projectId={id}
                onChange={fetchBoard}
                handlers={handlers}
                pendings={{ isPending, groupPending, pendingKeyIn, switchingMode }}
              />
            </div>

            <div className="flex flex-none flex-col gap-2.5 border-t border-border p-4">
              {!board.ready_to_render && board.missing_slots.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-warn/40 bg-warn-soft px-2.5 py-2 text-[12px] leading-snug text-warn">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {board.missing_slots.length} image slot{board.missing_slots.length === 1 ? '' : 's'} still need
                    {board.missing_slots.length === 1 ? 's' : ''} a picture.{' '}
                    {board.auto_visuals
                      ? 'AI visuals is on, so the render fills them — or add your own.'
                      : 'Turn on AI visuals to have them drawn for you.'}
                  </span>
                </div>
              )}
              {!canAffordRender && (
                <p className="text-[12px] font-semibold text-warn">
                  {hasSubscription
                    ? `Needs ${explainerCost} credits — you have ${credits}.`
                    : 'Subscribe to render this video.'}
                </p>
              )}
              <button
                onClick={handleRender}
                disabled={(!board.ready_to_render && canAffordRender) || rendering || revising || board.status === 'processing'}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {board.status === 'processing' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Rendering {board.progress}%</>
                ) : rendering ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Starting render…</>
                ) : !canAffordRender ? (
                  <><Film className="h-4 w-4" /> {hasSubscription ? 'Get credits' : 'View plans'}</>
                ) : (
                  <><Film className="h-4 w-4" /> Approve &amp; render · {explainerCost} credits</>
                )}
              </button>
              <span className="text-center text-[11px] text-ink3">
                MP4 · SRT captions · YouTube kit included
              </span>
            </div>
          </aside>
        </div>
      )}

      {/* The AI edit surface. A deliberate mode: it owns the screen while you
          write the note, then hands it straight back. */}
      {reviseOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
          <div
            className="absolute inset-0"
            onClick={() => setReviseOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setReviseOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>
            <RevisePanel
              board={board}
              open
              onOpen={(next) => { if (!next) setReviseOpen(false) }}
              text={reviseText}
              onText={setReviseText}
              targets={reviseTargets}
              onClearTarget={(sceneId) => setReviseTargets((prev) => prev.filter((s) => s !== sceneId))}
              onSubmit={handleRevise}
              sending={reviseSending}
              error={reviseError}
              textareaRef={reviseRef}
            />
          </div>
        </div>
      )}

      <ProcessingStartedDialog
        open={showProcessingModal}
        onOpenChange={setShowProcessingModal}
        templateName={board.title}
        creditsCharged={explainerCost}
      />
    </div>
  )
}
