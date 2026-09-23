'use client'

import * as React from 'react'
import api from '@/lib/axios'
import { Loader2, Play, Square } from 'lucide-react'

/**
 * VoicePicker — change the narrator after the storyboard exists. The same
 * list and audition as the create page (stock narrators for the active TTS
 * engine, plus the user's own cloned voices). Narration is recorded at
 * render, cached per voice, so picking a new one re-records every scene on
 * the next render and changes nothing else.
 */
export function VoicePicker({
  value,
  busy,
  disabled,
  onChange,
}: {
  /** The project's voice; null/empty = the engine default. */
  value: string | null | undefined
  busy?: boolean
  disabled?: boolean
  onChange: (voice: string) => void
}) {
  const [voices, setVoices] = React.useState<Record<string, string>>({})
  const [clones, setClones] = React.useState<Record<string, string>>({})
  const [fallback, setFallback] = React.useState('')
  const [previewing, setPreviewing] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    api
      .get('/api/tts/voices', { params: { template: 'ai_explainer_video' } })
      .then((res) => {
        setVoices(res.data?.voices ?? {})
        setClones(res.data?.clones ?? {})
        setFallback(res.data?.default ?? '')
      })
      .catch(() => {})
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  // A voice from the other engine (after an admin switch) is not in the list;
  // the renderer maps it to the default, so show the default.
  const current = value && (voices[value] || clones[value]) ? value : fallback

  const preview = async () => {
    if (previewing) {
      audioRef.current?.pause()
      audioRef.current = null
      setPreviewing(false)
      return
    }
    if (!current) return
    setPreviewing(true)
    try {
      const res = await api.post('/api/tts/preview', { voice: current })
      const url: string | undefined = res.data?.url
      if (!url) throw new Error('No preview URL')
      const audio = new Audio(url.startsWith('http') ? url : `${api.defaults.baseURL ?? ''}${url}`)
      audioRef.current = audio
      audio.onended = () => setPreviewing(false)
      audio.onerror = () => setPreviewing(false)
      await audio.play()
    } catch {
      setPreviewing(false)
    }
  }

  if (Object.keys(voices).length === 0 && Object.keys(clones).length === 0) {
    return <span className="text-[12px] text-muted-foreground">Loading voices…</span>
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <label htmlFor="storyboard-voice" className="sr-only">
        Narrator voice
      </label>
      <select
        id="storyboard-voice"
        value={current}
        disabled={disabled || busy}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 max-w-[170px] rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none focus:border-primary disabled:opacity-60"
      >
        {Object.keys(clones).length > 0 && (
          <optgroup label="My voices">
            {Object.entries(clones).map(([id, label]) => (
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
        onClick={preview}
        disabled={!current}
        title={previewing ? 'Stop preview' : 'Play a short voice sample'}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-inset disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : previewing ? (
          <Square className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  )
}
