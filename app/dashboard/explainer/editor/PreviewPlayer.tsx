'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import type { PlayerPayload } from './PlayerStage'

/**
 * PreviewPlayer — fetch the shot list, then hand it to the real composition.
 *
 * The player itself is a big module: the entire layout library plus Remotion.
 * Loading that on every storyboard visit to serve the minority of visits that
 * press Play would be indefensible, so it is behind `next/dynamic` and only
 * arrives when this tab is opened.
 *
 * The payload is a SNAPSHOT of the storyboard at fetch time. Editing a scene
 * does not reach into a video that is already playing, so the panel refetches
 * when the look changes and offers an explicit refresh for everything else.
 */

const PlayerStage = dynamic(() => import('./PlayerStage'), {
  ssr: false,
  loading: () => (
    <div className="grid h-40 place-items-center text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading the player…
      </span>
    </div>
  ),
})

type Fetched = {
  payload: PlayerPayload
  timing: 'exact' | 'estimated' | string
  scenes: { scene_id: string; duration_seconds: number }[]
}

export function PreviewPlayer({
  projectId,
  aspectRatio,
  /** Changes whenever a look-affecting setting does — the cue to refetch. */
  look,
  onSceneChange,
}: {
  projectId: string
  aspectRatio: string
  look?: string | null
  onSceneChange?: (sceneId: string) => void
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
  }, [load, look])

  if (loading && !data) {
    return (
      <div className="grid h-40 place-items-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Preparing the preview…
        </span>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-xs text-muted-foreground">
        <AlertTriangle className="h-5 w-5 text-warn" />
        <span>{error}</span>
        <button onClick={() => void load()} className="font-semibold text-primary hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <PlayerStage
        payload={data.payload}
        scenes={data.scenes}
        aspectRatio={aspectRatio}
        onSceneChange={onSceneChange}
      />
      <div className="flex items-start justify-between gap-3 px-3 py-2">
        <p className="text-[11px] leading-snug text-muted-foreground">
          {data.timing === 'exact'
            ? 'The real composition, playing here — no voiceover, music and sound only. Timings match the export.'
            : 'The real composition, playing here — no voiceover, music and sound only. Scene lengths are estimates until the first render paces them to the recorded narration.'}
        </p>
        <button
          onClick={() => void load()}
          disabled={loading}
          title="Reload the storyboard into the player"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-inset hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
    </div>
  )
}
