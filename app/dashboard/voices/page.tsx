'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Loader2, Mic, Play, Sparkles, Square, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Status = 'queued' | 'processing' | 'ready' | 'failed'
type EngineState = 'ready' | 'loading' | 'offline' | 'error' | 'disabled'

interface Voice {
  id: number
  voice_id: string
  name: string
  status: Status
  error: string | null
  warnings: string[]
  speech_seconds: number
  created_at: string | null
  sample_url: string | null
  reference_url: string | null
}

interface Clip {
  id: number
  voice_id: number
  voice_name: string | null
  text: string
  status: Status
  error: string | null
  duration_seconds: number
  created_at: string | null
  audio_url: string | null
  download_url: string | null
}

interface Limits {
  max_voices: number
  max_kilobytes: number
  max_clip_chars: number
  accept: string
}

const RECORDING_TIPS = [
  '15–30 seconds of you talking naturally. Reading a paragraph aloud works well.',
  'Only your voice, in a quiet room: no music, TV, fan or echo.',
  'Speak in the tone you want the clone to use, at a steady distance from the mic.',
  'A phone voice memo is fine. Avoid holding it so close that it distorts.',
]

const ENGINE_NOTICE: Partial<Record<EngineState, string>> = {
  loading:
    'The voice engine is starting up (its first start downloads the model). New voices will be cloned as soon as it is ready.',
  offline: 'The voice engine is not running right now. Uploads wait in line and are cloned once it is back.',
  error: 'The voice engine could not start. Voices will be cloned once an admin has fixed it.',
}

const isBusy = (status: Status) => status === 'queued' || status === 'processing'

/** Signed media URLs come back relative to the API. */
const mediaSrc = (url: string) => (url.startsWith('http') ? url : `${api.defaults.baseURL ?? ''}${url}`)

function fmtDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
}

function apiError(err: any, fallback: string): string {
  const data = err?.response?.data
  const fieldError = data?.errors ? (Object.values(data.errors).flat()[0] as string | undefined) : undefined
  return fieldError || data?.message || fallback
}

function StatusBadge({ status, busyLabel }: { status: Status; busyLabel: string }) {
  if (isBusy(status)) {
    return (
      <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-inset px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {status === 'queued' ? 'Waiting' : busyLabel}
      </span>
    )
  }
  if (status === 'ready') {
    return (
      <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
        <CheckCircle2 className="h-3 w-3" />
        Ready
      </span>
    )
  }
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-inset px-2.5 py-1 text-[11px] font-semibold text-warn">
      <AlertTriangle className="h-3 w-3" />
      Failed
    </span>
  )
}

export default function VoicesPage() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [engineState, setEngineState] = useState<EngineState>('ready')
  const [limits, setLimits] = useState<Limits | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [clips, setClips] = useState<Clip[]>([])

  // Clone form
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Text to speech
  const [ttsVoiceId, setTtsVoiceId] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [generating, setGenerating] = useState(false)

  // Playback of samples / recordings (clips use native players)
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [pendingDelete, setPendingDelete] = useState<{ kind: 'voice' | 'clip'; id: number; label: string } | null>(
    null
  )

  const load = useCallback(async () => {
    try {
      const [voiceRes, clipRes] = await Promise.all([api.get('/api/voices'), api.get('/api/voices/clips')])
      setEnabled(Boolean(voiceRes.data?.enabled))
      setEngineState(voiceRes.data?.engine?.state ?? 'offline')
      setLimits(voiceRes.data?.limits ?? null)
      setVoices(voiceRes.data?.voices ?? [])
      setClips(clipRes.data?.clips ?? [])
    } catch {
      // Keep the last good state; a toast on every poll would only be noise.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const readyVoices = useMemo(() => voices.filter((v) => v.status === 'ready'), [voices])
  const anyBusy = voices.some((v) => isBusy(v.status)) || clips.some((c) => isBusy(c.status))

  // Poll only while something is cloning or being spoken.
  useEffect(() => {
    if (!anyBusy) return
    const timer = window.setInterval(() => void load(), 4000)
    return () => window.clearInterval(timer)
  }, [anyBusy, load])

  useEffect(() => {
    if (ttsVoiceId !== null && readyVoices.some((v) => v.id === ttsVoiceId)) return
    setTtsVoiceId(readyVoices[0]?.id ?? null)
  }, [readyVoices, ttsVoiceId])

  // Local preview of the chosen file, so a wrong pick is caught before upload.
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
  }, [filePreview])

  const stopAudio = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlaying(null)
  }

  useEffect(() => () => stopAudio(), [])

  const toggleAudio = (key: string, url: string | null) => {
    if (!url) return
    if (playing === key) {
      stopAudio()
      return
    }
    stopAudio()
    const audio = new Audio(mediaSrc(url))
    audioRef.current = audio
    setPlaying(key)
    const done = () => setPlaying((p) => (p === key ? null : p))
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  }

  const pickFile = (picked: File | undefined | null) => {
    if (!picked) return
    if (limits && picked.size > limits.max_kilobytes * 1024) {
      toast.error(`That file is too large (max ${Math.round(limits.max_kilobytes / 1024)} MB).`)
      return
    }
    setFile(picked)
    if (!name.trim()) setName(picked.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 80))
  }

  const atLimit = Boolean(limits && voices.length >= limits.max_voices)
  const canClone = enabled && !atLimit && Boolean(file) && name.trim().length > 0 && consent && !uploading

  const submitVoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canClone || !file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('name', name.trim())
    fd.append('file', file)
    fd.append('consent', '1')
    try {
      const res = await api.post('/api/voices', fd)
      toast.success(res.data?.message ?? 'Cloning your voice.')
      setFile(null)
      setName('')
      setConsent(false)
      await load()
    } catch (err) {
      toast.error(apiError(err, 'That recording could not be uploaded.'))
    } finally {
      setUploading(false)
    }
  }

  const generate = async () => {
    if (!ttsVoiceId || !text.trim() || generating) return
    setGenerating(true)
    try {
      await api.post('/api/voices/clips', { voice_id: ttsVoiceId, text: text.trim() })
      await load()
    } catch (err) {
      toast.error(apiError(err, 'Could not start generating that audio.'))
    } finally {
      setGenerating(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const { kind, id } = pendingDelete
    setPendingDelete(null)
    stopAudio()
    try {
      await api.delete(kind === 'voice' ? `/api/voices/${id}` : `/api/voices/clips/${id}`)
      toast.success(kind === 'voice' ? 'Voice deleted.' : 'Clip deleted.')
      await load()
    } catch (err) {
      toast.error(apiError(err, 'That could not be deleted.'))
    }
  }

  const useVoiceForSpeech = (voiceId: number) => {
    setTtsVoiceId(voiceId)
    document.getElementById('tts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const PlayButton = ({ id, url, label }: { id: string; url: string | null; label: string }) => (
    <button
      type="button"
      onClick={() => toggleAudio(id, url)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors',
        playing === id
          ? 'border-primary bg-accent-soft text-primary'
          : 'border-border bg-card text-foreground hover:bg-inset'
      )}
    >
      {playing === id ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      {label}
    </button>
  )

  const cardCls = 'rounded-2xl border border-border bg-card p-5 shadow-soft'
  const inputCls =
    'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-ink3 focus:border-primary'
  const maxChars = limits?.max_clip_chars ?? 5000

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">My Voices</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Clone your own voice from a short recording, then turn any text into speech that sounds like you. Your
          voices are private to your account.
        </p>
      </div>

      {!enabled ? (
        <div className={cn(cardCls, 'text-sm text-muted-foreground')}>Voice cloning is currently turned off.</div>
      ) : (
        ENGINE_NOTICE[engineState] && (
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-inset/60 px-4 py-3 text-[13px] text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warn" />
            {ENGINE_NOTICE[engineState]}
          </div>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clone a voice */}
        <section className={cardCls}>
          <h2 className="font-display text-[17px] font-semibold text-foreground">Clone a new voice</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Upload a clean recording of the voice you want.</p>

          <form onSubmit={submitVoice} className="mt-4 space-y-4">
            <div>
              <label htmlFor="voice-name" className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Voice name
              </label>
              <input
                id="voice-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="e.g. My narration voice"
                className={inputCls}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-foreground">Recording</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  pickFile(e.dataTransfer.files?.[0])
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-left transition-colors',
                  dragging ? 'border-primary bg-accent-soft' : 'border-border bg-inset/40 hover:border-primary/50'
                )}
              >
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Upload className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {file ? file.name : 'Choose or drop an audio file'}
                  </span>
                  <span className="block text-[11.5px] text-ink3">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                      : 'WAV, MP3, M4A, OGG, FLAC or WEBM · 15–30 seconds of talking'}
                  </span>
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={limits?.accept ?? 'audio/*'}
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {filePreview && <audio controls src={filePreview} className="mt-2.5 h-9 w-full" />}
            </div>

            <ul className="space-y-1.5 rounded-xl bg-inset/50 px-4 py-3">
              {RECORDING_TIPS.map((tip) => (
                <li key={tip} className="flex gap-2 text-[12px] leading-snug text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                  {tip}
                </li>
              ))}
            </ul>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[var(--primary)]"
              />
              <span className="text-[12.5px] leading-snug text-foreground">
                This is my own voice, or I have the speaker&apos;s permission to clone it.
              </span>
            </label>

            <button
              type="submit"
              disabled={!canClone}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Clone this voice'}
            </button>
            {atLimit && (
              <p className="text-[12px] text-warn">
                You have reached {limits?.max_voices} voices. Delete one to clone another.
              </p>
            )}
          </form>
        </section>

        {/* Your voices */}
        <section className={cardCls}>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[17px] font-semibold text-foreground">Your voices</h2>
            {limits && (
              <span className="text-[12px] tabular-nums text-ink3">
                {voices.length} / {limits.max_voices}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your voices…
              </div>
            ) : voices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                No voices yet. Clone one with a short recording and it will appear here.
              </div>
            ) : (
              voices.map((voice) => (
                <div key={voice.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-accent-soft text-primary">
                      <Mic className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[14px] font-semibold text-foreground">{voice.name}</p>
                        <StatusBadge status={voice.status} busyLabel="Cloning" />
                      </div>
                      <p className="text-[11.5px] text-ink3">
                        {[voice.speech_seconds > 0 ? `${voice.speech_seconds}s of speech` : '', fmtDate(voice.created_at)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>

                  {voice.status === 'failed' && voice.error && (
                    <p className="mt-2 text-[12px] leading-snug text-warn">{voice.error}</p>
                  )}
                  {voice.status === 'ready' && voice.warnings.length > 0 && (
                    <ul className="mt-2.5 space-y-1 rounded-lg bg-inset/60 px-3 py-2">
                      {voice.warnings.map((warning) => (
                        <li key={warning} className="flex gap-1.5 text-[11.5px] leading-snug text-muted-foreground">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-warn" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {voice.sample_url && <PlayButton id={`sample-${voice.id}`} url={voice.sample_url} label="Hear clone" />}
                    {voice.reference_url && (
                      <PlayButton id={`reference-${voice.id}`} url={voice.reference_url} label="Your recording" />
                    )}
                    {voice.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => useVoiceForSpeech(voice.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-primary hover:bg-accent-soft"
                      >
                        Use for text to speech
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Delete ${voice.name}`}
                      title="Delete voice"
                      onClick={() => setPendingDelete({ kind: 'voice', id: voice.id, label: voice.name })}
                      className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-ink3 transition-colors hover:bg-inset hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Text to speech */}
      <section id="tts" className={cardCls}>
        <h2 className="font-display text-[17px] font-semibold text-foreground">Text to speech</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Type anything and hear it in your cloned voice. Your voices also appear in the narrator picker of every
          template.
        </p>

        {readyVoices.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
            Clone a voice first. Once it is ready you can type text for it to read.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {readyVoices.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setTtsVoiceId(voice.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-all',
                    ttsVoiceId === voice.id
                      ? 'border-primary bg-accent-soft text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-inset'
                  )}
                >
                  <Mic className="h-3.5 w-3.5" />
                  {voice.name}
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, maxChars))}
              rows={6}
              placeholder="Paste a script or type what you want to hear. For a natural touch you can add [laugh], [sigh] or [chuckle]."
              className={cn(inputCls, 'resize-y leading-relaxed')}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[12px] tabular-nums text-ink3">
                {text.length} / {maxChars} characters
              </span>
              <button
                type="button"
                onClick={generate}
                disabled={!ttsVoiceId || !text.trim() || generating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate speech
              </button>
            </div>
          </div>
        )}

        {clips.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <h3 className="text-[13px] font-semibold text-foreground">Recent audio</h3>
            {clips.some((c) => isBusy(c.status)) && (
              <p className="text-[12px] text-ink3">
                Longer text takes a while. You can leave this page; it keeps working in the background.
              </p>
            )}
            {clips.map((clip) => (
              <div key={clip.id} className="rounded-xl border border-border p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] text-ink3">
                    {[clip.voice_name, fmtDuration(clip.duration_seconds), fmtDate(clip.created_at)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={clip.status} busyLabel="Speaking" />
                    <button
                      type="button"
                      aria-label="Delete clip"
                      title="Delete clip"
                      onClick={() => setPendingDelete({ kind: 'clip', id: clip.id, label: 'this clip' })}
                      className="grid h-7 w-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-inset hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-foreground">{clip.text}</p>
                {clip.status === 'failed' && clip.error && (
                  <p className="mt-1.5 text-[12px] text-warn">{clip.error}</p>
                )}
                {clip.status === 'ready' && clip.audio_url && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <audio controls preload="none" src={mediaSrc(clip.audio_url)} className="h-9 min-w-0 flex-1" />
                    {clip.download_url && (
                      <a
                        href={mediaSrc(clip.download_url)}
                        title="Download WAV"
                        aria-label="Download WAV"
                        className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-inset"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === 'voice' ? `Delete “${pendingDelete.label}”?` : 'Delete this clip?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === 'voice'
                ? 'The voice, your recording and every clip made with it are removed for good. Videos that already used it keep their audio; new renders fall back to a stock narrator.'
                : 'This audio is removed for good.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
