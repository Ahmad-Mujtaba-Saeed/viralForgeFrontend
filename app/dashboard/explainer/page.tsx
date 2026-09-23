'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import {
  ChevronDown, ChevronUp, Clock, Crop, Film, Loader2, Play, Sparkles, Square, Volume2, Wand2, Zap,
} from 'lucide-react'
import { MusicPicker } from '@/components/create/music-picker'
import { useBilling } from '@/hooks/useBilling'
import type { ExplainerDurationTier } from '@/store/billingSlice'

/**
 * The explainer brief — restyled to the editor's furniture.
 *
 * This page and the storyboard editor are one continuous task, and they used
 * to look like two different products: a centred form here, a three-pane app
 * next door. Everything below is the editor's own vocabulary — the same
 * header, the same 380px inspector, the same accordion sections and the same
 * footer CTA — so crossing from the brief into the storyboard changes what is
 * on screen and not where anything lives.
 *
 * Every control the form had is still here, wired to the same endpoints: the
 * title, the guide, the script with its tone and AI writer, the aspect, the
 * length, the narrator voice with its audition, and the music picker.
 */

const ASPECT_RATIOS = [
  { value: '16:9', label: 'Landscape 16:9' },
  { value: '9:16', label: 'Vertical 9:16' },
  { value: '1:1', label: 'Square 1:1' },
]

const TONES = [
  { value: '', label: 'Auto' },
  { value: 'informative', label: 'Informative' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'friendly', label: 'Friendly' },
]

/** The inspector's collapsible section — the editor's `Section`, verbatim. */
function Section({
  id, icon, title, summary, open, onToggle, children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  summary: string
  open: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={`flex w-full items-center justify-between gap-2.5 px-4 py-3 text-left transition-colors hover:bg-inset ${
          open ? 'bg-inset/60' : 'bg-transparent'
        }`}
      >
        <span className="flex items-center gap-2.5 text-[13px] font-bold text-foreground">
          <span className="text-primary [&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
          {title}
        </span>
        <span className="flex items-center gap-2">
          <span className="max-w-[150px] truncate font-mono text-[11px] text-ink3">{summary}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-ink3" /> : <ChevronDown className="h-3.5 w-3.5 text-ink3" />}
        </span>
      </button>
      {open && <div className="flex flex-col gap-3 px-4 pb-4 pt-0.5">{children}</div>}
    </div>
  )
}

/** `label · · · control` — the shape every settings row in the design takes. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** A native select wearing the design's value chip. */
const chipSelect =
  'max-w-[190px] truncate rounded-lg border border-border bg-inset px-2.5 py-1 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-card focus:border-primary'

const fieldCls =
  'w-full resize-y rounded-xl border border-border bg-inset px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-ink3 focus:border-primary'

const sectionLabel = 'text-[11px] font-bold uppercase tracking-[0.07em] text-ink3'

const DIRECTION_LINE =
  /^\s*[[(]?\s*(on[\s-]?screen|visuals?|b[\s-]?roll|shot|cut to|graphics?|text on screen|lower third|title card|end screen|sfx|sound|music)\s*[:\-—–]/i
const PAUSE_LINE = /^\s*[[(]\s*(beat|pause|silence|breath)\b[^\])]*[\])]\s*$/i
const HEADING_LINE =
  /^\s*(#{1,6}\s+|(chapter|part|section|act|segment)\s+[\dIVX]+\b|(cold open|intro|introduction|outro|conclusion|recap)\b)/i
const TIMESTAMP_RANGE = /\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/

/** Words the narrator will actually say — the same lines the backend's ScriptBeats drops are not counted. */
function spokenWordCount(script: string): number {
  return script
    .split(/\r?\n/)
    .filter(
      (line) =>
        !DIRECTION_LINE.test(line) &&
        !PAUSE_LINE.test(line) &&
        !HEADING_LINE.test(line) &&
        !(TIMESTAMP_RANGE.test(line) && line.trim().split(/\s+/).length <= 14)
    )
    .join(' ')
    .replace(/\[[^\]]{0,80}\]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

// Mirrors config/credits.php so the page works before /billing/me answers;
// the server's list replaces it as soon as it arrives.
const FALLBACK_TIERS: Record<string, ExplainerDurationTier> = {
  short: { label: 'Up to 5 min', max_seconds: 300, cost: 100 },
  medium: { label: 'Up to 10 min', max_seconds: 600, cost: 250 },
  long: { label: 'Up to 15 min', max_seconds: 900, cost: 350 },
}

export default function ExplainerCreatePage() {
  const router = useRouter()
  const { credits, hasSubscription, explainerPricing, fetchBilling } = useBilling()
  const tiers = explainerPricing?.tiers ?? FALLBACK_TIERS
  const [tier, setTier] = useState<string>('short')
  const [title, setTitle] = useState('')
  // The user's brief for the script writer — how this video should go, not
  // what it is about. Sent both to the generator and to the project, because
  // the storyboard composer rewrites the narration and needs it too.
  const [guide, setGuide] = useState('')
  const [script, setScript] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [targetSeconds, setTargetSeconds] = useState(60)
  const [tone, setTone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({ format: true, sound: true })
  const toggleSection = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }))

  // Narrator voice — options follow the admin-selected TTS engine.
  const [voices, setVoices] = useState<Record<string, string>>({})
  const [voice, setVoice] = useState('')
  // The user's own cloned voices (My Voices), listed above the stock narrators.
  const [cloneVoices, setCloneVoices] = useState<Record<string, string>>({})
  const [previewing, setPreviewing] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Background music: auto (match mood) by default, or a category — with an
  // auditionable track list and a volume slider, like every other template.
  const [musicOptions, setMusicOptions] = useState<Record<string, string>>({
    none: 'None',
    auto: 'Auto — match mood',
  })
  const [musicCategory, setMusicCategory] = useState('auto')
  const [musicTrackId, setMusicTrackId] = useState('')
  const [musicVolume, setMusicVolume] = useState(0.09)

  // The header's credits pill reads the billing store, which nothing on this
  // route populates on its own.
  useEffect(() => {
    fetchBilling().catch(() => {})
  }, [fetchBilling])

  useEffect(() => {
    api
      .get('/api/tts/voices', { params: { template: 'ai_explainer_video' } })
      .then((res) => {
        setVoices(res.data?.voices ?? {})
        setCloneVoices(res.data?.clones ?? {})
        setVoice(res.data?.default ?? '')
      })
      .catch(() => {})
    api
      .get('/api/music/options')
      .then((res) => {
        const categories: string[] = res.data?.categories ?? []
        setMusicOptions({
          none: 'None',
          auto: 'Auto — match mood',
          ...Object.fromEntries(
            categories.map((c) => [c, c.charAt(0).toUpperCase() + c.slice(1)])
          ),
        })
      })
      .catch(() => {})
    return () => {
      previewAudioRef.current?.pause()
      previewAudioRef.current = null
    }
  }, [])

  const handlePreviewVoice = async () => {
    if (previewing) {
      previewAudioRef.current?.pause()
      previewAudioRef.current = null
      setPreviewing(false)
      return
    }
    if (!voice) return
    setPreviewing(true)
    try {
      const res = await api.post('/api/tts/preview', { voice })
      const url: string | undefined = res.data?.url
      if (!url) throw new Error('No preview URL')
      const src = url.startsWith('http') ? url : `${api.defaults.baseURL ?? ''}${url}`
      const audio = new Audio(src)
      previewAudioRef.current = audio
      audio.onended = () => setPreviewing(false)
      audio.onerror = () => setPreviewing(false)
      await audio.play()
    } catch {
      setPreviewing(false)
    }
  }

  const handleGenerateScript = async () => {
    if (title.trim().length < 3 || generating) return
    if (script.trim().length >= 10 && !window.confirm('Replace your current script with an AI-written one?')) {
      return
    }
    setError(null)
    setGenerating(true)
    try {
      const res = await api.post('/api/explainer/generate-script', {
        title: title.trim(),
        ...(guide.trim() ? { guide: guide.trim() } : {}),
        target_seconds: targetSeconds,
        aspect_ratio: aspectRatio,
        ...(tone ? { tone } : {}),
      })
      setScript(res.data?.data?.script ?? '')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Script generation failed — you can write the script yourself.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (title.trim().length < 2 || script.trim().length < 10) {
      setError('Add a title and a script of at least a few sentences.')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/explainer/projects', {
        // The project title column caps at 255 — a long pasted problem
        // statement still works, it just gets a trimmed display title.
        title: title.trim().slice(0, 255),
        script: script.trim(),
        // Kept with the project: the storyboard composer rewrites narration
        // from the script, so it needs the guide too or the user's opening
        // ("exercise and question number first") is lost on the board.
        ...(guide.trim() ? { guide: guide.trim() } : {}),
        aspect_ratio: aspectRatio,
        target_seconds: targetSeconds,
        duration_tier: tier,
        ...(voice ? { tts_voice: voice } : {}),
        music_category: musicCategory,
        ...(musicTrackId ? { music_track_id: musicTrackId } : {}),
        music_volume: musicVolume,
      })
      const id = res.data?.data?.id
      fetchBilling().catch(() => {})
      router.push(`/dashboard/explainer/editor?id=${id}`)
    } catch (err: any) {
      if (err.response?.status === 402) {
        router.push('/dashboard/billing')
        return
      }
      setError(err.response?.data?.message || 'Failed to create project')
      setSubmitting(false)
    }
  }

  // Only what the narrator will SAY: stage directions ("ON SCREEN: ..."),
  // pause marks and chapter headings are never spoken (the backend's
  // ScriptBeats strips the same lines), so they must not inflate the length.
  const words = useMemo(() => spokenWordCount(script), [script])
  // ~2.5 words a second is the pace the storyboard's own duration estimate
  // uses, so the two agree about how long a script runs.
  const spoken = Math.round(words / 2.5)
  // Past a minute "240s" stops being a length anyone can picture, and the
  // slider now reaches six of them.
  const clock = (seconds: number) =>
    seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  const activeTier = tiers[tier] ?? Object.values(tiers)[0]
  const tierMax = activeTier?.max_seconds ?? 300
  const cost = activeTier?.cost ?? 100
  const canAfford = hasSubscription && credits >= cost
  const ready = title.trim().length >= 2 && script.trim().length >= 10
  const chooseTier = (key: string) => {
    setTier(key)
    const max = tiers[key]?.max_seconds ?? 300
    // A longer option starts the writer at a length that uses it; a shorter
    // one pulls the target back inside its limit.
    setTargetSeconds((current) => (current > max ? max : current))
  }
  // Past the tier's limit the script itself is too long for what was chosen.
  const scriptTooLong = spoken > tierMax * 1.15
  const aspectLabel = ASPECT_RATIOS.find((r) => r.value === aspectRatio)?.label ?? aspectRatio

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1800px] flex-col gap-3.5">
      {/* The editor's header, one step earlier. */}
      <header className="flex flex-none flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border pb-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="inline-flex items-center gap-2 rounded-lg border border-accent-line bg-accent-soft px-2.5 py-1.5 text-[12px] font-bold tracking-[0.02em] text-primary">
            <Wand2 className="h-3.5 w-3.5" />
            AI EXPLAINER
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-[17px] font-semibold tracking-tight text-foreground">
              {title.trim() || 'New explainer video'}
            </h1>
            <div className="font-mono text-[12px] text-ink3">
              {words > 0 ? `${words} words · ~${clock(spoken)}` : `target ~${clock(targetSeconds)}`} · {aspectRatio} · draft
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            title={hasSubscription ? `${credits} credits · this storyboard costs ${cost}` : 'Subscribe to create videos'}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-semibold text-muted-foreground"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            {credits.toLocaleString()}
          </span>
          <button
            type="submit"
            disabled={submitting || !ready || !canAfford}
            title={
              !ready ? 'Add a title and a script first' : !canAfford ? `Needs ${cost} credits — you have ${credits}` : undefined
            }
            className="inline-flex h-[34px] items-center gap-1.5 rounded-lg bg-foreground px-4 text-[13px] font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
            {submitting ? 'Analyzing…' : `Generate storyboard · ${cost}`}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* The brief. */}
        <section className="flex min-w-0 flex-col gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <label htmlFor="explainer-title" className={`${sectionLabel} mb-1.5 block`}>
              Title or problem to explain
            </label>
            <textarea
              id="explainer-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={'GTA V vs GTA VI — Map Comparison · or paste a problem: "Solve x² + 5x − 24 = 0 by factoring"'}
              className={fieldCls}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              A topic makes a normal explainer. A math/physics question (optionally with your solving hints) makes a
              worked-solution video with native equation, geometry and graph scenes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <label htmlFor="explainer-guide" className={`${sectionLabel} mb-1.5 block`}>
              Guide for the AI <span className="font-normal normal-case tracking-normal">— optional</span>
            </label>
            <textarea
              id="explainer-guide"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={
                'Tell the AI how this video should go. e.g. "Start by showing the chapter name — Quadratic Equations. Then read the question out. Solve it by factoring, not the formula. Finish by checking the answer back in the equation."'
              }
              className={fieldCls}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              Your directions for the script — what to open with, what order to teach in, which method to use. Leave it
              blank and the AI decides on its own.
            </p>
          </div>

          {/* The script is this page's stage: the thing the rest is about. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-[13px] font-bold text-foreground">
                <Sparkles className="h-[15px] w-[15px] text-primary" />
                Script
                <span className="font-mono text-[11px] font-normal text-ink3">
                  {words > 0 ? `${words} words · ~${spoken}s spoken` : 'empty'}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor="explainer-tone" className="sr-only">
                  Tone
                </label>
                <select
                  id="explainer-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={chipSelect}
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      Tone: {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleGenerateScript}
                  disabled={title.trim().length < 3 || generating}
                  title={title.trim().length < 3 ? 'Add a title first' : 'Write the script with AI'}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  {generating ? 'Writing…' : 'Generate with AI'}
                </button>
              </div>
            </div>
            <label htmlFor="explainer-script" className="sr-only">
              Script
            </label>
            <textarea
              id="explainer-script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={14}
              placeholder="Paste or write your script here — or fill in the title and guide above and click Generate with AI."
              className="min-h-[260px] w-full flex-1 resize-y border-0 bg-transparent px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-ink3"
            />
            <p className="border-t border-border px-4 py-2 text-[11px] leading-snug text-muted-foreground">
              The AI splits this into scenes and decides where pictures go and where bullet points do. Generated scripts
              are fully editable — here, and on the storyboard afterwards.
            </p>
          </div>
        </section>

        {/* The inspector, matching the editor's rail. */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Section
              id="format"
              icon={<Crop />}
              title="Format"
              summary={`${aspectRatio} · ${activeTier?.label ?? ''} · ~${clock(targetSeconds)}`}
              open={Boolean(open.format)}
              onToggle={toggleSection}
            >
              <Row label="Aspect ratio">
                <label htmlFor="explainer-aspect" className="sr-only">
                  Aspect ratio
                </label>
                <select
                  id="explainer-aspect"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className={chipSelect}
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Row>
              <div>
                <span className="mb-1.5 block text-[13px] text-muted-foreground">Video duration</span>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Video duration">
                  {Object.entries(tiers).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={tier === key}
                      onClick={() => chooseTier(key)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 text-center transition-colors ${
                        tier === key
                          ? 'border-primary bg-accent-soft text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-inset'
                      }`}
                    >
                      <span className="text-[12px] font-semibold leading-tight">{t.label}</span>
                      <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-primary">
                        <Zap className="h-3 w-3" />
                        {t.cost}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                  Credits are charged when the storyboard is generated. The first render is free; each re-render costs{' '}
                  {explainerPricing?.rerender_cost ?? 100}. AI pictures you ask for cost {explainerPricing?.ai_image_cost ?? 25}{' '}
                  each.
                </p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" /> Target length
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">{clock(targetSeconds)}</span>
                </div>
                <label htmlFor="explainer-length" className="sr-only">
                  Target length in seconds
                </label>
                <input
                  id="explainer-length"
                  type="range"
                  min={20}
                  max={tierMax}
                  step={10}
                  value={targetSeconds}
                  onChange={(e) => setTargetSeconds(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  What the AI writer aims for, up to {clock(tierMax)}. The real length comes from the narration once it is
                  recorded.
                </p>
                {scriptTooLong && (
                  <p className="mt-1 text-[11px] font-semibold text-primary">
                    This script runs about {clock(spoken)} — longer than {activeTier?.label.toLowerCase()}. Pick a longer
                    duration or trim it.
                  </p>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{aspectLabel}</p>
            </Section>

            <Section
              id="sound"
              icon={<Volume2 />}
              title="Sound"
              summary={
                cloneVoices[voice] ?? (voices[voice] ? String(voices[voice]).split(' ')[0] : 'Default voice')
              }
              open={Boolean(open.sound)}
              onToggle={toggleSection}
            >
              {Object.keys(voices).length > 0 && (
                <>
                  <Row label="Narrator voice">
                    <span className="inline-flex items-center gap-1.5">
                      <label htmlFor="explainer-voice" className="sr-only">
                        Narrator voice
                      </label>
                      <select
                        id="explainer-voice"
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        className={chipSelect}
                      >
                        {Object.keys(cloneVoices).length > 0 && (
                          <optgroup label="My voices">
                            {Object.entries(cloneVoices).map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Narrators">
                          {Object.entries(voices).map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <button
                        type="button"
                        onClick={handlePreviewVoice}
                        disabled={!voice}
                        title={previewing ? 'Stop preview' : 'Play a short voice sample'}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-inset disabled:opacity-50"
                      >
                        {previewing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                    </span>
                  </Row>
                  <p className="text-[11px] text-muted-foreground">
                    Narrates every scene. Press play to hear a sample. Clone your own voice under My Voices.
                  </p>
                </>
              )}

              <MusicPicker
                options={musicOptions}
                category={musicCategory}
                trackId={musicTrackId}
                volume={musicVolume}
                onChange={(patch) => {
                  if (patch.music_category !== undefined) setMusicCategory(patch.music_category)
                  if (patch.music_track_id !== undefined) setMusicTrackId(patch.music_track_id)
                  if (patch.music_volume !== undefined) setMusicVolume(patch.music_volume)
                }}
              />
            </Section>
          </div>

          <div className="flex flex-none flex-col gap-2.5 border-t border-border p-4">
            {error && (
              <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-[12px] leading-snug text-primary">
                {error}
              </div>
            )}
            {!ready && !error && (
              <p className="text-[12px] leading-snug text-muted-foreground">
                Add a title and a script of at least a few sentences.
              </p>
            )}
            {ready && !canAfford && (
              <p className="text-[12px] leading-snug text-muted-foreground">
                {hasSubscription
                  ? `This storyboard needs ${cost} credits — you have ${credits}.`
                  : 'Subscribe to generate explainer videos.'}{' '}
                <a href="/dashboard/billing" className="font-semibold text-primary underline">
                  {hasSubscription ? 'Get credits' : 'View plans'}
                </a>
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !ready || !canAfford}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {submitting ? 'Analyzing…' : `Generate storyboard · ${cost} credits`}
            </button>
            <span className="text-center text-[11px] text-ink3">
              {activeTier?.label} · {cost} credits now · first render free
            </span>
          </div>
        </aside>
      </div>
    </form>
  )
}
