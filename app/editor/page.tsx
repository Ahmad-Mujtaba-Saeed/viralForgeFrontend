"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import EditorEmbed from '@/components/editor/EditorEmbed'
import api from '@/lib/axios'

export default function EditorPage() {
  const params = useSearchParams()
  const videoUrlParam = params.get('videoUrl') || undefined
  const projectId = params.get('projectId') || undefined
  const [initialUrl, setInitialUrl] = React.useState<string | undefined>(projectId ? undefined : videoUrlParam)
  const [initialFile, setInitialFile] = React.useState<File | undefined>(undefined)
  const [editorRouteHash, setEditorRouteHash] = React.useState<string | undefined>(projectId ? undefined : undefined)
  const [isProjectLoading, setIsProjectLoading] = React.useState<boolean>(!!projectId)

  React.useEffect(() => {
    let mounted = true

    async function fetchProjectVideo() {
      if (!projectId) return
      try {
        const res = await api.get(`/api/projects/${projectId}/download-video`, {
          responseType: 'blob',
        })
        if (!mounted) return
        const blob = res.data as Blob
        const fileName = `project_${projectId}.mp4`
        setInitialFile(new File([blob], fileName, { type: blob.type || 'video/mp4' }))
      } catch (e) {
        // ignore — EditorEmbed will allow manual import
      }
    }

    async function fetchProjectMeta() {
      if (!projectId) return

      try {
        const res = await api.get(`/api/projects/${projectId}`)
        if (!mounted) return
        const project = res.data?.data
        const ratio = project?.aspect_ratio as string | undefined

        const ratioToPreset: Record<string, string> = {
          '9:16': 'tiktok',
          '16:9': 'youtube-video',
          '1:1': 'instagram-post',
        }

        if (ratio && ratioToPreset[ratio]) {
          setEditorRouteHash(`#/new?preset=${encodeURIComponent(ratioToPreset[ratio])}`)
        } else {
          setEditorRouteHash('#/editor')
        }
      } catch (e) {
        setEditorRouteHash('#/editor')
      } finally {
        if (mounted) {
          setIsProjectLoading(false)
        }
      }
    }

    if (projectId) {
      fetchProjectVideo()
      fetchProjectMeta()
    }

    return () => { mounted = false }
  }, [projectId])

  const initialName = projectId ? `project_${projectId}.mp4` : undefined

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Editor</h2>
      {isProjectLoading ? (
        <div>Loading project settings…</div>
      ) : (
        <EditorEmbed
          editorUrl={process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173'}
          initialImportUrl={initialUrl}
          initialImportFile={initialFile}
          initialName={initialName}
          editorRouteHash={editorRouteHash}
        />
      )}
    </div>
  )
}
