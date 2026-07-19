'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { useBilling } from '@/hooks/useBilling'
import { useProjectProgress } from '@/hooks/usePusher'
import { ProcessingStartedDialog } from '@/components/create/processing-started-dialog'
import {
  Loader2, Upload, X, Film, RefreshCw, Play, AlertTriangle,
  Image as ImageIcon, LayoutGrid, Columns2, Square, Shuffle, Move,
  Rows2, PanelRight, PanelTop, MessageSquare, Volume2, VolumeX, Music, Music2,
  Captions, CaptionsOff, Type,
  Swords, BarChart3, Sigma, ListChecks, Grid3x3, BookMarked,
  History, Workflow, ArrowLeftRight, Trophy, Gauge, Quote,
  Smartphone, Images, MapPin, Newspaper,
  Calculator, Triangle, TrendingUp, Sparkles, Route,
} from 'lucide-react'

interface Slot {
  content_type: string
  label?: string
  camera_move?: string
  asset_request?: { description?: string }
  asset?: { url: string; type: string; name?: string } | null
  heading?: string
  bullets?: string[]
  body?: string
  dock?: string
  width_pct?: number
  frame?: string
  stock_query?: string
}
interface Scene {
  scene_id: string
  order: number
  duration_seconds: number
  narration: string
  layout_template: string
  transition: string
  slots: Record<string, Slot>
}
interface Theme {
  name: string
  label: string
  bg_from: string
  bg_to: string
  accent: string
  accent2: string
  text: string
  muted: string
}
interface Storyboard {
  id: number
  title: string
  status: string
  progress: number
  aspect_ratio: string
  error_message?: string | null
  output_url?: string | null
  scenes: Scene[]
  missing_slots: { scene_id: string; slot_key: string }[]
  ready_to_render: boolean
  templates: Record<string, { label: string; slots: Record<string, unknown> }>
  color_scheme?: string | null
  theme?: Theme
  camera_moves?: string[]
  transitions?: string[]
  color_schemes?: Theme[]
  narration_enabled?: boolean
  auto_visuals?: boolean
  auto_visuals_auto?: boolean
  music_enabled?: boolean
  captions_enabled?: boolean
  font_pack?: string
  font_packs?: Record<string, { label: string; display: string; body: string; mono: string; use_when: string }>
  motion_style?: string
  motion_style_auto?: string | null
  motion_styles?: Record<string, { label: string; use_when: string }>
  skin?: string
  skin_auto?: string | null
  skins?: Record<string, { label: string; use_when: string }>
  composition_mode?: string
  composition_modes?: string[]
  chapter_plan?: { chapters?: { id?: string; mode?: string; scene_ids?: string[] }[] } | null
  lint_report?: LintReportData | null
  chapter_chip?: boolean
  aspect_variants?: boolean
  aspect_variants_multiplier?: number
  brand?: { logo_url?: string | null; color?: string | null; color_applied?: boolean }
  srt_url?: string | null
  thumbnail_url?: string | null
  output_videos?: { aspect: string; label: string; url: string | null }[]
}

interface LintItem {
  severity: 'error' | 'warn' | 'info'
  code: string
  scene_id?: string | null
  message: string
}
interface LintReportData {
  items: LintItem[]
  counts: { error: number; warn: number; info: number }
  checked_at?: string
}

const COMPOSITION_LABELS: Record<string, string> = {
  hybrid: 'Hybrid (AI Auto)',
  canvas_journey: 'Canvas Journey',
  slides: 'Slides',
  math_board: 'Math Board',
}

const TEMPLATE_ICON: Record<string, React.ReactNode> = {
  single_focus: <Square className="h-4 w-4" />,
  split_side_by_side: <Columns2 className="h-4 w-4" />,
  split_top_bottom: <Rows2 className="h-4 w-4" />,
  full_bleed_with_side_panel: <PanelRight className="h-4 w-4" />,
  full_bleed_with_banner: <PanelTop className="h-4 w-4" />,
  versus_card: <Swords className="h-4 w-4" />,
  animated_chart: <BarChart3 className="h-4 w-4" />,
  big_counter: <Sigma className="h-4 w-4" />,
  checklist_card: <ListChecks className="h-4 w-4" />,
  icon_grid: <Grid3x3 className="h-4 w-4" />,
  chapter_cover: <BookMarked className="h-4 w-4" />,
  timeline_card: <History className="h-4 w-4" />,
  step_flow: <Workflow className="h-4 w-4" />,
  before_after: <ArrowLeftRight className="h-4 w-4" />,
  list_ranking: <Trophy className="h-4 w-4" />,
  progress_meter: <Gauge className="h-4 w-4" />,
  quote_portrait: <Quote className="h-4 w-4" />,
  phone_mockup: <Smartphone className="h-4 w-4" />,
  photo_stack: <Images className="h-4 w-4" />,
  map_card: <MapPin className="h-4 w-4" />,
  headline_ticker: <Newspaper className="h-4 w-4" />,
  math_steps: <Calculator className="h-4 w-4" />,
  geometry_diagram: <Triangle className="h-4 w-4" />,
  function_plot: <TrendingUp className="h-4 w-4" />,
  scenario_diagram: <Route className="h-4 w-4" />,
}

const toggleBtn =
  'inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-inset'

export default function StoryboardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { credits, hasSubscription, costFor, fetchBilling } = useBilling()
  const [board, setBoard] = useState<Storyboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [switchingMode, setSwitchingMode] = useState<string | null>(null)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const projectProgress = useProjectProgress(id ?? null)

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

  const handleReanalyze = async () => {
    if (!confirm('Re-run analysis? This rebuilds the storyboard — uploads whose scene survives are kept, the rest are removed.')) return
    try {
      await api.post(`/api/explainer/projects/${id}/reanalyze`)
      await fetchBoard()
    } catch {
      alert('Failed to re-analyze')
    }
  }

  const handleShuffleTheme = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/shuffle-theme`)
      await fetchBoard()
    } catch {
      alert('Failed to shuffle theme')
    }
  }

  const handleToggleNarration = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/narration`, { enabled: !(board?.narration_enabled ?? true) })
      await fetchBoard()
    } catch {
      alert('Failed to toggle voiceover')
    }
  }

  const handleToggleMusic = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/music`, { enabled: !(board?.music_enabled ?? true) })
      await fetchBoard()
    } catch {
      alert('Failed to toggle background music')
    }
  }

  const autoVisualsOn = Boolean(board?.auto_visuals)

  const handleToggleAutoVisuals = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/auto-visuals`, { enabled: !autoVisualsOn })
      await fetchBoard()
    } catch {
      alert('Failed to toggle AI visuals')
    }
  }

  const captionsOn = board?.captions_enabled ?? board?.aspect_ratio === '9:16'

  const handleToggleCaptions = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/captions`, { enabled: !captionsOn })
      await fetchBoard()
    } catch {
      alert('Failed to toggle captions')
    }
  }

  const handleFontPack = async (pack: string) => {
    try {
      await api.post(`/api/explainer/projects/${id}/font-pack`, { pack })
      await fetchBoard()
    } catch {
      alert('Failed to switch typography')
    }
  }

  const handleMotionStyle = async (style: string) => {
    try {
      await api.post(`/api/explainer/projects/${id}/motion-style`, { style })
      await fetchBoard()
    } catch {
      alert('Failed to switch motion style')
    }
  }

  const handleSkin = async (skin: string) => {
    try {
      await api.post(`/api/explainer/projects/${id}/skin`, { skin })
      await fetchBoard()
    } catch {
      alert('Failed to switch skin')
    }
  }

  const handleToggleChapterChip = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/chapter-chip`, { enabled: !(board?.chapter_chip ?? false) })
      await fetchBoard()
    } catch {
      alert('Failed to toggle chapter chip')
    }
  }

  const handleToggleAspectVariants = async () => {
    try {
      await api.post(`/api/explainer/projects/${id}/aspect-variants`, { enabled: !(board?.aspect_variants ?? false) })
      await fetchBoard()
    } catch {
      alert('Failed to toggle aspect variants')
    }
  }

  const handleBrandLogo = async (file: File | null, removeLogo = false) => {
    const fd = new FormData()
    if (file) fd.append('logo', file)
    if (removeLogo) fd.append('remove_logo', '1')
    try {
      await api.post(`/api/explainer/projects/${id}/brand`, fd)
      await fetchBoard()
    } catch {
      alert('Failed to update brand logo')
    }
  }

  const handleBrandColor = async (color: string) => {
    try {
      await api.post(`/api/explainer/projects/${id}/brand`, { color })
      await fetchBoard()
    } catch {
      alert('Failed to update brand color')
    }
  }

  const handleCompositionMode = async (mode: string) => {
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
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading storyboard…
      </div>
    )
  }

  if (!board) {
    return <div className="p-10 text-center text-muted-foreground">Project not found.</div>
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">{board.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {board.scenes.length} scenes · {board.aspect_ratio} · status:{' '}
            <span className="font-semibold capitalize text-foreground">{board.status}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleToggleNarration} className={toggleBtn} title="AI voiceover">
            {(board.narration_enabled ?? true) ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-ink3" />}
            Voiceover {(board.narration_enabled ?? true) ? 'On' : 'Off'}
          </button>
          <button onClick={handleToggleMusic} className={toggleBtn} title="Curated background music (by scene mood)">
            {(board.music_enabled ?? true) ? <Music className="h-4 w-4 text-primary" /> : <Music2 className="h-4 w-4 text-ink3" />}
            Music {(board.music_enabled ?? true) ? 'On' : 'Off'}
          </button>
          <button onClick={handleToggleCaptions} className={toggleBtn} title="Karaoke word captions synced to the voiceover">
            {captionsOn ? <Captions className="h-4 w-4 text-primary" /> : <CaptionsOff className="h-4 w-4 text-ink3" />}
            Captions {captionsOn ? 'On' : 'Off'}
          </button>
          <button
            onClick={handleToggleAutoVisuals}
            className={toggleBtn}
            title="Unfilled image slots are AI-illustrated at render — nothing to upload. Uploads still override."
          >
            <Sparkles className={`h-4 w-4 ${autoVisualsOn ? 'text-primary' : 'text-ink3'}`} />
            AI visuals {autoVisualsOn ? 'On' : 'Off'}
          </button>
          <button onClick={handleReanalyze} className={toggleBtn}>
            <RefreshCw className="h-4 w-4" /> Re-analyze
          </button>
        </div>
      </header>

      {(board.composition_modes?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
          <div className="text-sm">
            <span className="text-muted-foreground">Composition: </span>
            <span className="font-semibold text-foreground">
              {COMPOSITION_LABELS[board.composition_mode ?? ''] ?? board.composition_mode}
            </span>
            {board.composition_mode === 'hybrid' && board.chapter_plan?.chapters?.length ? (
              <span className="ml-2 text-xs text-muted-foreground">
                {board.chapter_plan.chapters.length} chapters ·{' '}
                {board.chapter_plan.chapters.map((c) => c.mode).join(' → ')}
              </span>
            ) : null}
            {board.composition_mode === 'math_board' ? (
              <span className="ml-2 text-xs text-muted-foreground">
                solved on one continuous board with a write-along camera — picked automatically for worked math
              </span>
            ) : null}
          </div>
          {board.composition_mode === 'math_board' ? null : (
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(board.composition_modes ?? []).map((mode) => (
              <button
                key={mode}
                onClick={() => handleCompositionMode(mode)}
                disabled={switchingMode !== null}
                title={
                  mode === 'hybrid'
                    ? 'The AI mixes camera journeys and slide cuts to fit the script'
                    : mode === 'canvas_journey'
                      ? 'One continuous camera flight across every scene'
                      : 'Classic scene-by-scene transitions'
                }
                className={`px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  board.composition_mode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-inset'
                }`}
              >
                {switchingMode === mode ? (
                  <Loader2 className="mx-3 h-4 w-4 animate-spin" />
                ) : (
                  COMPOSITION_LABELS[mode] ?? mode
                )}
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      {board.theme && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[board.theme.bg_to, board.theme.accent, board.theme.accent2, board.theme.text].map((c, i) => (
                <span key={i} className="h-6 w-6 rounded-full border border-border" style={{ background: c }} />
              ))}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Color scheme: </span>
              <span className="font-semibold text-foreground">{board.theme.label}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {board.font_packs && Object.keys(board.font_packs).length > 0 && (
              <div className="inline-flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <div className="inline-flex overflow-hidden rounded-lg border border-border">
                  {['auto', ...Object.keys(board.font_packs)].map((pack) => (
                    <button
                      key={pack}
                      onClick={() => handleFontPack(pack)}
                      title={pack === 'auto' ? 'Let the system pick the typography' : board.font_packs?.[pack]?.use_when}
                      className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                        (board.font_pack ?? 'auto') === pack
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:bg-inset'
                      }`}
                    >
                      {pack === 'auto' ? 'Auto' : board.font_packs?.[pack]?.label ?? pack}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleShuffleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-inset"
            >
              <Shuffle className="h-4 w-4" /> Shuffle colors
            </button>
          </div>
        </div>
      )}

      {(board.motion_styles || board.skins) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
          {board.motion_styles && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Motion:
                {(board.motion_style ?? 'auto') === 'auto' && board.motion_style_auto ? (
                  <span className="ml-1 text-xs">({board.motion_styles[board.motion_style_auto]?.label ?? board.motion_style_auto})</span>
                ) : null}
              </span>
              <div className="inline-flex overflow-hidden rounded-lg border border-border">
                {['auto', ...Object.keys(board.motion_styles)].map((style) => (
                  <button
                    key={style}
                    onClick={() => handleMotionStyle(style)}
                    title={style === 'auto' ? 'Let the AI match the motion to the topic' : board.motion_styles?.[style]?.use_when}
                    className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                      (board.motion_style ?? 'auto') === style
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-inset'
                    }`}
                  >
                    {style === 'auto' ? 'Auto' : board.motion_styles?.[style]?.label ?? style}
                  </button>
                ))}
              </div>
            </div>
          )}
          {board.skins && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Skin:
                {(board.skin ?? 'auto') === 'auto' && board.skin_auto ? (
                  <span className="ml-1 text-xs">({board.skins[board.skin_auto]?.label ?? board.skin_auto})</span>
                ) : null}
              </span>
              <div className="inline-flex overflow-hidden rounded-lg border border-border">
                {['auto', ...Object.keys(board.skins)].map((skin) => (
                  <button
                    key={skin}
                    onClick={() => handleSkin(skin)}
                    title={skin === 'auto' ? 'Let the AI pick the surface treatment' : board.skins?.[skin]?.use_when}
                    className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                      (board.skin ?? 'auto') === skin
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-inset'
                    }`}
                  >
                    {skin === 'auto' ? 'Auto' : board.skins?.[skin]?.label ?? skin}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packaging (§10.3–10.7): brand kit, chapter chip, aspect variants. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
        <BrandControls board={board} onLogo={handleBrandLogo} onColor={handleBrandColor} />
        <div className="flex flex-wrap items-center gap-2">
          {board.composition_mode === 'hybrid' && (
            <button onClick={handleToggleChapterChip} className={toggleBtn} title="Show a 02 / 06 chapter counter in the corner">
              <BookMarked className={`h-4 w-4 ${board.chapter_chip ? 'text-primary' : 'text-ink3'}`} />
              Chapter chip {board.chapter_chip ? 'On' : 'Off'}
            </button>
          )}
          <button
            onClick={handleToggleAspectVariants}
            className={toggleBtn}
            title={`Render 16:9 + 9:16 + 1:1 in one go (${board.aspect_variants_multiplier ?? 2.5}× credits)`}
          >
            <Columns2 className={`h-4 w-4 ${board.aspect_variants ? 'text-primary' : 'text-ink3'}`} />
            All aspects {board.aspect_variants ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <StatusBanner board={board} />

      {board.status === 'completed' && board.output_url && (
        <FinalRender board={board} />
      )}

      {board.status !== 'analyzing' && <LintReport report={board.lint_report} />}

      {board.status === 'analyzing' ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground">
          <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary" />
          Breaking your script into scenes…
        </div>
      ) : (
        <div className="space-y-5">
          {board.scenes.map((scene) => (
            <SceneCard
              key={scene.scene_id}
              projectId={id}
              scene={scene}
              board={board}
              cameraMoves={board.camera_moves || []}
              onChange={fetchBoard}
            />
          ))}
        </div>
      )}

      {board.scenes.length > 0 && board.status !== 'analyzing' && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-soft-lg backdrop-blur">
          <div className="text-sm font-medium">
            {!canAffordRender ? (
              <span className="text-warn">
                {hasSubscription
                  ? `Needs ${explainerCost} credits — you have ${credits}.`
                  : 'Subscribe to render this video.'}
              </span>
            ) : board.ready_to_render ? (
              <span className="text-good">Ready to render — uses {explainerCost} credits.</span>
            ) : (
              <span className="text-warn">{board.missing_slots.length} image slot(s) still need an upload.</span>
            )}
          </div>
          <button
            onClick={handleRender}
            disabled={!board.ready_to_render || rendering || board.status === 'processing' || !canAffordRender}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {board.status === 'processing' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Rendering {board.progress}%</>
            ) : !canAffordRender ? (
              <><Film className="h-4 w-4" /> {hasSubscription ? 'Get credits' : 'View plans'}</>
            ) : (
              <><Film className="h-4 w-4" /> Approve &amp; Render</>
            )}
          </button>
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

function StatusBanner({ board }: { board: Storyboard }) {
  if (board.status === 'failed' && board.error_message) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{board.error_message}</span>
      </div>
    )
  }
  if (board.status === 'processing') {
    return (
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-inset">
        <div className="h-full bg-primary transition-all" style={{ width: `${board.progress}%` }} />
      </div>
    )
  }
  return null
}

/** Brand kit controls (§10.4): logo watermark upload + brand colour, with the
 *  contrast notice when the colour was ignored. */
function BrandControls({
  board, onLogo, onColor,
}: {
  board: Storyboard
  onLogo: (file: File | null, remove?: boolean) => void
  onColor: (color: string) => void
}) {
  const logoRef = useRef<HTMLInputElement>(null)
  const [color, setColor] = useState(board.brand?.color ?? '#ffffff')
  useEffect(() => {
    if (board.brand?.color) setColor(board.brand.color)
  }, [board.brand?.color])
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">Brand:</span>
      {board.brand?.logo_url ? (
        <span className="inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={board.brand.logo_url} alt="logo" className="h-7 max-w-24 rounded border border-border bg-inset object-contain p-0.5" />
          <button onClick={() => onLogo(null, true)} className="text-xs text-ink3 hover:text-destructive" title="Remove logo">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <button onClick={() => logoRef.current?.click()} className="text-sm font-semibold text-primary hover:underline">
          + Logo watermark
        </button>
      )}
      <input
        ref={logoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onLogo(f)
          e.target.value = ''
        }}
      />
      <span className="inline-flex items-center gap-1.5">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-card"
          title="Brand colour (overrides the accent when readable)"
        />
        {color.toLowerCase() !== (board.brand?.color ?? '').toLowerCase() && (
          <button onClick={() => onColor(color)} className="text-xs font-semibold text-primary hover:underline">
            Apply
          </button>
        )}
        {board.brand?.color && !board.brand?.color_applied && (
          <span className="text-xs text-warn" title="The brand colour fails the 4.5:1 contrast check against this scheme's paper/ink, so the scheme accent is used instead.">
            low contrast — ignored
          </span>
        )}
      </span>
    </div>
  )
}

/** Final render block with the §10.6 aspect switcher + §10.7 SRT download. */
function FinalRender({ board }: { board: Storyboard }) {
  const videos = (board.output_videos ?? []).filter((v) => v.url)
  const [aspect, setAspect] = useState(videos[0]?.aspect ?? board.aspect_ratio)
  const current = videos.find((v) => v.aspect === aspect)?.url ?? board.output_url ?? undefined
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-black shadow-soft">
      {/* Height-capped: a 9:16 render at w-full would tower ~1.8x the column
          width; portrait pillarboxes on the black card instead. */}
      <video key={current} src={current} controls className="mx-auto block max-h-[70vh] w-auto max-w-full" />
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Final render</span>
          {videos.length > 1 && (
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              {videos.map((v) => (
                <button
                  key={v.aspect}
                  onClick={() => setAspect(v.aspect)}
                  className={`px-2.5 py-1 text-xs font-semibold ${
                    aspect === v.aspect ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-inset'
                  }`}
                >
                  {v.label} {v.aspect}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {board.srt_url && (
            <a
              href={board.srt_url}
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-inset"
            >
              <Captions className="h-4 w-4" /> SRT
            </a>
          )}
          <a
            href={current}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <Play className="h-4 w-4" /> Download MP4
          </a>
        </div>
      </div>
    </div>
  )
}

/** Quality-gate report (§12): collapsible severity-chip summary of the
 *  storyboard lint — informational only, it never blocks a render. */
function LintReport({ report }: { report?: LintReportData | null }) {
  const [open, setOpen] = useState(false)
  if (!report || !report.items?.length) return null
  const chip = (n: number, tone: string, label: string) =>
    n > 0 ? (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
        {n} {label}
      </span>
    ) : null
  const toneFor = (s: LintItem['severity']) =>
    s === 'error' ? 'text-destructive' : s === 'warn' ? 'text-warn' : 'text-muted-foreground'
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warn" />
          <span className="text-sm font-semibold">Quality check</span>
          {chip(report.counts.error, 'bg-destructive/10 text-destructive', 'error')}
          {chip(report.counts.warn, 'bg-warn/10 text-warn', 'warning')}
          {chip(report.counts.info, 'bg-inset text-muted-foreground', 'note')}
        </div>
        <span className="text-xs text-ink3">{open ? 'Hide' : 'Details'}</span>
      </button>
      {open && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {report.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 text-[10px] font-bold uppercase ${toneFor(item.severity)}`}>
                {item.severity}
              </span>
              <span className="text-foreground">
                {item.scene_id ? <span className="mr-1.5 font-mono text-xs text-ink3">{item.scene_id}</span> : null}
                {item.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SceneCard({
  projectId, scene, board, cameraMoves, onChange,
}: {
  projectId: string
  scene: Scene
  board: Storyboard
  cameraMoves: string[]
  onChange: () => void
}) {
  const templateLabel = board.templates?.[scene.layout_template]?.label || scene.layout_template
  const slotKeys = Object.keys(scene.slots)

  const updateTransition = async (t: string) => {
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${scene.scene_id}`, { transition: t })
      await onChange()
    } catch {
      alert('Failed to update transition')
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-primary">
            {scene.order}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-inset px-2 py-1 text-xs font-semibold text-foreground">
            {TEMPLATE_ICON[scene.layout_template] || <LayoutGrid className="h-4 w-4" />}
            {templateLabel}
          </span>
          <span className="font-mono text-xs text-ink3">{scene.duration_seconds}s</span>
        </div>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <Film className="h-3 w-3" /> transition
          <select
            value={scene.transition}
            onChange={(e) => updateTransition(e.target.value)}
            className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] text-foreground outline-none focus:border-primary"
          >
            {(board.transitions || []).map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      {scene.narration && (
        <p className="mb-3 text-sm italic text-muted-foreground">“{scene.narration}”</p>
      )}

      <div className={`grid gap-3 ${slotKeys.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {slotKeys.map((slotKey) => (
          <SlotCard
            key={slotKey}
            projectId={projectId}
            sceneId={scene.scene_id}
            slotKey={slotKey}
            slot={scene.slots[slotKey]}
            cameraMoves={cameraMoves}
            autoVisuals={Boolean(board.auto_visuals)}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}

function SlotCard({
  projectId, sceneId, slotKey, slot, cameraMoves, autoVisuals = false, onChange,
}: {
  projectId: string
  sceneId: string
  slotKey: string
  slot: Slot
  cameraMoves: string[]
  autoVisuals?: boolean
  onChange: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    try {
      await api.delete(`/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}/asset`)
      await onChange()
    } catch {
      alert('Failed to remove asset')
    }
  }

  const dockBadge = slot.dock ? (
    <span className="ml-1 rounded bg-inset px-1.5 py-0.5 text-[10px] text-ink3">{slot.dock}</span>
  ) : null

  if (slot.content_type === 'text_block') {
    return (
      <div className="rounded-xl border border-border bg-inset p-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink3">{slotKey}{dockBadge}</div>
        {slot.heading && <div className="font-semibold text-primary">{slot.heading}</div>}
        <ul className="mt-1 space-y-0.5 text-sm text-foreground">
          {(slot.bullets || []).map((b, i) => (
            <li key={i} className="flex gap-1.5"><span className="text-primary">›</span>{b}</li>
          ))}
        </ul>
      </div>
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

  // Structured data-card contents (versus / chart / pros-cons / icon grid /
  // timeline / steps / ranking / meter / map / headlines): read-only
  // summaries — the renderer animates these natively, nothing to upload.
  if ([
    'versus', 'chart', 'proscons', 'icons',
    'timeline_nodes', 'steps', 'ranking', 'meter', 'map', 'headlines',
    'math_steps', 'geometry', 'function_plot', 'scenario',
  ].includes(slot.content_type)) {
    const s = slot as Record<string, any>
    let summary: React.ReactNode = null
    if (slot.content_type === 'versus') {
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
    } else {
      // icons / steps: chips of labels.
      summary = (
        <div className="flex flex-wrap gap-1.5 text-xs text-foreground">
          {(s.items || []).map((it: any, i: number) => (
            <span key={i} className="rounded bg-card px-1.5 py-0.5">
              {typeof it === 'string' ? it : it.label || it.icon}
            </span>
          ))}
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-border bg-inset p-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink3">{slotKey}</div>
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
          <Move className="h-3 w-31" />
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
          <button
            onClick={remove}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-xs text-ink3 transition-colors hover:border-primary hover:text-primary"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="px-2">{slot.asset_request?.description || 'Upload media'}</span>
        </button>
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

      {!slot.asset?.url && slot.stock_query && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-primary">
          <Film className="mt-0.5 h-3 w-3 shrink-0" />
          Stock b-roll “{slot.stock_query}” is fetched automatically at render — upload only to override it.
        </p>
      )}
      {!slot.asset?.url && !slot.stock_query && autoVisuals && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-primary">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
          AI illustrates this automatically at render — upload only to override it.
        </p>
      )}
      {!slot.asset?.url && !slot.stock_query && !autoVisuals && slot.asset_request?.description && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink3">
          <ImageIcon className="mt-0.5 h-3 w-3 shrink-0" />
          {slot.asset_request.description}
        </p>
      )}
    </div>
  )
}
