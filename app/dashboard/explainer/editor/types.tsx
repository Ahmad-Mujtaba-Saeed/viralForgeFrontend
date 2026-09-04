import type * as React from 'react'
import {
  Square, Columns2, Rows2, PanelRight, PanelTop, Swords, BarChart3, Sigma, ListChecks,
  Grid3x3, BookMarked, History, Workflow, ArrowLeftRight, Trophy, Gauge, Quote,
  Smartphone, Images, LayoutGrid, Wand2, MapPin, Newspaper, Calculator, Triangle,
  TrendingUp, Route,
} from 'lucide-react'

export interface Slot {
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
export interface MediaProvider {
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
export interface MediaHit {
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
export interface Scene {
  scene_id: string
  order: number
  duration_seconds: number
  narration: string
  layout_template: string
  transition: string
  slots: Record<string, Slot>
}
export interface Theme {
  name: string
  label: string
  bg_from: string
  bg_to: string
  accent: string
  accent2: string
  text: string
  muted: string
}
export interface Storyboard {
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
  /** Registry transition_meanings — the one-line editorial sense of a cut. */
  transition_meanings?: Record<string, string>
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
  // Smoothness: the render clock, and the camera shutter on fast flights.
  render_fps?: number
  render_fps_options?: number[]
  motion_blur?: boolean
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

export interface MusicTrack {
  id: string
  title: string
  duration: number
  url: string
}

export interface LintItem {
  severity: 'error' | 'warn' | 'info'
  code: string
  scene_id?: string | null
  message: string
}
export interface LintReportData {
  items: LintItem[]
  counts: { error: number; warn: number; info: number }
  checked_at?: string
}

export interface RevisionResult {
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
export interface RevisionData {
  running: boolean
  request?: string | null
  last?: RevisionResult | null
  log?: { at: string; request: string; summary: string; state: string }[]
  count?: number
  max_touched?: number
}

export const COMPOSITION_LABELS: Record<string, string> = {
  hybrid: 'Hybrid (AI Auto)',
  canvas_journey: 'Canvas Journey',
  slides: 'Slides',
  math_board: 'Math Board',
}

export const TEMPLATE_ICON: Record<string, React.ReactNode> = {
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
