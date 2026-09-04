'use client'

import * as React from 'react'
import { Player, type PlayerRef } from '@remotion/player'
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
 * the dashboard's main bundle. THE TRANSPORT CHROME IS DELIBERATELY NOT HERE:
 * the stage deck draws the scrubber, the transport and the chips outside this
 * chunk so they paint before the composition has finished arriving. This file
 * owns only the frame and reports its clock upward.
 */

export type PlayerPayload = {
  shot_list: ShotList
  fps: number
  width: number
  height: number
}

/** The clock, computed inside this chunk and handed to the chrome outside it. */
export type StageMeta = {
  fps: number
  durationInFrames: number
  /** First frame of each scene, in storyboard order. */
  starts: number[]
}

export default function PlayerStage({
  payload,
  playerRef,
  onMeta,
  onFrame,
  onPlayingChange,
  onMutedChange,
}: {
  payload: PlayerPayload
  /** The caller drives playback through this — see StageDeck. */
  playerRef: React.RefObject<PlayerRef | null>
  onMeta?: (meta: StageMeta) => void
  onFrame?: (frame: number) => void
  onPlayingChange?: (playing: boolean) => void
  onMutedChange?: (muted: boolean) => void
}) {
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

  // Report the clock up as soon as it is known, and again whenever the shot
  // list changes underneath us (a scene edit re-paces everything after it).
  React.useEffect(() => {
    onMeta?.({ fps, durationInFrames, starts })
  }, [fps, durationInFrames, starts, onMeta])

  React.useEffect(() => {
    const player = playerRef.current
    if (!player) return
    const handleFrame = (e: { detail: { frame: number } }) => onFrame?.(e.detail.frame)
    const handlePlay = () => onPlayingChange?.(true)
    const handlePause = () => onPlayingChange?.(false)
    const handleEnded = () => onPlayingChange?.(false)
    const handleMute = (e: { detail: { isMuted: boolean } }) => onMutedChange?.(e.detail.isMuted)
    player.addEventListener('frameupdate', handleFrame)
    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('ended', handleEnded)
    player.addEventListener('mutechange', handleMute)
    return () => {
      player.removeEventListener('frameupdate', handleFrame)
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('ended', handleEnded)
      player.removeEventListener('mutechange', handleMute)
    }
    // The listeners are attached once the ref is populated, which happens on
    // the first commit — the empty dep list is the mount pass that follows it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No aspect box here: the stage deck owns the frame's shape, and a second
  // ratio on the inner element only ever disagrees with it.
  return (
    <div className="relative h-full w-full">
      <Player
        ref={playerRef}
        component={ExplainerVideo as never}
        inputProps={inputProps as never}
        durationInFrames={durationInFrames}
        compositionWidth={payload.width}
        compositionHeight={payload.height}
        fps={fps}
        // The controls are the stage deck's: the default bar has no notion of
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
  )
}
