'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { Sparkles, Loader2, Wand2, Play, Square } from 'lucide-react'

const ASPECT_RATIOS = [
  { value: '16:9', label: 'Landscape 16:9' },
  { value: '9:16', label: 'Vertical 9:16' },
  { value: '1:1', label: 'Square 1:1' },
]

const TONES = [
  { value: '', label: 'Tone: Auto' },
  { value: 'informative', label: 'Informative' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'friendly', label: 'Friendly' },
]

export default function ExplainerCreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [script, setScript] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [targetSeconds, setTargetSeconds] = useState(60)
  const [tone, setTone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Narrator voice — options follow the admin-selected TTS engine.
  const [voices, setVoices] = useState<Record<string, string>>({})
  const [voice, setVoice] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    api
      .get('/api/tts/voices', { params: { template: 'ai_explainer_video' } })
      .then((res) => {
        setVoices(res.data?.voices ?? {})
        setVoice(res.data?.default ?? '')
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
        title: title.trim(),
        script: script.trim(),
        aspect_ratio: aspectRatio,
        target_seconds: targetSeconds,
        ...(voice ? { tts_voice: voice } : {}),
      })
      const id = res.data?.data?.id
      router.push(`/dashboard/explainer/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">AI Explainer Video</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Write a script. AI breaks it into scenes and picks layouts; you upload visuals; it renders an edited video.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="GTA V vs GTA VI — Map Comparison"
            className={inputCls}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-[13px] font-semibold text-foreground">Script</label>
            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={title.trim().length < 3 || generating}
                title={title.trim().length < 3 ? 'Add a title first' : 'Write the script with AI'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent-line bg-accent-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-accent-soft/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {generating ? 'Writing…' : 'Generate with AI'}
              </button>
            </div>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            placeholder="Paste or write your script here — or add a title and click Generate with AI."
            className={`${inputCls} resize-y leading-relaxed`}
          />
          <p className="mt-1.5 text-xs text-ink3">
            The AI will split this into scenes and decide where images vs. bullet points go. Generated scripts are fully
            editable before you continue.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-foreground">Aspect ratio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={inputCls}>
              {ASPECT_RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-foreground">
              Target length: <span className="text-primary">{targetSeconds}s</span>
            </label>
            <input
              type="range"
              min={20}
              max={180}
              step={10}
              value={targetSeconds}
              onChange={(e) => setTargetSeconds(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </div>
        </div>

        {Object.keys(voices).length > 0 && (
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-foreground">Narrator voice</label>
            <div className="flex items-center gap-2">
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className={inputCls}>
                {Object.entries(voices).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handlePreviewVoice}
                disabled={!voice}
                title={previewing ? 'Stop preview' : 'Play a short voice sample'}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary transition-colors hover:border-primary/50 disabled:opacity-50"
              >
                {previewing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink3">Narrates every scene. Press play to hear a sample.</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {submitting ? 'Analyzing…' : 'Generate Storyboard'}
        </button>
      </form>
    </div>
  )
}
