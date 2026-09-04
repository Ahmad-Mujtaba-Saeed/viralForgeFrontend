'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { PlayerRef } from '@remotion/player'
import {
  AlertTriangle, Captions, Crop, Download, FileText, Gauge, Layers, Loader2, Maximize,
  Music, Pause, Play, RefreshCw, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X,
} from 'lucide-react'
import type { PlayerPayload, StageMeta } from './PlayerStage'
import type { PlayerTiming } from './usePlayerPayload'
import { COMPOSITION_LABELS, type Storyboard } from './types'

/**
 * StageDeck — the video, and everything you do to the video.
 *
 * This replaces the old "style preview" still. There is no frozen frame any
 * more: the stage is always the REAL composition playing in the browser
 * (`PreviewPlayer` → `PlayerStage`), and once an MP4 exists the same deck can
 * switch to it. The scrubber is segmented by scene, so the timeline, the
 * filmstrip and the inspector are all views of one selection.
 *
 * The chrome lives here rather than inside the player chunk so it paints
 * immediately — the deck is on screen and legible while ~1.4MB of composition
 * is still arriving.
 */

/**
 * The composition is ~1.4MB with the whole layout library behind it, so it
 * stays out of the dashboard's main bundle. The deck's own chrome is NOT in
 * here: it paints immediately and stays legible while this arrives.
 */
const PlayerStage = dynamic(() => import('./PlayerStage'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-xs text-white/60">
      <span className="inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the player…
      </span>
    </div>
  ),
})

const stamp = (seconds: number): string => {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const m = Math.floor(safe / 60)
  const s = Math.floor(safe % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

type Source = 'preview' | 'final'

export function StageDeck({
  board,
  payload,
  payloadLoading,
  payloadError,
  timing,
  onReloadPayload,
  activeSceneId,
  onSelectScene,
  settingsOpen,
  onToggleSettings,
  settingsPanel,
}: {
  board: Storyboard
  /** The shot list, fetched once by the page and shared with the filmstrip. */
  payload: PlayerPayload | null
  payloadLoading: boolean
  payloadError: string | null
  timing: PlayerTiming | null
  onReloadPayload: () => void
  activeSceneId: string | null
  onSelectScene: (sceneId: string) => void
  settingsOpen: boolean
  onToggleSettings: () => void
  /** The "Playback & render" popover body — owned by the page, shown here. */
  settingsPanel: React.ReactNode
}) {
  const playerRef = React.useRef<PlayerRef | null>(null)
  const shellRef = React.useRef<HTMLDivElement | null>(null)

  const [meta, setMeta] = React.useState<StageMeta | null>(null)
  const [frame, setFrame] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false)

  const videos = (board.output_videos ?? []).filter((v) => v.url)
  const hasVideo = board.status === 'completed' && Boolean(board.output_url)
  const stale = hasVideo && Boolean(board.rendered_look) && board.rendered_look !== board.current_look

  // While the MP4 still matches the current settings it is what you want to
  // look at; the moment a look setting changes the live preview is the only
  // honest answer, so the deck flips to it.
  const [source, setSource] = React.useState<Source>(hasVideo && !stale ? 'final' : 'preview')
  React.useEffect(() => {
    if (!hasVideo) setSource('preview')
    else if (stale) setSource('preview')
  }, [hasVideo, stale])

  const [finalAspect, setFinalAspect] = React.useState<string | null>(null)
  const finalUrl =
    videos.find((v) => v.aspect === (finalAspect ?? videos[0]?.aspect))?.url ?? board.output_url ?? undefined

  const scenes = board.scenes
  const fps = meta?.fps ?? board.render_fps ?? 30
  const totalFrames = meta?.durationInFrames ?? 0
  const starts = meta?.starts ?? []

  const handleMeta = React.useCallback((next: StageMeta) => setMeta(next), [])

  // Which scene the playhead is inside: the last one that has started. This is
  // what keeps the inspector pointed at the beat you are watching.
  const playheadIndex = React.useMemo(() => {
    if (!starts.length) return 0
    let current = 0
    starts.forEach((start, i) => {
      if (frame >= start) current = i
    })
    return current
  }, [frame, starts])

  const reportedScene = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (source !== 'preview' || !playing) return
    const id = scenes[playheadIndex]?.scene_id
    if (id && id !== reportedScene.current) {
      reportedScene.current = id
      onSelectScene(id)
    }
  }, [playheadIndex, scenes, onSelectScene, playing, source])

  const activeIndex = Math.max(0, scenes.findIndex((s) => s.scene_id === activeSceneId))

  const seek = React.useCallback(
    (target: number) => {
      if (!totalFrames) return
      const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(target)))
      playerRef.current?.seekTo(clamped)
      setFrame(clamped)
    },
    [totalFrames]
  )

  const jumpToScene = React.useCallback(
    (index: number) => {
      const scene = scenes[index]
      if (!scene) return
      reportedScene.current = scene.scene_id
      onSelectScene(scene.scene_id)
      if (source === 'preview' && starts[index] !== undefined) seek(starts[index])
    },
    [scenes, onSelectScene, source, starts, seek]
  )

  // Selecting a scene anywhere else (filmstrip, inspector) parks the playhead
  // on it, so the stage always shows what the inspector is editing.
  React.useEffect(() => {
    if (source !== 'preview' || playing) return
    if (!activeSceneId || starts[activeIndex] === undefined) return
    if (reportedScene.current === activeSceneId) return
    reportedScene.current = activeSceneId
    seek(starts[activeIndex])
  }, [activeSceneId, activeIndex, starts, seek, playing, source])

  const toggleFullscreen = () => {
    if (source === 'preview') {
      try {
        playerRef.current?.requestFullscreen()
        return
      } catch {
        // Some browsers refuse the player's own request; fall through.
      }
    }
    void shellRef.current?.requestFullscreen?.()
  }

  const totalSeconds = totalFrames ? totalFrames / fps : scenes.reduce((a, s) => a + s.duration_seconds, 0)
  const elapsedSeconds = totalFrames ? frame / fps : 0

  const chip = (icon: React.ReactNode, label: string, title?: string) => (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-white/80"
    >
      {icon}
      {label}
    </span>
  )

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#14120F] shadow-soft-lg"
    >
      {settingsOpen && (
        <div className="absolute left-4 top-4 z-20 w-[300px] rounded-2xl border border-border bg-popover p-3.5 text-popover-foreground shadow-soft-lg">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-bold text-foreground">Playback &amp; render</span>
            <button
              onClick={onToggleSettings}
              className="grid place-items-center text-ink3 transition-colors hover:text-foreground"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {settingsPanel}
        </div>
      )}

      {/* The frame. */}
      <div className="grid min-h-0 flex-1 place-items-center p-4 sm:p-6">
        <div
          className="relative max-h-[70vh] w-full max-w-[1120px] overflow-hidden rounded-xl bg-black shadow-[0_18px_50px_rgba(0,0,0,.5)] xl:max-h-full"
          // `aspect-ratio` + `max-height` re-derives the WIDTH, so one rule
          // holds for landscape and portrait, in a height-capped column (xl)
          // and in the free-flowing stack below it. Setting height:100% here
          // instead collapsed 9:16 to nothing wherever the parent was auto.
          style={{
            aspectRatio:
              board.aspect_ratio === '9:16' ? '9 / 16' : board.aspect_ratio === '1:1' ? '1 / 1' : '16 / 9',
          }}
        >
          {source === 'final' && finalUrl ? (
            <video key={finalUrl} src={finalUrl} controls className="h-full w-full object-contain" />
          ) : payloadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-white/70">
              <AlertTriangle className="h-5 w-5 text-warn" />
              <span>{payloadError}</span>
              <button onClick={onReloadPayload} className="font-semibold text-primary hover:underline">
                Try again
              </button>
            </div>
          ) : !payload ? (
            <div className="grid h-full w-full place-items-center text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing the preview…
              </span>
            </div>
          ) : (
            <PlayerStage
              payload={payload}
              playerRef={playerRef}
              onMeta={handleMeta}
              onFrame={setFrame}
              onPlayingChange={setPlaying}
              onMutedChange={setMuted}
            />
          )}
        </div>
      </div>

      {/* Scene-segmented scrubber. One block per scene, sized by its length. */}
      <div className="flex flex-none flex-col gap-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex items-center gap-1">
          {scenes.map((scene, i) => {
            const isActive = i === (source === 'preview' && playing ? playheadIndex : activeIndex)
            const isPlayed = source === 'preview' && playing ? i < playheadIndex : i < activeIndex
            return (
              <button
                key={scene.scene_id}
                onClick={() => jumpToScene(i)}
                title={`Scene ${scene.order} · ${Math.round(scene.duration_seconds)}s`}
                aria-label={`Go to scene ${scene.order}`}
                style={{ flex: Math.max(1, scene.duration_seconds) }}
                className={`h-[7px] rounded-full transition-colors ${
                  isActive ? 'bg-primary' : isPlayed ? 'bg-white/40' : 'bg-white/15 hover:bg-white/30'
                }`}
              />
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => jumpToScene(Math.max(0, (playing ? playheadIndex : activeIndex) - 1))}
              disabled={source === 'final'}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
              title="Previous scene"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => playerRef.current?.toggle()}
              disabled={source === 'final' || !totalFrames}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#14120F] shadow-[0_8px_22px_rgba(0,0,0,.35)] transition-opacity hover:opacity-90 disabled:opacity-40"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <button
              onClick={() => jumpToScene(Math.min(scenes.length - 1, (playing ? playheadIndex : activeIndex) + 1))}
              disabled={source === 'final'}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
              title="Next scene"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => seek(0)}
              disabled={source === 'final' || !totalFrames}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
              title="Back to the start"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => (muted ? playerRef.current?.unmute() : playerRef.current?.mute())}
              disabled={source === 'final'}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
              title={muted ? 'Unmute the music' : 'Mute the music'}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <span className="ml-1 font-mono text-xs tabular-nums text-white/65">
              {stamp(elapsedSeconds)} / {stamp(totalSeconds)}
            </span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {hasVideo && (
              <div className="inline-flex overflow-hidden rounded-lg border border-white/15">
                {(['preview', 'final'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSource(key)}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      source === key ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/70 hover:bg-white/15'
                    }`}
                    title={
                      key === 'preview'
                        ? 'The storyboard as it stands, playing live'
                        : 'The rendered MP4'
                    }
                  >
                    {key === 'preview' ? 'Preview' : 'Final'}
                  </button>
                ))}
              </div>
            )}
            {source === 'final' && videos.length > 1 && (
              <div className="inline-flex overflow-hidden rounded-lg border border-white/15">
                {videos.map((v) => (
                  <button
                    key={v.aspect}
                    onClick={() => setFinalAspect(v.aspect)}
                    className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      (finalAspect ?? videos[0]?.aspect) === v.aspect
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/5 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    {v.aspect}
                  </button>
                ))}
              </div>
            )}
            {chip(<Gauge className="h-3 w-3" />, `${board.render_fps ?? 30} FPS`)}
            {chip(<Crop className="h-3 w-3" />, board.aspect_ratio)}
            {chip(
              <Layers className="h-3 w-3" />,
              COMPOSITION_LABELS[board.composition_mode ?? ''] ?? board.composition_mode ?? 'Auto'
            )}
            {source === 'preview' && (
              <button
                onClick={onReloadPayload}
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
                title="Reload the storyboard into the player"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Fullscreen"
            >
              <Maximize className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* One line of truth about what you are looking at. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-snug text-white/50">
          {source === 'final' ? (
            <>
              <span>The rendered MP4.</span>
              {stale && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warn/20 px-2 py-0.5 font-bold text-warn">
                  <AlertTriangle className="h-3 w-3" />
                  style changed since this render
                </span>
              )}
              {finalUrl && (
                <a href={finalUrl} download className="inline-flex items-center gap-1 font-semibold text-white/75 hover:text-white">
                  <Download className="h-3 w-3" /> MP4
                </a>
              )}
              {board.srt_url && (
                <a href={board.srt_url} download className="inline-flex items-center gap-1 font-semibold text-white/75 hover:text-white">
                  <Captions className="h-3 w-3" /> SRT
                </a>
              )}
              {board.youtube_kit_url && (
                <a href={board.youtube_kit_url} download className="inline-flex items-center gap-1 font-semibold text-white/75 hover:text-white">
                  <FileText className="h-3 w-3" /> YouTube kit
                </a>
              )}
            </>
          ) : payloadError ? (
            <span className="inline-flex items-center gap-1 text-warn">
              <AlertTriangle className="h-3 w-3" /> {payloadError}
            </span>
          ) : !meta || payloadLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Preparing the composition…
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <Music className="h-3 w-3" /> Music and sound only — the voiceover is recorded at render.
              </span>
              {timing !== 'exact' && (
                <span>Scene lengths are estimates until the first render paces them to the narration.</span>
              )}
              {stale && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warn/20 px-2 py-0.5 font-bold text-warn">
                  <AlertTriangle className="h-3 w-3" />
                  newer than the last render
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
