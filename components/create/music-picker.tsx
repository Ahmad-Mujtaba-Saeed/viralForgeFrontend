'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export type MusicPatch = {
  music_category?: string
  music_track_id?: string
  music_volume?: number
}

type Track = { id: string; title: string; duration: number; url: string }

function fmtDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Background-music control used by every create flow: pick a category,
 * audition the actual tracks a render can use, choose one (or leave it on
 * "Surprise me"), and set how loud the bed sits under the narration.
 */
export function MusicPicker({
  options,
  category,
  trackId,
  volume,
  onChange,
}: {
  /** category value → label, including none/auto when the template offers them */
  options: Record<string, string>
  category: string
  trackId: string
  volume: number
  onChange: (patch: MusicPatch) => void
}) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [source, setSource] = useState<string>('none')
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const browsable = category !== '' && category !== 'none' && category !== 'auto'

  const stopAudio = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingId(null)
  }

  useEffect(() => () => stopAudio(), [])

  useEffect(() => {
    stopAudio()
    if (!browsable) {
      setTracks([])
      setSource('none')
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get('/api/music/tracks', { params: { category } })
      .then((res) => {
        if (cancelled) return
        setTracks(res.data?.tracks ?? [])
        setSource(res.data?.source ?? 'none')
      })
      .catch(() => {
        if (!cancelled) {
          setTracks([])
          setSource('none')
        }
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, browsable])

  const togglePreview = (track: Track) => {
    if (playingId === track.id) {
      stopAudio()
      return
    }
    stopAudio()
    const audio = new Audio(track.url)
    audioRef.current = audio
    setPlayingId(track.id)
    audio.onended = () => setPlayingId((p) => (p === track.id ? null : p))
    audio.onerror = () => setPlayingId((p) => (p === track.id ? null : p))
    audio.play().catch(() => setPlayingId((p) => (p === track.id ? null : p)))
  }

  const pickCategory = (value: string) => {
    onChange({ music_category: value, music_track_id: '' })
  }

  const TrackRow = ({ track }: { track: Track }) => {
    const selected = trackId === track.id
    const playing = playingId === track.id
    const dur = fmtDuration(track.duration)
    return (
      <button
        type="button"
        onClick={() => onChange({ music_track_id: selected ? '' : track.id })}
        className={cn(
          'flex w-full items-center gap-2.5 border-b border-border/60 px-3 py-2 text-left transition-colors last:border-0',
          selected ? 'bg-accent-soft' : 'hover:bg-inset/60'
        )}
      >
        <span
          role="button"
          tabIndex={-1}
          aria-label={playing ? `Stop ${track.title}` : `Play ${track.title}`}
          title={playing ? 'Stop' : 'Listen'}
          onClick={(e) => {
            e.stopPropagation()
            togglePreview(track)
          }}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110"
        >
          {playing ? (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <rect x="4" y="4" width="8" height="8" rx="1.5" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <polygon points="5,4 11,8 5,12" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{track.title}</span>
        {dur && <span className="flex-shrink-0 text-[11px] tabular-nums text-ink3">{dur}</span>}
        <span
          className={cn(
            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-primary bg-primary' : 'border-border'
          )}
        >
          {selected && (
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </button>
    )
  }

  return (
    <div>
      <span className="mb-2 block text-[13px] font-semibold text-foreground">Background music</span>
      <select
        value={category}
        onChange={(e) => pickCategory(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {Object.entries(options).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {category === 'auto' && (
        <p className="mt-1.5 text-xs text-ink3">A track matching the video&apos;s mood is chosen automatically.</p>
      )}

      {browsable && (
        <div className="mt-2.5">
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tracks…
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-xs text-muted-foreground">
              <Music2 className="h-3.5 w-3.5" /> No tracks available for this category yet — a random pick is used if any
              become available.
            </div>
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => onChange({ music_track_id: '' })}
                  className={cn(
                    'flex w-full items-center gap-2.5 border-b border-border/60 px-3 py-2 text-left transition-colors',
                    trackId === '' ? 'bg-accent-soft' : 'hover:bg-inset/60'
                  )}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-inset text-foreground">
                    <Music2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
                    Surprise me — pick a track for me
                  </span>
                  <span
                    className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border',
                      trackId === '' ? 'border-primary bg-primary' : 'border-border'
                    )}
                  >
                    {trackId === '' && (
                      <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                        <path d="M3.5 8.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                </button>
                {tracks.map((t) => (
                  <TrackRow key={t.id} track={t} />
                ))}
              </div>
              {source === 'local' && (
                <p className="mt-1.5 text-xs text-ink3">
                  Showing the built-in library — your Pixabay key doesn&apos;t have audio API access yet (it&apos;s
                  approved separately from images).
                </p>
              )}
            </>
          )}
        </div>
      )}

      {category !== 'none' && category !== '' && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">Music volume</span>
            <span className="text-xs tabular-nums text-ink3">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onChange({ music_volume: Number(e.target.value) })}
            className="w-full accent-[var(--primary)]"
          />
        </div>
      )}
    </div>
  )
}
