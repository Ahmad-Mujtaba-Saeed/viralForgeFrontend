'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { useBilling } from '@/hooks/useBilling'
import { useProjectProgress } from '@/hooks/usePusher'
import { ProcessingStartedDialog } from '@/components/create/processing-started-dialog'
import { StylePicker } from './StylePicker'
import {
  Loader2, Upload, X, Film, RefreshCw, Play, AlertTriangle,
  Image as ImageIcon, LayoutGrid, Columns2, Square, Shuffle, Move,
  Rows2, PanelRight, PanelTop, MessageSquare, Volume2, VolumeX, Music, Music2,
  Captions, CaptionsOff, Type,
  Swords, BarChart3, Sigma, ListChecks, Grid3x3, BookMarked,
  History, Workflow, ArrowLeftRight, Trophy, Gauge, Quote,
  Smartphone, Images, MapPin, Newspaper,
  Calculator, Triangle, TrendingUp, Sparkles, Route, FileText, Eye, Lock,
  Palette, Pause, SlidersHorizontal, Check, Wand2, Send, Plus, CornerDownRight, Mic, Pencil,
  Search, Library, Layers,
} from 'lucide-react'

interface Slot {
  content_type: string
  label?: string
  camera_move?: string
  // The media brief. `description` is the AI image PROMPT and always was;
  // the other three are written for a human deciding what to go and find —
  // `guidance` is the sentence shown under the slot, `search_query` seeds the
  // free-media search box, `media_kind` says whether the beat wants a still
  // or motion. `instruction` is the user's own art direction, kept on the slot
  // so a later render redraws the picture they approved.
  asset_request?: {
    description?: string
    instruction?: string
    search_query?: string
    guidance?: string
    media_kind?: 'image' | 'video' | 'either'
  }
  // `source` says who put the media there: 'ai' | 'stock' | 'library' |
  // 'sprite' | 'upload'.
  asset?: { url: string; type: string; name?: string; source?: string } | null
  // Attribution for a picture taken from the free library. Lives on the slot,
  // not the asset row, so it survives the file being replaced.
  media_credit?: {
    provider?: string
    provider_label?: string
    author?: string
    source_url?: string
    license?: string
  }
  heading?: string
  bullets?: string[]
  body?: string
  dock?: string
  width_pct?: number
  frame?: string
  stock_query?: string
}
/** One free-media source, as the backend reports it. */
interface MediaProvider {
  name: string
  label: string
  kinds: string[]
  needs_key: boolean
  configured: boolean
  cooling_down?: boolean
  license: string
  attribution_required: boolean
}
/** One search result, ready to drop into a slot. */
interface MediaHit {
  provider: string
  provider_label: string
  id: string
  kind: 'image' | 'video'
  thumb: string
  width: number
  height: number
  orientation: string
  duration: number | null
  title: string
  credit: { author?: string; author_url?: string; source_url?: string }
  license: string
  attribution_required: boolean
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
  music_category?: string
  music_volume?: number
  music_track_id?: string | null
  music_categories?: string[]
  // The user's own uploaded beds — private to them, offered on every project.
  music_custom?: {
    category: string
    label: string
    count: number
    max: number
    max_kilobytes: number
    accept: string
  }
  music_configured?: boolean
  music_provider?: string
  // The free media library: whether any source can answer at all, and which
  // ones — so the panel can name the sources and say what a key would unlock.
  media_library?: { available: boolean; providers: MediaProvider[] }
  captions_enabled?: boolean
  backdrop_enabled?: boolean
  font_pack?: string
  font_packs?: Record<string, { label: string; display: string; body: string; mono: string; use_when: string }>
  motion_style?: string
  motion_style_auto?: string | null
  motion_styles?: Record<string, { label: string; use_when: string }>
  skin?: string
  skin_auto?: string | null
  skin_resolved?: string
  skins?: Record<string, { label: string; use_when: string; overrides_theme?: boolean }>
  composition_mode?: string
  composition_modes?: string[]
  board_style?: string
  board_style_auto?: string | null
  board_style_resolved?: string
  board_styles?: Record<string, { label: string; use_when: string; overrides_theme?: boolean }>
  current_look?: string
  rendered_look?: string | null
  chapter_plan?: { chapters?: { id?: string; mode?: string; scene_ids?: string[] }[] } | null
  lint_report?: LintReportData | null
  revision?: RevisionData | null
  chapter_chip?: boolean
  accent_shift?: boolean
  aspect_variants?: boolean
  aspect_variants_multiplier?: number
  brand?: { logo_url?: string | null; color?: string | null; color_applied?: boolean }
  srt_url?: string | null
  youtube_kit_url?: string | null
  thumbnail_url?: string | null
  output_videos?: { aspect: string; label: string; url: string | null }[]
}

interface MusicTrack {
  id: string
  title: string
  duration: number
  url: string
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

interface RevisionResult {
  state: 'done' | 'error'
  at?: string
  request?: string
  reply?: string
  summary?: string
  message?: string
  changed?: string[]
  added?: string[]
  removed?: string[]
  moved?: string[]
  findings?: LintItem[]
}
interface RevisionData {
  running: boolean
  request?: string | null
  last?: RevisionResult | null
  log?: { at: string; request: string; summary: string; state: string }[]
  count?: number
  max_touched?: number
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
  image_grid: <LayoutGrid className="h-4 w-4" />,
  custom_card: <Wand2 className="h-4 w-4" />,
  map_card: <MapPin className="h-4 w-4" />,
  headline_ticker: <Newspaper className="h-4 w-4" />,
  math_steps: <Calculator className="h-4 w-4" />,
  geometry_diagram: <Triangle className="h-4 w-4" />,
  function_plot: <TrendingUp className="h-4 w-4" />,
  scenario_diagram: <Route className="h-4 w-4" />,
}

const toggleBtn =
  'inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-inset disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-card'

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
  const isPending = (key: string) => Boolean(pending[key])
  const groupPending = (prefix: string) => Object.keys(pending).some((k) => k.startsWith(`${prefix}:`) && pending[k])
  /** Which option of a group is mid-flight, for the pickers' spinner. */
  const pendingKeyIn = (prefix: string) => {
    const hit = Object.keys(pending).find((k) => k.startsWith(`${prefix}:`) && pending[k])
    return hit ? hit.slice(prefix.length + 1) : null
  }

  // Live style preview: one frozen frame of the REAL composition, refreshed
  // whenever a look-affecting setting changes. `previewScene` lets the user
  // look at a different beat; the backend caches by look+scene, so flipping
  // between styles you have already viewed comes back instantly.
  const [preview, setPreview] = useState<{ url: string; scene_id: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewScene, setPreviewScene] = useState<string | null>(null)

  const fetchPreview = useCallback(async (sceneId?: string | null) => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await api.post(`/api/explainer/projects/${id}/preview`, sceneId ? { scene_id: sceneId } : {})
      const data = res.data?.data
      if (data?.url) {
        // Cache-bust: the PNG path is fingerprinted, but a re-render of the
        // same fingerprint (after a scene edit) reuses the filename.
        setPreview({ url: `${data.url}?v=${Date.now()}`, scene_id: data.scene_id })
        setPreviewScene(data.scene_id)
      }
    } catch (err: any) {
      setPreviewError(err?.response?.data?.message || 'Preview unavailable')
    } finally {
      setPreviewLoading(false)
    }
  }, [id])

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

  // Refresh the still whenever the look changes. `current_look` is a backend
  // hash of exactly the settings that alter a frame, so this fires on a scheme
  // /font/skin/motion/board switch and stays quiet for music or voice toggles.
  // Skipped while analysis or a render owns the pipeline.
  const currentLook = board?.current_look
  const previewable = (board?.scenes.length ?? 0) > 0 && board?.status !== 'analyzing' && board?.status !== 'processing'
  const previewSceneRef = useRef<string | null>(null)
  previewSceneRef.current = previewScene

  useEffect(() => {
    if (!currentLook || !previewable) return
    fetchPreview(previewSceneRef.current)
  }, [currentLook, previewable, fetchPreview])

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
  const reviseRef = useRef<HTMLTextAreaElement | null>(null)
  const revising = Boolean(board?.revision?.running)

  const askAiAbout = useCallback((sceneId: string) => {
    setReviseTargets((prev) => (prev.includes(sceneId) ? prev.filter((s) => s !== sceneId) : [...prev, sceneId]))
    setReviseOpen(true)
    setTimeout(() => reviseRef.current?.focus(), 50)
  }, [])

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

  const handleShuffleTheme = async () => {
    await withPending('shuffle-theme', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/shuffle-theme`)
        await fetchBoard()
      } catch {
        alert('Failed to shuffle theme')
      }
    })
  }

  const handleToggleNarration = async () => {
    await withPending('narration', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/narration`, { enabled: !(board?.narration_enabled ?? true) })
        await fetchBoard()
      } catch {
        alert('Failed to toggle voiceover')
      }
    })
  }

  const handleToggleMusic = async () => {
    await withPending('music', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/music`, { enabled: !(board?.music_enabled ?? true) })
        await fetchBoard()
      } catch {
        alert('Failed to toggle background music')
      }
    })
  }

  // ---- background music panel ------------------------------------------
  // The renderer already understood category / volume / a chosen track; none
  // of it was reachable after the create flow, so a storyboard was stuck with
  // whatever mood the analyzer inferred.
  const [musicOpen, setMusicOpen] = useState(false)
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [musicSource, setMusicSource] = useState<string>('none')
  const [musicTracksLoading, setMusicTracksLoading] = useState(false)
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null)
  // Local slider value so dragging stays smooth while the PATCH is in flight.
  const [volumeDraft, setVolumeDraft] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const musicCategory = board?.music_category ?? 'auto'
  const musicVolume = volumeDraft ?? board?.music_volume ?? 0.09

  // One <audio> for the whole panel: auditioning a second track must stop the
  // first, and leaving the page must not keep playing.
  const stopPreview = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setPreviewingTrack(null)
  }, [])

  useEffect(() => () => stopPreview(), [stopPreview])

  const previewTrack = (track: MusicTrack) => {
    if (previewingTrack === track.id) {
      stopPreview()
      return
    }
    stopPreview()
    const audio = new Audio(track.url)
    // Audition at the level it will actually sit at under the narration,
    // otherwise every track sounds far too loud to judge.
    audio.volume = Math.min(1, Math.max(0.05, musicVolume * 3))
    audio.onended = () => setPreviewingTrack(null)
    audio.play().catch(() => setPreviewingTrack(null))
    audioRef.current = audio
    setPreviewingTrack(track.id)
  }

  const loadMusicTracks = useCallback(async (category: string) => {
    if (category === 'auto' || category === 'none') {
      setMusicTracks([])
      setMusicSource('none')
      return
    }
    setMusicTracksLoading(true)
    try {
      const res = await api.get(`/api/music/tracks`, { params: { category } })
      setMusicTracks(res.data?.tracks ?? [])
      setMusicSource(res.data?.source ?? 'none')
    } catch {
      setMusicTracks([])
      setMusicSource('none')
    } finally {
      setMusicTracksLoading(false)
    }
  }, [])

  // Only fetch once the panel is actually open — the track search is a rate
  // limited upstream call, not something to spend on every storyboard view.
  useEffect(() => {
    if (musicOpen) void loadMusicTracks(musicCategory)
  }, [musicOpen, musicCategory, loadMusicTracks])

  // ---- the user's OWN music -----------------------------------------------
  // Uploaded once, private to them, and offered on every project from then on.
  // It is just another category ('custom'), so the listing above already
  // renders it; only adding and removing need their own handlers.
  const customCategory = board?.music_custom?.category ?? 'custom'
  const musicFileRef = useRef<HTMLInputElement | null>(null)
  const [musicUploading, setMusicUploading] = useState(false)
  const [musicUploadError, setMusicUploadError] = useState<string | null>(null)

  const uploadMusic = async (file: File) => {
    setMusicUploading(true)
    setMusicUploadError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/api/music/library', fd)
      // Land on the new track: switch the project to "my music" and select it,
      // so uploading is one gesture rather than upload-then-hunt-for-it.
      const track = res.data?.data?.track
      await saveMusic(
        { category: customCategory, ...(track?.id ? { track_id: track.id } : {}) },
        `music-cat:${customCategory}`
      )
      await loadMusicTracks(customCategory)
    } catch (err: any) {
      setMusicUploadError(err?.response?.data?.message || 'That file could not be uploaded.')
    } finally {
      setMusicUploading(false)
    }
  }

  const deleteMusic = async (trackId: string) => {
    if (!confirm('Remove this track from your library? Videos already rendered with it are unaffected.')) return
    stopPreview()
    try {
      await api.delete(`/api/music/library/${trackId}`)
      // Dropping the track this project was using leaves it with no bed —
      // clear the selection so the panel does not point at something gone.
      if (board?.music_track_id === trackId) {
        await saveMusic({ track_id: '' }, 'music-track:clear')
      }
      await loadMusicTracks(customCategory)
    } catch {
      alert('Failed to remove that track')
    }
  }

  const saveMusic = async (patch: Record<string, unknown>, key: string) => {
    await withPending(key, async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/music`, patch)
        await fetchBoard()
      } catch {
        alert('Failed to update background music')
      }
    })
  }

  const handleMusicCategory = async (category: string) => {
    stopPreview()
    await saveMusic({ category }, `music-cat:${category}`)
  }

  // Debounced: an input[range] fires on every pixel of the drag.
  const handleMusicVolume = (value: number) => {
    setVolumeDraft(value)
    if (volumeTimer.current) clearTimeout(volumeTimer.current)
    volumeTimer.current = setTimeout(() => {
      void saveMusic({ volume: value }, 'music-volume').then(() => setVolumeDraft(null))
    }, 400)
  }

  const handleMusicTrack = async (trackId: string) => {
    // Clicking the selected track clears it, back to the automatic pick.
    const next = board?.music_track_id === trackId ? '' : trackId
    await saveMusic({ track_id: next }, `music-track:${trackId}`)
  }

  const autoVisualsOn = Boolean(board?.auto_visuals)

  const handleToggleAutoVisuals = async () => {
    await withPending('auto-visuals', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/auto-visuals`, { enabled: !autoVisualsOn })
        await fetchBoard()
      } catch {
        alert('Failed to toggle AI visuals')
      }
    })
  }

  const captionsOn = board?.captions_enabled ?? board?.aspect_ratio === '9:16'

  const backdropOn = board?.backdrop_enabled ?? true

  const handleToggleBackdrop = async () => {
    await withPending('backdrop', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/backdrop`, { enabled: !backdropOn })
        await fetchBoard()
      } catch {
        alert('Failed to toggle the backdrop field')
      }
    })
  }

  const handleToggleCaptions = async () => {
    await withPending('captions', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/captions`, { enabled: !captionsOn })
        await fetchBoard()
      } catch {
        alert('Failed to toggle captions')
      }
    })
  }

  const handleFontPack = async (pack: string) => {
    await withPending(`font-pack:${pack}`, async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/font-pack`, { pack })
        await fetchBoard()
      } catch {
        alert('Failed to switch typography')
      }
    })
  }

  const handleMotionStyle = async (style: string) => {
    await withPending(`motion-style:${style}`, async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/motion-style`, { style })
        await fetchBoard()
      } catch {
        alert('Failed to switch motion style')
      }
    })
  }

  const handleSkin = async (skin: string) => {
    await withPending(`skin:${skin}`, async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/skin`, { skin })
        await fetchBoard()
      } catch {
        alert('Failed to switch skin')
      }
    })
  }

  const handleToggleAccentShift = async () => {
    await withPending('accent-shift', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/accent-shift`, { enabled: !(board?.accent_shift ?? false) })
        await fetchBoard()
      } catch {
        alert('Failed to toggle accent shift')
      }
    })
  }

  const handleToggleChapterChip = async () => {
    await withPending('chapter-chip', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/chapter-chip`, { enabled: !(board?.chapter_chip ?? false) })
        await fetchBoard()
      } catch {
        alert('Failed to toggle chapter chip')
      }
    })
  }

  const handleToggleAspectVariants = async () => {
    await withPending('aspect-variants', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/aspect-variants`, { enabled: !(board?.aspect_variants ?? false) })
        await fetchBoard()
      } catch {
        alert('Failed to toggle aspect variants')
      }
    })
  }

  const handleBrandLogo = async (file: File | null, removeLogo = false) => {
    const fd = new FormData()
    if (file) fd.append('logo', file)
    if (removeLogo) fd.append('remove_logo', '1')
    await withPending('brand-logo', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/brand`, fd)
        await fetchBoard()
      } catch {
        alert('Failed to update brand logo')
      }
    })
  }

  const handleBrandColor = async (color: string) => {
    await withPending('brand-color', async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/brand`, { color })
        await fetchBoard()
      } catch {
        alert('Failed to update brand color')
      }
    })
  }

  const handleBoardStyle = async (style: string) => {
    if (style === (board?.board_style ?? 'auto')) return
    await withPending(`board-style:${style}`, async () => {
      try {
        await api.post(`/api/explainer/projects/${id}/board-style`, { board_style: style })
        await fetchBoard()
      } catch {
        alert('Failed to switch board style')
      }
    })
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

  // `id` comes from the query string, so it is nullable until here; every
  // panel below takes it as a plain string.
  if (!board || !id) {
    return <div className="p-10 text-center text-muted-foreground">Project not found.</div>
  }

  // Chalk and notebook boards — and the blueprint SKIN — ship a FIXED palette
  // that replaces the video's theme wholesale (board/boardTheme.ts,
  // theme.tsx), so the colour scheme controls would be lying if they stayed
  // live. The registry marks which styles do this — the UI does not hardcode
  // the list.
  const resolvedBoardStyle = board.board_style_resolved ?? 'slate'
  const boardLocksTheme =
    board.composition_mode === 'math_board' &&
    Boolean(board.board_styles?.[resolvedBoardStyle]?.overrides_theme)
  const resolvedSkin = board.skin_resolved ?? 'flat'
  const skinLocksTheme = Boolean(board.skins?.[resolvedSkin]?.overrides_theme)
  const themeLocked = boardLocksTheme || skinLocksTheme
  const lockedBoardLabel = board.board_styles?.[resolvedBoardStyle]?.label ?? resolvedBoardStyle
  // What owns the palette right now, and how to hand it back to the scheme.
  const themeLockOwner = boardLocksTheme
    ? `the ${lockedBoardLabel} board`
    : `the ${board.skins?.[resolvedSkin]?.label ?? resolvedSkin} skin`
  const themeLockEscape = boardLocksTheme
    ? 'Switch the board to Slate to use it.'
    : 'Switch the skin to Flat to use it.'

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">{board.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {board.scenes.length} scenes · {board.aspect_ratio} · status:{' '}
            <span className="font-semibold capitalize text-foreground">{board.status}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleToggleNarration} disabled={isPending('narration')} className={toggleBtn} title="AI voiceover">
            {isPending('narration') ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (board.narration_enabled ?? true) ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-ink3" />
            )}
            Voiceover {(board.narration_enabled ?? true) ? 'On' : 'Off'}
          </button>
          <button onClick={handleToggleMusic} disabled={isPending('music')} className={toggleBtn} title="Curated background music (by scene mood)">
            {isPending('music') ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (board.music_enabled ?? true) ? (
              <Music className="h-4 w-4 text-primary" />
            ) : (
              <Music2 className="h-4 w-4 text-ink3" />
            )}
            Music {(board.music_enabled ?? true) ? 'On' : 'Off'}
          </button>
          {(board.music_enabled ?? true) ? (
            <button
              onClick={() => {
                if (musicOpen) stopPreview()
                setMusicOpen((o) => !o)
              }}
              className={toggleBtn}
              title="Change the background track: category, specific song, and how loud it sits under the voiceover"
            >
              <SlidersHorizontal className={`h-4 w-4 ${musicOpen ? 'text-primary' : 'text-ink3'}`} />
              Edit music
            </button>
          ) : null}
          <button onClick={handleToggleCaptions} disabled={isPending('captions')} className={toggleBtn} title="Karaoke word captions synced to the voiceover">
            {isPending('captions') ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : captionsOn ? (
              <Captions className="h-4 w-4 text-primary" />
            ) : (
              <CaptionsOff className="h-4 w-4 text-ink3" />
            )}
            Captions {captionsOn ? 'On' : 'Off'}
          </button>
          <button onClick={handleToggleBackdrop} disabled={isPending('backdrop')} className={toggleBtn} title="A whisper-quiet grid/dot texture on the background, matched to each scene's mood">
            {isPending('backdrop') ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Grid3x3 className={`h-4 w-4 ${backdropOn ? 'text-primary' : 'text-ink3'}`} />
            )}
            Backdrop {backdropOn ? 'On' : 'Off'}
          </button>
          <button
            onClick={handleToggleAutoVisuals}
            disabled={isPending('auto-visuals')}
            className={toggleBtn}
            title="Unfilled image slots are AI-illustrated at render — nothing to upload. Uploads still override."
          >
            {isPending('auto-visuals') ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className={`h-4 w-4 ${autoVisualsOn ? 'text-primary' : 'text-ink3'}`} />
            )}
            AI visuals {autoVisualsOn ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => { setReviseOpen(true); setTimeout(() => reviseRef.current?.focus(), 50) }}
            disabled={revising || board.status === 'analyzing'}
            className={toggleBtn}
            title="Tell the AI what to change — only the cards your note is about are rebuilt"
          >
            {revising ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Wand2 className="h-4 w-4 text-primary" />
            )}
            {revising ? 'Applying changes…' : 'Edit with AI'}
          </button>
          <button
            onClick={handleReanalyze}
            disabled={isPending('reanalyze') || revising}
            className={toggleBtn}
            title="Rebuild the whole storyboard from the script — use “Edit with AI” to change only some cards"
          >
            <RefreshCw className={`h-4 w-4 ${isPending('reanalyze') ? 'animate-spin' : ''}`} /> Re-analyze
          </button>
        </div>
      </header>

      {musicOpen && (board.music_enabled ?? true) && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">Background music</div>
            <button onClick={() => { stopPreview(); setMusicOpen(false) }} className="text-ink3 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Category. 'auto' keeps today's behaviour — the renderer maps the
              storyboard's dominant mood onto a category. */}
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink3">Style</div>
            <div className="flex flex-wrap gap-1.5">
              {['auto', customCategory, ...(board.music_categories ?? [])].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleMusicCategory(cat)}
                  disabled={groupPending('music-cat')}
                  title={
                    cat === 'auto'
                      ? "Match the music to the storyboard's dominant mood"
                      : cat === customCategory
                        ? 'Music you uploaded yourself — only you can see it'
                        : undefined
                  }
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold capitalize transition-colors disabled:opacity-60 ${
                    musicCategory === cat
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-inset'
                  }`}
                >
                  {isPending(`music-cat:${cat}`) ? (
                    <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                  ) : cat === customCategory ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      {board.music_custom?.label ?? 'My music'}
                      {board.music_custom?.count ? (
                        <span className="opacity-70">({board.music_custom.count})</span>
                      ) : null}
                    </span>
                  ) : (
                    cat
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Volume. Capped at 40% because the bed is ducked under narration
              on top of this — past that the voiceover stops winning. */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink3">Volume</span>
              <span className="text-xs font-semibold text-foreground">
                {Math.round(musicVolume * 100)}%
                {isPending('music-volume') ? <Loader2 className="ml-1.5 inline h-3 w-3 animate-spin" /> : null}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.4}
              step={0.01}
              value={musicVolume}
              onChange={(e) => handleMusicVolume(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sits under the voiceover, which ducks it further while anyone is speaking. 9% is the default.
            </p>
          </div>

          {/* Track picker. Auditions the exact URLs the render pick draws
              from, so what you hear is what you get. */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink3">Track</span>
              <span className="text-xs capitalize text-muted-foreground">
                {musicSource === 'local' ? 'from your local library' : board.music_provider ?? null}
              </span>
            </div>

            {musicCategory === customCategory && (
              <div className="mb-2 rounded-xl border border-dashed border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    Your own tracks — visible only to you, and offered on every project you make from now on.
                    <span className="ml-1 text-ink3">
                      mp3, wav, m4a, aac or ogg · up to{' '}
                      {Math.round((board.music_custom?.max_kilobytes ?? 20480) / 1024)} MB ·{' '}
                      {board.music_custom?.count ?? 0}/{board.music_custom?.max ?? 50} used
                    </span>
                  </div>
                  <button
                    onClick={() => musicFileRef.current?.click()}
                    disabled={musicUploading || (board.music_custom?.count ?? 0) >= (board.music_custom?.max ?? 50)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {musicUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {musicUploading ? 'Uploading…' : 'Upload music'}
                  </button>
                </div>
                <input
                  ref={musicFileRef}
                  type="file"
                  accept={board.music_custom?.accept ?? '.mp3,.wav,.m4a,.aac,.ogg'}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadMusic(f)
                    e.target.value = ''
                  }}
                />
                {musicUploadError && <p className="mt-1.5 text-xs text-warn">{musicUploadError}</p>}
              </div>
            )}

            {musicCategory === 'auto' || musicCategory === 'none' ? (
              <p className="text-sm text-muted-foreground">
                {musicCategory === 'none'
                  ? 'Music is off for this video — pick a style above to turn it back on.'
                  : 'Pick a style above to choose a specific track. On Auto the renderer picks one to match the mood.'}
              </p>
            ) : musicTracksLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tracks…
              </div>
            ) : musicTracks.length === 0 ? (
              musicCategory === customCategory ? (
                <p className="text-sm text-muted-foreground">
                  Your library is empty. Upload a track above and it will be here for every video you make.
                </p>
              ) : (
              <p className="text-sm text-muted-foreground">
                No auditionable tracks for this style
                {board.music_configured === false
                  ? ` — no ${board.music_provider ?? 'music provider'} key is configured.`
                  : ` — ${board.music_provider ?? 'the provider'} returned nothing for this style and there is no local library for it.`}{' '}
                The style still applies and the renderer falls back to its automatic pick. To get a list here, drop mp3s into{' '}
                <code className="rounded bg-inset px-1 py-0.5 text-xs">storage/app/public/audio/{musicCategory}/</code>.
              </p>
              )
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {musicTracks.map((track) => {
                  const chosen = board.music_track_id === track.id
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                        chosen ? 'border-primary bg-inset' : 'border-border bg-card'
                      }`}
                    >
                      <button
                        onClick={() => previewTrack(track)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground hover:bg-inset"
                        title={previewingTrack === track.id ? 'Stop' : 'Preview'}
                      >
                        {previewingTrack === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">{track.title}</div>
                        {track.duration > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                          </div>
                        ) : null}
                      </div>
                      <button
                        onClick={() => handleMusicTrack(track.id)}
                        disabled={groupPending('music-track')}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                          chosen
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-card text-muted-foreground hover:bg-inset'
                        }`}
                      >
                        {isPending(`music-track:${track.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : chosen ? (
                          <>
                            <Check className="h-4 w-4" /> Using
                          </>
                        ) : (
                          'Use'
                        )}
                      </button>
                      {/* Only your own uploads are yours to delete; the
                          catalogue is shared and read-only. */}
                      {musicCategory === customCategory && (
                        <button
                          onClick={() => deleteMusic(track.id)}
                          title="Remove from your library"
                          className="shrink-0 rounded-lg border border-border p-1.5 text-ink3 hover:bg-inset hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {board.music_track_id ? (
              <p className="mt-2 text-xs text-muted-foreground">
                A specific track is locked in. Click “Using” to clear it and let the renderer pick.
              </p>
            ) : null}
          </div>
        </div>
      )}

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
          {board.composition_mode === 'math_board' ? (
            board.board_styles && Object.keys(board.board_styles).length > 0 ? (
              <StylePicker
                group="board"
                title="Board"
                value={board.board_style ?? 'auto'}
                pendingKey={pendingKeyIn('board-style')}
                disabled={groupPending('board-style')}
                onSelect={handleBoardStyle}
                options={[
                  {
                    key: 'auto',
                    label: 'Auto',
                    hint: 'Match the board to the topic: proofs get the chalkboard, worked problems the notebook.',
                    autoLabel: board.board_style_auto
                      ? (board.board_styles[board.board_style_auto]?.label ?? board.board_style_auto)
                      : undefined,
                  },
                  ...Object.entries(board.board_styles).map(([key, meta]) => ({
                    key,
                    label: meta?.label ?? key,
                    hint: meta?.use_when,
                  })),
                ]}
              />
            ) : null
          ) : (
          <StylePicker
            group="composition"
            title="Composition"
            value={board.composition_mode ?? ''}
            pendingKey={switchingMode}
            disabled={switchingMode !== null}
            onSelect={handleCompositionMode}
            options={(board.composition_modes ?? []).map((mode) => ({
              key: mode,
              label: COMPOSITION_LABELS[mode] ?? mode,
              hint:
                mode === 'hybrid'
                  ? 'The AI mixes camera journeys and slide cuts to fit the script.'
                  : mode === 'canvas_journey'
                    ? 'One continuous camera flight across every scene.'
                    : 'Classic scene-by-scene transitions.',
            }))}
          />
          )}
        </div>
      )}

      {board.theme && (
        <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft ${
          themeLocked ? 'opacity-60' : ''
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[board.theme.bg_to, board.theme.accent, board.theme.accent2, board.theme.text].map((c, i) => (
                <span key={i} className="h-6 w-6 rounded-full border border-border" style={{ background: c }} />
              ))}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Color scheme: </span>
              <span className="font-semibold text-foreground">{board.theme.label}</span>
              {themeLocked && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-warn" title={`${themeLockOwner[0].toUpperCase()}${themeLockOwner.slice(1)} uses its own fixed palette, so the video's colour scheme has no effect. ${themeLockEscape}`}>
                  <Lock className="h-3 w-3" />
                  overridden by {themeLockOwner}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {board.font_packs && Object.keys(board.font_packs).length > 0 && (
              <StylePicker
                group="font"
                title="Type"
                icon={<Type className="h-4 w-4 text-muted-foreground" />}
                value={board.font_pack ?? 'auto'}
                pendingKey={pendingKeyIn('font-pack')}
                disabled={groupPending('font-pack')}
                onSelect={handleFontPack}
                options={[
                  {
                    key: 'auto',
                    label: 'Auto',
                    hint: 'Let the system pick the typography for the topic.',
                  },
                  ...Object.entries(board.font_packs).map(([key, meta]) => ({
                    key,
                    label: meta?.label ?? key,
                    hint: meta?.use_when,
                  })),
                ]}
              />
            )}
            <button
              onClick={handleShuffleTheme}
              disabled={isPending('shuffle-theme') || themeLocked}
              title={themeLocked ? `${themeLockOwner[0].toUpperCase()}${themeLockOwner.slice(1)} paints with its own fixed palette — ${themeLockEscape.toLowerCase()}` : undefined}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-inset disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-card"
            >
              <Shuffle className={`h-4 w-4 ${isPending('shuffle-theme') ? 'animate-spin' : ''}`} /> Shuffle colors
            </button>
          </div>
        </div>
      )}

      {/* Motion + skin. Both rows show a RECORDED loop of the real renderer
          on hover (see StylePicker) — the names alone never said what the
          setting does, and rendering a live sample per hover would be absurd. */}
      {(board.motion_styles || board.skins) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
          {board.motion_styles && (
            <StylePicker
              group="motion"
              title="Motion"
              icon={<Wand2 className="h-4 w-4 text-muted-foreground" />}
              value={board.motion_style ?? 'auto'}
              pendingKey={pendingKeyIn('motion-style')}
              disabled={groupPending('motion-style')}
              onSelect={handleMotionStyle}
              options={[
                {
                  key: 'auto',
                  label: 'Auto',
                  hint: 'Let the AI match the motion to the topic.',
                  autoLabel: board.motion_style_auto
                    ? (board.motion_styles[board.motion_style_auto]?.label ?? board.motion_style_auto)
                    : undefined,
                },
                ...Object.entries(board.motion_styles).map(([key, meta]) => ({
                  key,
                  label: meta?.label ?? key,
                  hint: meta?.use_when,
                })),
              ]}
            />
          )}
          {board.skins && (
            <StylePicker
              group="skin"
              title="Skin"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              value={board.skin ?? 'auto'}
              pendingKey={pendingKeyIn('skin')}
              disabled={groupPending('skin')}
              onSelect={handleSkin}
              options={[
                {
                  key: 'auto',
                  label: 'Auto',
                  hint: 'Let the AI pick the surface treatment.',
                  autoLabel: board.skin_auto
                    ? (board.skins[board.skin_auto]?.label ?? board.skin_auto)
                    : undefined,
                },
                ...Object.entries(board.skins).map(([key, meta]) => ({
                  key,
                  label: meta?.label ?? key,
                  hint: meta?.use_when,
                })),
              ]}
            />
          )}
        </div>
      )}

      {/* Packaging (§10.3–10.7): brand kit, chapter chip, aspect variants. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
        <BrandControls
          board={board}
          onLogo={handleBrandLogo}
          onColor={handleBrandColor}
          logoPending={isPending('brand-logo')}
          colorPending={isPending('brand-color')}
        />
        <div className="flex flex-wrap items-center gap-2">
          {board.composition_mode === 'hybrid' && (
            <button onClick={handleToggleChapterChip} disabled={isPending('chapter-chip')} className={toggleBtn} title="Show a 02 / 06 chapter counter in the corner">
              {isPending('chapter-chip') ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <BookMarked className={`h-4 w-4 ${board.chapter_chip ? 'text-primary' : 'text-ink3'}`} />
              )}
              Chapter chip {board.chapter_chip ? 'On' : 'Off'}
            </button>
          )}
          {board.composition_mode === 'hybrid' && (
            <button
              onClick={handleToggleAccentShift}
              disabled={isPending('accent-shift') || themeLocked}
              className={toggleBtn}
              title={
                themeLocked
                  ? `${themeLockOwner[0].toUpperCase()}${themeLockOwner.slice(1)} paints with its own fixed palette — accent shift has no effect on it.`
                  : 'Each chapter after the first tilts the accent hue ±20° so act breaks read in colour too'
              }
            >
              {isPending('accent-shift') ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Palette className={`h-4 w-4 ${board.accent_shift && !themeLocked ? 'text-primary' : 'text-ink3'}`} />
              )}
              Accent shift {board.accent_shift ? 'On' : 'Off'}
            </button>
          )}
          <button
            onClick={handleToggleAspectVariants}
            disabled={isPending('aspect-variants')}
            className={toggleBtn}
            title={`Render 16:9 + 9:16 + 1:1 in one go (${board.aspect_variants_multiplier ?? 2.5}× credits)`}
          >
            {isPending('aspect-variants') ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Columns2 className={`h-4 w-4 ${board.aspect_variants ? 'text-primary' : 'text-ink3'}`} />
            )}
            All aspects {board.aspect_variants ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <StatusBanner board={board} />

      {/* Storyboard on the left, the watch column on the right: the preview
          and the finished render ride ALONGSIDE the scenes so a style change
          and its effect are visible at the same time. The column sticks to the
          viewport while the storyboard scrolls past it. Below lg the two
          stack, preview first — on a phone the frame is the thing you want to
          see before a list of scene cards. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_384px] xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="order-last min-w-0 lg:order-first">
          {board.status !== 'analyzing' && (
            <RevisePanel
              board={board}
              open={reviseOpen}
              onOpen={setReviseOpen}
              text={reviseText}
              onText={setReviseText}
              targets={reviseTargets}
              onClearTarget={(sceneId) => setReviseTargets((prev) => prev.filter((s) => s !== sceneId))}
              onSubmit={handleRevise}
              sending={reviseSending}
              error={reviseError}
              textareaRef={reviseRef}
            />
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
                  onAskAi={askAiAbout}
                  targeted={reviseTargets.includes(scene.scene_id)}
                  revising={revising}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="order-first min-w-0 lg:order-last lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          {/* While the MP4 still matches the current settings it sits on top
              with the preview beneath; the moment a look setting changes the
              preview takes the top slot and the stale video drops below it. */}
          {(() => {
            const hasVideo = board.status === 'completed' && Boolean(board.output_url)
            const stale = hasVideo && Boolean(board.rendered_look) && board.rendered_look !== board.current_look
            const showPreviewFirst = !hasVideo || stale

            const previewPanel = (
              <StylePreview
                board={board}
                preview={preview}
                loading={previewLoading}
                error={previewError}
                sceneId={previewScene}
                stale={stale}
                onScene={(sceneId) => fetchPreview(sceneId)}
                onRetry={() => fetchPreview(previewScene)}
              />
            )

            return (
              <div className="space-y-5">
                {showPreviewFirst ? (
                  <>
                    {previewPanel}
                    {hasVideo && <FinalRender board={board} stale={stale} />}
                  </>
                ) : (
                  <>
                    <FinalRender board={board} stale={false} />
                    {previewPanel}
                  </>
                )}
              </div>
            )
          })()}
        </aside>
      </div>

      {board.scenes.length > 0 && board.status !== 'analyzing' && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-soft-lg backdrop-blur">
          <div className="text-sm font-medium">
            {revising ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Applying your changes to the storyboard…
              </span>
            ) : !canAffordRender ? (
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
            disabled={!board.ready_to_render || rendering || revising || board.status === 'processing' || !canAffordRender}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {board.status === 'processing' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Rendering {board.progress}%</>
            ) : rendering ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting render…</>
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
  board, onLogo, onColor, logoPending, colorPending,
}: {
  board: Storyboard
  onLogo: (file: File | null, remove?: boolean) => void
  onColor: (color: string) => void
  logoPending?: boolean
  colorPending?: boolean
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
          <button
            onClick={() => onLogo(null, true)}
            disabled={logoPending}
            className="text-xs text-ink3 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
            title="Remove logo"
          >
            {logoPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
        </span>
      ) : (
        <button
          onClick={() => logoRef.current?.click()}
          disabled={logoPending}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
        >
          {logoPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {logoPending ? 'Uploading…' : '+ Logo watermark'}
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
          disabled={colorPending}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-card disabled:cursor-not-allowed disabled:opacity-60"
          title="Brand colour (overrides the accent when readable)"
        />
        {color.toLowerCase() !== (board.brand?.color ?? '').toLowerCase() && (
          <button
            onClick={() => onColor(color)}
            disabled={colorPending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
          >
            {colorPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
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

/**
 * Live style preview: one frame of the REAL composition, frozen server-side
 * with the project's current settings. It is not a mock-up — the still comes
 * out of the same shot list the MP4 render consumes, so what you see is what
 * you will get. Refreshes itself whenever a look setting changes.
 */
function StylePreview({
  board, preview, loading, error, sceneId, stale, onScene, onRetry,
}: {
  board: Storyboard
  preview: { url: string; scene_id: string } | null
  loading: boolean
  error: string | null
  sceneId: string | null
  stale: boolean
  onScene: (sceneId: string) => void
  onRetry: () => void
}) {
  const scenes = board.scenes
  const index = Math.max(0, scenes.findIndex((s) => s.scene_id === (sceneId ?? preview?.scene_id)))
  const step = (delta: number) => {
    const next = scenes[index + delta]
    if (next) onScene(next.scene_id)
  }
  // Reserve the frame's real shape so the panel doesn't jolt while loading.
  const ratio = board.aspect_ratio === '9:16' ? '9 / 16' : board.aspect_ratio === '1:1' ? '1 / 1' : '16 / 9'

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-border px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Eye className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-semibold text-foreground">Style preview</span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => step(-1)}
              disabled={loading || index <= 0}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-inset disabled:opacity-40"
              title="Preview the previous scene"
            >
              ‹
            </button>
            <span className="min-w-16 text-center text-xs text-muted-foreground">
              Scene {index + 1}/{scenes.length}
            </span>
            <button
              onClick={() => step(1)}
              disabled={loading || index >= scenes.length - 1}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-inset disabled:opacity-40"
              title="Preview the next scene"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="relative bg-black" style={{ aspectRatio: ratio, maxHeight: '46vh' }}>
        {preview?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt="Style preview"
            className={`mx-auto block h-full w-full object-contain transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Rendering a preview frame…
              </>
            ) : error ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warn" />
                <span className="px-6 text-center text-xs">{error}</span>
                <button onClick={onRetry} className="text-xs font-semibold text-primary hover:underline">
                  Try again
                </button>
              </>
            ) : (
              <span className="text-xs">No preview yet.</span>
            )}
          </div>
        )}
      </div>

      <p className="px-3.5 py-2 text-[11px] leading-snug text-muted-foreground">
        {stale
          ? 'Your latest style changes — the render below is still the older look.'
          : 'A real frame of this video, no render needed. Change a colour scheme, font, skin or motion and it updates.'}
      </p>
    </div>
  )
}

/** Final render block with the §10.6 aspect switcher + §10.7 SRT download. */
function FinalRender({ board, stale = false }: { board: Storyboard; stale?: boolean }) {
  const videos = (board.output_videos ?? []).filter((v) => v.url)
  const [aspect, setAspect] = useState(videos[0]?.aspect ?? board.aspect_ratio)
  const current = videos.find((v) => v.aspect === aspect)?.url ?? board.output_url ?? undefined
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-soft">
      {/* Height-capped: a 9:16 render at w-full would tower ~1.8x the column
          width; portrait pillarboxes on the black card instead. */}
      <video key={current} src={current} controls className="mx-auto block max-h-[52vh] w-auto max-w-full" />
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Final render</span>
          {stale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2.5 py-0.5 text-xs font-bold text-warn">
              <AlertTriangle className="h-3 w-3" />
              style changed since this render
            </span>
          )}
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
        <div className="flex flex-wrap items-center gap-2">
          {board.srt_url && (
            <a
              href={board.srt_url}
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-inset"
            >
              <Captions className="h-3.5 w-3.5" /> SRT
            </a>
          )}
          {board.youtube_kit_url && (
            <a
              href={board.youtube_kit_url}
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-inset"
            >
              <FileText className="h-3.5 w-3.5" /> YouTube kit
            </a>
          )}
          <a
            href={current}
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground"
          >
            <Play className="h-3.5 w-3.5" /> MP4
          </a>
        </div>
      </div>
    </div>
  )
}

/** Quality-gate report (§12): collapsible severity-chip summary of the
 *  storyboard lint — informational only, it never blocks a render. */
/**
 * The storyboard's edit surface: say what is wrong, in words.
 *
 * The promise that makes it usable — and the one the copy has to keep
 * repeating — is that only the cards the note is about get rebuilt. Every
 * other scene keeps the picture you uploaded to it and the voiceover already
 * recorded for it, so there is no reason to be shy about asking.
 */
function RevisePanel({
  board, open, onOpen, text, onText, targets, onClearTarget, onSubmit, sending, error, textareaRef,
}: {
  board: Storyboard
  open: boolean
  onOpen: (open: boolean) => void
  text: string
  onText: (text: string) => void
  targets: string[]
  onClearTarget: (sceneId: string) => void
  onSubmit: () => void
  sending: boolean
  error: string | null
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const revision = board.revision
  const running = Boolean(revision?.running)
  const last = revision?.last ?? null
  const orderOf = (sceneId: string) => board.scenes.find((s) => s.scene_id === sceneId)?.order

  const examples = [
    'Scene 3 should be a bar chart of the revenue numbers, not bullet points.',
    'The intro is too long — cut it to one sentence.',
    'Add a scene after scene 5 explaining why the price fell.',
    'Drop the timeline card, it repeats what scene 2 already said.',
  ]

  const badge = (n: number | undefined, label: string, tone: string) =>
    n && n > 0 ? (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
        {n} {label}
      </span>
    ) : null

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card shadow-soft">
      <button
        onClick={() => onOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          {running ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Wand2 className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {running ? 'Applying your changes…' : 'Not right? Tell the AI what to change'}
          </span>
          {!running && !open ? (
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              — only the cards you mention are rebuilt
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-ink3">{open ? 'Hide' : 'Open'}</span>
      </button>

      {running && (
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span className="italic">“{revision?.request}”</span>
          <p className="mt-1 text-xs">
            Reading your note against the storyboard, rewriting only the cards it names, and fitting them back in.
            Everything else — including your uploads — is untouched.
          </p>
        </div>
      )}

      {open && !running && (
        <div className="border-t border-border p-4">
          {targets.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">About:</span>
              {targets.map((sceneId) => (
                <button
                  key={sceneId}
                  onClick={() => onClearTarget(sceneId)}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-inset"
                  title="Stop targeting this scene"
                >
                  Scene {orderOf(sceneId) ?? '?'}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit()
            }}
            rows={3}
            placeholder="e.g. “Scene 4's chart is wrong — use the 2019-2021 revenue instead” or “add a scene after scene 2 about the price cut”"
            className="w-full resize-y rounded-xl border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => onText(example)}
                  className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-inset"
                >
                  {example.length > 44 ? `${example.slice(0, 42)}…` : example}
                </button>
              ))}
            </div>
            <button
              onClick={onSubmit}
              disabled={sending || text.trim().length < 3}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Apply changes
            </button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Name a scene and only that card is rebuilt — anything you uploaded elsewhere, and the voiceover already
            made for it, stays exactly as it is. Up to {revision?.max_touched ?? 12} cards per request. Use{' '}
            <span className="font-semibold">Re-analyze</span> instead when you want the whole video rewritten.
          </p>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {!running && last && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {last.state === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-warn" />
            ) : (
              <Check className="h-4 w-4 text-good" />
            )}
            <span className="text-sm font-semibold text-foreground">
              {last.state === 'error' ? 'The last revision did not go through' : 'Last revision'}
            </span>
            {badge(last.changed?.length, 'rewritten', 'bg-accent-soft text-primary')}
            {badge(last.added?.length, 'added', 'bg-good/10 text-good')}
            {badge(last.removed?.length, 'removed', 'bg-warn/10 text-warn')}
            {badge(last.moved?.length, 'moved', 'bg-inset text-muted-foreground')}
          </div>

          {last.request ? (
            <p className="mt-1.5 text-sm italic text-muted-foreground">“{last.request}”</p>
          ) : null}
          {last.reply || last.message ? (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
              <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3" />
              <span>{last.reply || last.message}</span>
            </p>
          ) : null}
          {last.state === 'done' && last.summary ? (
            <p className="mt-1 text-xs text-muted-foreground">{last.summary}</p>
          ) : null}

          {(last.findings?.length ?? 0) > 0 && (
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {last.findings!.map((finding, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warn" />
                  <span>{finding.message}</span>
                </li>
              ))}
            </ul>
          )}

          {(revision?.log?.length ?? 0) > 1 && (
            <>
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                {historyOpen ? 'Hide' : `Show all ${revision!.log!.length} requests`}
              </button>
              {historyOpen && (
                <ul className="mt-2 space-y-1.5 border-t border-border pt-2">
                  {revision!.log!.map((entry, i) => (
                    <li key={i} className="text-xs">
                      <span className="italic text-muted-foreground">“{entry.request}”</span>
                      <span className="ml-1.5 text-ink3">— {entry.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

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
  projectId, scene, board, cameraMoves, onChange, onAskAi, targeted = false, revising = false,
}: {
  projectId: string
  scene: Scene
  board: Storyboard
  cameraMoves: string[]
  onChange: () => void
  onAskAi?: (sceneId: string) => void
  targeted?: boolean
  revising?: boolean
}) {
  const templateLabel = board.templates?.[scene.layout_template]?.label || scene.layout_template
  const slotKeys = Object.keys(scene.slots)

  // What the last revision did to THIS card, so the change is visible on the
  // board rather than only summarised at the top.
  const last = board.revision?.running ? null : board.revision?.last
  const wasAdded = last?.state === 'done' && (last.added ?? []).includes(scene.scene_id)
  const wasChanged = last?.state === 'done' && (last.changed ?? []).includes(scene.scene_id)

  const updateTransition = async (t: string) => {
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${scene.scene_id}`, { transition: t })
      await onChange()
    } catch {
      alert('Failed to update transition')
    }
  }

  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-soft transition-colors ${
      targeted ? 'border-primary' : wasAdded || wasChanged ? 'border-accent-line' : 'border-border'
    }`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-primary">
            {scene.order}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-inset px-2 py-1 text-xs font-semibold text-foreground">
            {TEMPLATE_ICON[scene.layout_template] || <LayoutGrid className="h-4 w-4" />}
            {templateLabel}
          </span>
          <span className="font-mono text-xs text-ink3">{scene.duration_seconds}s</span>
          {wasAdded ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-good">
              <Plus className="h-3 w-3" /> new
            </span>
          ) : wasChanged ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              <Wand2 className="h-3 w-3" /> updated
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {onAskAi && (
            <button
              onClick={() => onAskAi(scene.scene_id)}
              disabled={revising}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                targeted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-inset'
              }`}
              title={targeted ? 'This scene is part of your next request' : 'Ask the AI to change this scene'}
            >
              <Wand2 className="h-3 w-3" /> {targeted ? 'Selected' : 'Edit with AI'}
            </button>
          )}
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
      </div>

      <NarrationEditor
        projectId={projectId}
        sceneId={scene.scene_id}
        narration={scene.narration}
        disabled={revising}
        onChange={onChange}
      />

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
            mediaLibrary={board.media_library}
            disabled={revising}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * The scene's spoken line, editable in place.
 *
 * Safe to hand over because nothing has been spoken yet: the voiceover is
 * synthesised at render time and cached under a hash of this exact text, so
 * editing one scene re-records that scene and leaves every other wav — and
 * the credits already spent on it — alone. The card's duration is only an
 * estimate until then, which is why saving re-estimates it from the new words.
 */
function NarrationEditor({
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

/**
 * The words ON the card (as opposed to the words spoken over it). The
 * endpoint has accepted these since the storyboard shipped; nothing ever
 * offered them.
 */
function TextBlockEditor({
  projectId, sceneId, slotKey, slot, disabled = false, onChange, onDone,
}: {
  projectId: string
  sceneId: string
  slotKey: string
  slot: Slot
  disabled?: boolean
  onChange: () => void
  onDone: () => void
}) {
  const [heading, setHeading] = useState(slot.heading ?? '')
  const [bullets, setBullets] = useState<string[]>(slot.bullets?.length ? [...slot.bullets] : [''])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setBullet = (i: number, value: string) =>
    setBullets((prev) => prev.map((b, index) => (index === i ? value : b)))

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/api/explainer/projects/${projectId}/scenes/${sceneId}/slots/${slotKey}`, {
        heading,
        bullets: bullets.map((b) => b.trim()).filter(Boolean),
      })
      await onChange()
      onDone()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save this card.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-primary bg-inset p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink3">{slotKey}</div>
      <input
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
        maxLength={80}
        placeholder="Heading"
        className="mb-1.5 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-semibold text-foreground outline-none placeholder:text-ink3 focus:border-primary"
      />
      <div className="space-y-1">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-primary">›</span>
            <input
              value={bullet}
              onChange={(e) => setBullet(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bullets.length < 5) setBullets((prev) => [...prev, ''])
              }}
              maxLength={160}
              placeholder="A line on the card"
              className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
            />
            <button
              onClick={() => setBullets((prev) => prev.filter((_, index) => index !== i))}
              className="shrink-0 text-ink3 hover:text-foreground"
              title="Remove this line"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setBullets((prev) => [...prev, ''])}
          disabled={bullets.length >= 5}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> Add line {bullets.length >= 5 ? '(5 max)' : ''}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDone}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-card"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || disabled}
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
function MediaLibraryPanel({
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

function SlotCard({
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
