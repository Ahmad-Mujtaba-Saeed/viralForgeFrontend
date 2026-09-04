'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { PlayerRef } from '@remotion/player'
import { AlertTriangle, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import type { PlayerPayload, StageMeta } from './PlayerStage'

/**
 * PreviewPlayer — fetch the shot list, then hand it to the real composition.
 *
 * The player itself is a big module: the entire layout library plus Remotion.
 * It is behind `next/dynamic` so none of it lands in the dashboard's main
 * bundle — but unlike the old two-tab panel it now loads as soon as the editor
 * opens, because the stage IS the video: there is no still frame to fall back
 * on any more.
 *
 * The payload is a SNAPSHOT of the storyboard at fetch time. Editing a scene
 * does not reach into a video that is already playing, so the panel refetches
 * when the look changes and exposes a `reload` for everything else.
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

export type PreviewTiming = 'exact' | 'estimated' | string

type Fetched = {
  payload: PlayerPayload
  timing: PreviewTiming
  scenes: { scene_id: string; duration_seconds: number }[]
}

export function PreviewPlayer({
  projectId,
  /** Changes whenever a look-affecting setting does — the cue to refetch. */
  look,
  playerRef,
  onMeta,
  onFrame,
  onPlayingChange,
  onMutedChange,
  onStatus,
  reloadToken,
}: {
  projectId: string
  look?: string | null
  playerRef: React.RefObject<PlayerRef | null>
  onMeta?: (meta: StageMeta) => void
  onFrame?: (frame: number) => void
  onPlayingChange?: (playing: boolean) => void
  onMutedChange?: (muted: boolean) => void
  /** Loading / error / timing, so the deck can caption the stage. */
  onStatus?: (status: { loading: boolean; error: string | null; timing: PreviewTiming | null }) => void
  /** Bump to force a refetch (the deck's Refresh button). */
  reloadToken?: number
}) {
  const [data, setData] = React.useState<Fetched | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/explainer/projects/${projectId}/player-payload`)
      const body = res.data?.data
      if (!body?.payload) throw new Error('Empty payload')
      setData({
        payload: {
          shot_list: body.payload.shot_list,
          fps: body.payload.fps,
          width: body.payload.width,
          height: body.payload.height,
        },
        timing: body.timing ?? 'estimated',
        scenes: body.scenes ?? [],
      })
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not load the storyboard for playback.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    void load()
  }, [load, look, reloadToken])

  React.useEffect(() => {
    onStatus?.({ loading, error, timing: data?.timing ?? null })
  }, [loading, error, data?.timing, onStatus])

  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-white/70">
        <AlertTriangle className="h-5 w-5 text-warn" />
        <span>{error}</span>
        <button onClick={() => void load()} className="font-semibold text-primary hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid h-full w-full place-items-center text-xs text-white/60">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing the preview…
        </span>
      </div>
    )
  }

  return (
    <PlayerStage
      payload={data.payload}
      playerRef={playerRef}
      onMeta={onMeta}
      onFrame={onFrame}
      onPlayingChange={onPlayingChange}
      onMutedChange={onMutedChange}
    />
  )
}
