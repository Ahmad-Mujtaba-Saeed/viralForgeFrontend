'use client'

import * as React from 'react'
import api from '@/lib/axios'
import type { PlayerPayload } from './PlayerStage'

/**
 * The shot list the browser plays, fetched once for the whole editor.
 *
 * Both the stage and the filmstrip render the real composition now, and they
 * must render the SAME one — two fetches would be a wasted round trip and, on
 * a board being edited, an opportunity for the strip and the player to
 * disagree about what the video currently is. So the page owns the payload and
 * hands it down.
 *
 * It is a SNAPSHOT: editing a scene does not reach into a composition that is
 * already mounted. `look` changing refetches (that is the backend's hash of
 * every setting that alters a frame) and `reload()` covers everything else.
 */
export type PlayerTiming = 'exact' | 'estimated' | string

export function usePlayerPayload(projectId: string, look?: string | null) {
  const [payload, setPayload] = React.useState<PlayerPayload | null>(null)
  const [timing, setTiming] = React.useState<PlayerTiming | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [token, setToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(`/api/explainer/projects/${projectId}/player-payload`)
      .then((res) => {
        if (cancelled) return
        const body = res.data?.data
        if (!body?.payload) throw new Error('Empty payload')
        setPayload({
          shot_list: body.payload.shot_list,
          fps: body.payload.fps,
          width: body.payload.width,
          height: body.payload.height,
        })
        setTiming(body.timing ?? 'estimated')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not load the storyboard for playback.'
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, look, token])

  const reload = React.useCallback(() => setToken((n) => n + 1), [])

  return { payload, timing, loading, error, reload }
}
