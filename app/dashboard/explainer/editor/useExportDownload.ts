'use client'

import * as React from 'react'
import api from '@/lib/axios'

/**
 * Downloads for the finished files — MP4, SRT, YouTube kit, thumbnail.
 *
 * The storage URLs are on the API host, and browsers ignore `<a download>`
 * across origins, so those links only ever opened the file in a tab. Instead
 * the owner asks the API for a short-lived signed link that serves the file as
 * an attachment, and the browser navigates to it: its own download manager
 * takes over (progress, no page memory for a 40MB MP4) and the page stays put.
 */

export type ExportKind = 'video' | 'srt' | 'youtube_kit' | 'thumbnail'

export function useExportDownload(projectId: number | string) {
  /** `${kind}:${variant}` of the download being prepared, if any. */
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const download = React.useCallback(
    async (kind: ExportKind, variant = '') => {
      setBusy(`${kind}:${variant}`)
      setError(null)
      try {
        const res = await api.get(`/api/explainer/projects/${projectId}/download-link/${kind}`, {
          params: variant ? { variant } : undefined,
        })
        const link = String(res.data?.data?.url ?? '')
        if (!link) throw new Error('no link')
        const a = document.createElement('a')
        a.href = /^https?:/i.test(link) ? link : `${String(api.defaults.baseURL ?? '').replace(/\/$/, '')}${link}`
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } catch (err: any) {
        setError(err?.response?.data?.message || 'That file could not be downloaded. Try again in a moment.')
      } finally {
        setBusy(null)
      }
    },
    [projectId]
  )

  const isBusy = React.useCallback((kind: ExportKind, variant = '') => busy === `${kind}:${variant}`, [busy])

  return { download, busy, isBusy, error }
}
