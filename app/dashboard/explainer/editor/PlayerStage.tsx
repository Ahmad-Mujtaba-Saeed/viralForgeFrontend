'use client'

import * as React from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { ExplainerVideo } from '@/lib/remotion/ExplainerVideo'
import { sceneStartFrames, totalFramesFor } from '@/lib/remotion/timing'
import type { ShotList } from '@/lib/remotion/types'

/**
 * PlayerStage — the export, playing in the browser.
 *
 * This is not a mock-up of the video: it is the video. `ExplainerVideo` is the
 * exact React composition the render service renders the MP4 from, mirrored
 * into this app by `scripts/sync-remotion.mjs` and driven here by
 * @remotion/player instead of by headless Chromium. Layout, type, colour,
 * reveals, camera and transitions are therefore not "close to" the export —
 * they are the same code on the same shot list.
 *
 * Two honest differences, both deliberate:
 *
 *  1. NO VOICE. The API strips `narration_audio_url` from every scene, so what
 *     plays is music and sound effects only. A side effect: the renderer ducks
 *     music under narration by looking for that audio, so the bed here sits a
 *     little louder than it will in the export.
 *  2. THE CLOCK, until the first render. Narration is synthesised at render
 *     time and each scene is then re-paced to fit the speech that came back.
 *     Before that has happened the durations are the planner's estimates —
 *     `timing="estimated"` — and the caller says so on screen.
 *
 * This module is heavy (the whole layout library, ~1.4MB of source, plus
 * Remotion) and is dynamically imported by the panel so none of it lands in
 * the dashboard's main bundle.
 */

export type PlayerPayload = {
  shot_list: ShotList
  fps: number
  width: number
  height: number
}

type SceneMark = {
  scene_id: string
  duration_seconds: number
}

/** m:ss.t — tenths, because scene cuts land between whole seconds. */
const stamp = (seconds: number): string => {
  const safe = Math.max(0, seconds)
  const m = Math.floor(safe / 60)
  const s = Math.floor(safe % 60)
  const tenth = Math.floor((safe * 10) % 10)
  return `${m}:${String(s).padStart(2, '0')}.${tenth}`
}

export default function PlayerStage({
  payload,
  scenes,
  aspectRatio,
  onSceneChange,
}: {
  payload: PlayerPayload
  /** Storyboard scenes, in order — the ruler's labels. */
  scenes: SceneMark[]
  aspectRatio: string
  /** Fires when the playhead crosses into a different scene. */
  onSceneChange?: (sceneId: string) => void
}) {
  const ref = React.useRef<PlayerRef>(null)
  const [frame, setFrame] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false)

  const fps = payload.fps || 30
  const shotList = payload.shot_list

  // Length and scene boundaries both come from the RENDERER's timing module,
  // not from adding up durations here: transitions overlap the scenes they
  // join, so naive addition drifts a little further out with every cut.
  const durationInFrames = React.useMemo(
    () => Math.max(1, totalFramesFor(shotList, fps)),
    [shotList, fps]
  )
  const starts = React.useMemo(() => sceneStartFrames(shotList, fps), [shotList, fps])

  const inputProps = React.useMemo(
    () => ({ shotList, fps, width: payload.width, height: payload.height }),
    [shotList, fps, payload.width, payload.height]
  )

  React.useEffect(() => {
    const player = ref.current
    if (!player) return
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)
    const onMute = (e: { detail: { isMuted: boolean } }) => setMuted(e.detail.isMuted)
    player.addEventListener('frameupdate', onFrame)
    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    player.addEventListener('ended', onEnded)
    player.addEventListener('mutechange', onMute)
    return () => {
      player.removeEventListener('frameupdate', onFrame)
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
      player.removeEventListener('ended', onEnded)
      player.removeEventListener('mutechange', onMute)
    }
  }, [])

  // Which scene the playhead is inside: the last one that has started.
  const activeIndex = React.useMemo(() => {
    let current = 0
    starts.forEach((start, i) => {
      if (frame >= start) current = i
    })
    return current
  }, [frame, starts])

  const reportedScene = React.useRef<string | null>(null)
  React.useEffect(() => {
    const id = scenes[activeIndex]?.scene_id
    if (id && id !== reportedScene.current) {
      reportedScene.current = id
      onSceneChange?.(id)
    }
  }, [activeIndex, scenes, onSceneChange])

  const seek = (target: number) => {
    const clamped = Math.max(0, Math.min(durationInFrames - 1, Math.round(target)))
    ref.current?.seekTo(clamped)
    setFrame(clamped)
  }

  const ratio =
    aspectRatio === '9:16' ? '9 / 16' : aspectRatio === '1:1' ? '1 / 1' : '16 / 9'

  return (
    <div>
      <div
        className="relative mx-auto bg-black"
        style={{ aspectRatio: ratio, maxHeight: '52vh' }}
      >
        <Player
          ref={ref}
          component={ExplainerVideo as never}
          inputProps={inputProps as never}
          durationInFrames={durationInFrames}
          compositionWidth={payload.width}
          compositionHeight={payload.height}
          fps={fps}
          // The controls below are ours: the default bar has no notion of
          // scenes, and knowing WHICH scene the playhead is in is most of the
          // value of previewing a storyboard.
          controls={false}
          clickToPlay
          spaceKeyToPlayOrPause
          moveToBeginningWhenEnded={false}
          style={{ width: '100%', height: '100%' }}
          // A slow machine cannot render 1080p React in real time; the Player
          // drops frames to keep the clock honest rather than playing in slow
          // motion, so the timestamp always tells the truth.
          renderLoading={() => (
            <div className="grid h-full w-full place-items-center text-xs text-white/70">
              Loading the composition…
            </div>
          )}
        />
      </div>

      {/* The ruler: one segment per scene, the played part filled. Clicking
          anywhere seeks; clicking a segment label jumps to that scene. */}
      <div className="px-3 pt-2.5">
        <div
          role="slider"
          aria-label="Playhead"
          aria-valuemin={0}
          aria-valuemax={durationInFrames}
          aria-valuenow={frame}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') seek(frame + fps)
            if (e.key === 'ArrowLeft') seek(frame - fps)
          }}
          onClick={(e) => {
            const box = e.currentTarget.getBoundingClientRect()
            seek(((e.clientX - box.left) / box.width) * durationInFrames)
          }}
          className="relative h-2.5 cursor-pointer rounded-full bg-inset"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%` }}
          />
          {starts.slice(1).map((start, i) => (
            <span
              key={scenes[i + 1]?.scene_id ?? i}
              className="absolute top-0 h-full w-px bg-card/80"
              style={{ left: `${(start / durationInFrames) * 100}%` }}
            />
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => ref.current?.toggle()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => seek(0)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-inset hover:text-foreground"
            aria-label="Back to the start"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => (muted ? ref.current?.unmute() : ref.current?.mute())}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-inset hover:text-foreground"
            aria-label={muted ? 'Unmute the music' : 'Mute the music'}
            title={muted ? 'Unmute the music' : 'Mute the music'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          <span className="font-mono text-xs tabular-nums text-foreground">
            {stamp(frame / fps)}
            <span className="text-ink3"> / {stamp(durationInFrames / fps)}</span>
          </span>

          <span className="ml-auto truncate text-xs text-muted-foreground">
            Scene {activeIndex + 1}/{scenes.length}
            {scenes[activeIndex] ? (
              <span className="ml-1.5 font-mono text-ink3">{scenes[activeIndex].scene_id}</span>
            ) : null}
          </span>
        </div>

        {/* Jump straight to a beat — the reason anyone scrubs a storyboard. */}
        <div className="mt-2 flex flex-wrap gap-1">
          {scenes.map((scene, i) => (
            <button
              key={scene.scene_id}
              type="button"
              onClick={() => seek(starts[i] ?? 0)}
              title={`${scene.scene_id} — ${stamp((starts[i] ?? 0) / fps)}`}
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors ${
                i === activeIndex
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-inset hover:text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
