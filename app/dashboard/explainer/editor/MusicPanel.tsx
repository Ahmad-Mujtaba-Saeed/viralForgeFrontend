'use client'

import * as React from 'react'
import api from '@/lib/axios'
import { Check, Loader2, Pause, Play, Upload, X } from 'lucide-react'
import type { MusicTrack, Storyboard } from './types'

/**
 * The background-music controls: category, a specific track, and how loud the
 * bed sits under the voiceover — plus the user's own uploaded library.
 *
 * The renderer always understood all of this; none of it was reachable after
 * the create flow, so a storyboard was stuck with whatever mood the analyzer
 * inferred. Auditioning plays the exact URLs the render pick draws from, at
 * roughly the level it will sit at, so what you hear is what you get.
 */
export function MusicPanel({
  board,
  projectId,
  onChange,
}: {
  board: Storyboard
  projectId: string
  onChange: () => Promise<void> | void
}) {
  const [tracks, setTracks] = React.useState<MusicTrack[]>([])
  const [source, setSource] = React.useState<string>('none')
  const [tracksLoading, setTracksLoading] = React.useState(false)
  const [previewingTrack, setPreviewingTrack] = React.useState<string | null>(null)
  const [volumeDraft, setVolumeDraft] = React.useState<number | null>(null)
  const [pending, setPending] = React.useState<Record<string, boolean>>({})
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const volumeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const category = board.music_category ?? 'auto'
  const volume = volumeDraft ?? board.music_volume ?? 0.09
  const customCategory = board.music_custom?.category ?? 'custom'

  const isPending = (key: string) => Boolean(pending[key])
  const groupPending = (prefix: string) =>
    Object.keys(pending).some((k) => k.startsWith(`${prefix}:`) && pending[k])

  const withPending = async (key: string, fn: () => Promise<void>) => {
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
  }

  // One <audio> for the whole panel: auditioning a second track must stop the
  // first, and leaving the page must not keep playing.
  const stopPreview = React.useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setPreviewingTrack(null)
  }, [])

  React.useEffect(() => () => stopPreview(), [stopPreview])

  const previewTrack = (track: MusicTrack) => {
    if (previewingTrack === track.id) {
      stopPreview()
      return
    }
    stopPreview()
    const audio = new Audio(track.url)
    // Audition at the level it will actually sit at under the narration,
    // otherwise every track sounds far too loud to judge.
    audio.volume = Math.min(1, Math.max(0.05, volume * 3))
    audio.onended = () => setPreviewingTrack(null)
    audio.play().catch(() => setPreviewingTrack(null))
    audioRef.current = audio
    setPreviewingTrack(track.id)
  }

  const loadTracks = React.useCallback(async (cat: string) => {
    if (cat === 'auto' || cat === 'none') {
      setTracks([])
      setSource('none')
      return
    }
    setTracksLoading(true)
    try {
      const res = await api.get('/api/music/tracks', { params: { category: cat } })
      setTracks(res.data?.tracks ?? [])
      setSource(res.data?.source ?? 'none')
    } catch {
      setTracks([])
      setSource('none')
    } finally {
      setTracksLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadTracks(category)
  }, [category, loadTracks])

  const saveMusic = async (patch: Record<string, unknown>, key: string) => {
    await withPending(key, async () => {
      try {
        await api.post(`/api/explainer/projects/${projectId}/music`, patch)
        await onChange()
      } catch {
        alert('Failed to update background music')
      }
    })
  }

  const handleCategory = async (cat: string) => {
    stopPreview()
    await saveMusic({ category: cat }, `music-cat:${cat}`)
  }

  // Debounced: an input[range] fires on every pixel of the drag.
  const handleVolume = (value: number) => {
    setVolumeDraft(value)
    if (volumeTimer.current) clearTimeout(volumeTimer.current)
    volumeTimer.current = setTimeout(() => {
      void saveMusic({ volume: value }, 'music-volume').then(() => setVolumeDraft(null))
    }, 400)
  }

  const handleTrack = async (trackId: string) => {
    // Clicking the selected track clears it, back to the automatic pick.
    const next = board.music_track_id === trackId ? '' : trackId
    await saveMusic({ track_id: next }, `music-track:${trackId}`)
  }

  const uploadMusic = async (file: File) => {
    setUploading(true)
    setUploadError(null)
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
      await loadTracks(customCategory)
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'That file could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  const deleteTrack = async (trackId: string) => {
    if (!confirm('Remove this track from your library? Videos already rendered with it are unaffected.')) return
    stopPreview()
    try {
      await api.delete(`/api/music/library/${trackId}`)
      // Dropping the track this project was using leaves it with no bed —
      // clear the selection so the panel does not point at something gone.
      if (board.music_track_id === trackId) {
        await saveMusic({ track_id: '' }, 'music-track:clear')
      }
      await loadTracks(customCategory)
    } catch {
      alert('Failed to remove that track')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">Style</div>
        <div className="flex flex-wrap gap-1.5">
          {['auto', customCategory, ...(board.music_categories ?? [])].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              disabled={groupPending('music-cat')}
              title={
                cat === 'auto'
                  ? "Match the music to the storyboard's dominant mood"
                  : cat === customCategory
                    ? 'Music you uploaded yourself — only you can see it'
                    : undefined
              }
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize transition-colors disabled:opacity-60 ${
                category === cat
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-inset'
              }`}
            >
              {isPending(`music-cat:${cat}`) ? (
                <Loader2 className="mx-2 h-3.5 w-3.5 animate-spin" />
              ) : cat === customCategory ? (
                <span className="inline-flex items-center gap-1.5">
                  <Upload className="h-3 w-3" />
                  {board.music_custom?.label ?? 'My music'}
                  {board.music_custom?.count ? <span className="opacity-70">({board.music_custom.count})</span> : null}
                </span>
              ) : (
                cat
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Capped at 40% because the bed is ducked under narration on top of
          this — past that the voiceover stops winning. */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">Volume</span>
          <span className="text-[11px] font-semibold text-foreground">
            {Math.round(volume * 100)}%
            {isPending('music-volume') ? <Loader2 className="ml-1.5 inline h-3 w-3 animate-spin" /> : null}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={0.4}
          step={0.01}
          value={volume}
          onChange={(e) => handleVolume(parseFloat(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Sits under the voiceover, which ducks it further while anyone is speaking. 9% is the default.
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink3">Track</span>
          <span className="text-[11px] capitalize text-muted-foreground">
            {source === 'local' ? 'from your local library' : board.music_provider ?? null}
          </span>
        </div>

        {category === customCategory && (
          <div className="mb-2 rounded-xl border border-dashed border-border p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground">
                Your own tracks — visible only to you, and offered on every project from now on.
                <span className="ml-1 text-ink3">
                  mp3, wav, m4a, aac or ogg · up to{' '}
                  {Math.round((board.music_custom?.max_kilobytes ?? 20480) / 1024)} MB ·{' '}
                  {board.music_custom?.count ?? 0}/{board.music_custom?.max ?? 50} used
                </span>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || (board.music_custom?.count ?? 0) >= (board.music_custom?.max ?? 50)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={board.music_custom?.accept ?? '.mp3,.wav,.m4a,.aac,.ogg'}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadMusic(f)
                e.target.value = ''
              }}
            />
            {uploadError && <p className="mt-1.5 text-[11px] text-warn">{uploadError}</p>}
          </div>
        )}

        {category === 'auto' || category === 'none' ? (
          <p className="text-xs text-muted-foreground">
            {category === 'none'
              ? 'Music is off for this video — pick a style above to turn it back on.'
              : 'Pick a style above to choose a specific track. On Auto the renderer picks one to match the mood.'}
          </p>
        ) : tracksLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tracks…
          </div>
        ) : tracks.length === 0 ? (
          category === customCategory ? (
            <p className="text-xs text-muted-foreground">
              Your library is empty. Upload a track above and it will be here for every video you make.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No auditionable tracks for this style
              {board.music_configured === false
                ? ` — no ${board.music_provider ?? 'music provider'} key is configured.`
                : ` — ${board.music_provider ?? 'the provider'} returned nothing for this style and there is no local library for it.`}{' '}
              The style still applies and the renderer falls back to its automatic pick. To get a list here, drop mp3s
              into{' '}
              <code className="rounded bg-inset px-1 py-0.5 text-[10px]">
                storage/app/public/audio/{category}/
              </code>
              .
            </p>
          )
        ) : (
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {tracks.map((track) => {
              const chosen = board.music_track_id === track.id
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${
                    chosen ? 'border-primary bg-inset' : 'border-border bg-card'
                  }`}
                >
                  <button
                    onClick={() => previewTrack(track)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-foreground hover:bg-inset"
                    title={previewingTrack === track.id ? 'Stop' : 'Preview'}
                  >
                    {previewingTrack === track.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-foreground">{track.title}</div>
                    {track.duration > 0 ? (
                      <div className="text-[10px] text-muted-foreground">
                        {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                      </div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleTrack(track.id)}
                    disabled={groupPending('music-track')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      chosen
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-muted-foreground hover:bg-inset'
                    }`}
                  >
                    {isPending(`music-track:${track.id}`) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : chosen ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Using
                      </>
                    ) : (
                      'Use'
                    )}
                  </button>
                  {/* Only your own uploads are yours to delete; the catalogue
                      is shared and read-only. */}
                  {category === customCategory && (
                    <button
                      onClick={() => deleteTrack(track.id)}
                      title="Remove from your library"
                      className="shrink-0 rounded-lg border border-border p-1 text-ink3 hover:bg-inset hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {board.music_track_id ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            A specific track is locked in. Click “Using” to clear it and let the renderer pick.
          </p>
        ) : null}
      </div>
    </div>
  )
}
