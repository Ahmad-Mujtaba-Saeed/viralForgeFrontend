'use client'

import * as React from 'react'
import { Thumbnail } from '@remotion/player'
import { ExplainerVideo } from '@/lib/remotion/ExplainerVideo'
import { sceneStartFrames, totalFramesFor } from '@/lib/remotion/timing'
import type { PlayerPayload } from './PlayerStage'

/**
 * SceneThumb — one filmstrip tile, rendered from the actual composition.
 *
 * The strip used to show a gradient plate with the scene's heading typed over
 * it: an illustration of a scene rather than the scene. Since the editor
 * already ships the real `ExplainerVideo` to the browser for the stage, the
 * honest version costs nothing extra to load — @remotion/player's `Thumbnail`
 * renders a single frame of the same composition on the same shot list, so a
 * tile is genuinely what that beat looks like, in this video's palette, type
 * and layout.
 *
 * Two deliberate details:
 *
 *  - The frame is sampled a little INTO the scene, not on its first frame.
 *    Scene one frame is mid-transition and mid-reveal, so every tile would be
 *    a half-drawn card; a beat and a half in, the reveals have landed.
 *  - Nothing renders until the tile has been near the viewport. A storyboard
 *    can run to twenty scenes and each thumbnail is a full render of the
 *    composition — mounting them all at once is what would make the strip
 *    expensive on the machines that can least afford it.
 */
export default function SceneThumb({
  payload,
  sceneIndex,
  className,
}: {
  payload: PlayerPayload
  sceneIndex: number
  className?: string
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = React.useState(false)
  const [armed, setArmed] = React.useState(false)

  // The strip is horizontal, so every tile is "visible" at once and mounting
  // seven full compositions in one frame is what would make the editor feel
  // slow on the machines that can least afford it. A short ladder lets each
  // tile land on its own frame; the plate underneath covers the wait.
  React.useEffect(() => {
    if (!visible || armed) return
    const timer = setTimeout(() => setArmed(true), Math.min(sceneIndex, 12) * 140)
    return () => clearTimeout(timer)
  }, [visible, armed, sceneIndex])

  React.useEffect(() => {
    const el = hostRef.current
    if (!el || visible) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      // A screen's worth of lead time, so scrolling the strip never shows a
      // gap where a tile is being built.
      { root: null, rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  const fps = payload.fps || 30
  const shotList = payload.shot_list

  const durationInFrames = React.useMemo(
    () => Math.max(1, totalFramesFor(shotList, fps)),
    [shotList, fps]
  )
  const starts = React.useMemo(() => sceneStartFrames(shotList, fps), [shotList, fps])

  const frameToDisplay = React.useMemo(() => {
    const start = starts[sceneIndex] ?? 0
    const next = starts[sceneIndex + 1] ?? durationInFrames
    // 1.5s in, but never past the scene's own last frame — a short beat gets
    // its midpoint instead.
    const target = start + Math.min(Math.round(fps * 1.5), Math.max(0, Math.floor((next - start) / 2)))
    return Math.max(0, Math.min(durationInFrames - 1, target))
  }, [starts, sceneIndex, durationInFrames, fps])

  return (
    <div ref={hostRef} className={className}>
      {armed ? (
        <Thumbnail
          component={ExplainerVideo as never}
          inputProps={{ shotList, fps, width: payload.width, height: payload.height } as never}
          durationInFrames={durationInFrames}
          frameToDisplay={frameToDisplay}
          compositionWidth={payload.width}
          compositionHeight={payload.height}
          fps={fps}
          style={{ width: '100%', height: '100%' }}
          // A tile is 156px wide: an error glyph there is noise. The caller's
          // plate is already behind this, so a failure just shows the plate.
          errorFallback={() => null}
          renderLoading={() => null}
        />
      ) : null}
    </div>
  )
}
