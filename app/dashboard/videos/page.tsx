'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutGrid, List, MoreVertical, Play, Download, Share2, Trash2, Plus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useProject } from '@/hooks/useProject'

interface VideoItem {
  id: number
  key: string
  title: string
  thumbnail_path: string
  duration: string
  aspectRatio: string
  width: number
  height: number
  date: string
  outputPath?: string | null
  status?: string | null
  templateType?: string | null
  formattedFileSize?: string | null
}

const TEMPLATE_ASPECT_RATIOS: Record<string, string> = {
  yt_automation_short: '9:16',
  youtube_short: '9:16',
  tiktok: '9:16',
  instagram_story: '9:16',
  yt_automation_long: '16:9',
  youtube_long: '16:9',
  default: '16:9',
}

const getAspectRatioFromTemplateType = (templateType?: string) => {
  if (!templateType) return TEMPLATE_ASPECT_RATIOS.default
  return TEMPLATE_ASPECT_RATIOS[templateType] || TEMPLATE_ASPECT_RATIOS.default
}

const gradientFor = (seed: number) => {
  const palette = [
    'linear-gradient(160deg,#2A1E3A,#15131C)',
    'linear-gradient(160deg,#11324A,#0C1A26)',
    'linear-gradient(160deg,#16302A,#0C1A17)',
    'linear-gradient(160deg,#2E2410,#171206)',
    'linear-gradient(160deg,#3A1320,#1C0C12)',
    'linear-gradient(160deg,#1A1430,#0E0B1A)',
  ]
  return palette[seed % palette.length]
}

const formatProjectDate = (date?: string) => {
  if (!date) return 'Unknown date'
  const parsed = new Date(date)
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatClipDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const buildVideoItemFromProject = (project: any): VideoItem => {
  const aspectRatio = getAspectRatioFromTemplateType(project.template_type)
  const [width, height] = aspectRatio.split(':').map(Number)
  return {
    id: project.id,
    key: String(project.id),
    title: project.title || project.file_name || `Project ${project.id}`,
    thumbnail_path: project.thumbnail_path,
    duration: project.formatted_duration || '0:00',
    aspectRatio,
    width: project.width || width * 90,
    height: project.height || height * 90,
    date: formatProjectDate(project.completed_at || project.created_at),
    outputPath: project.output_path || project.video_path,
    status: project.status,
    templateType: project.template_type,
    formattedFileSize: project.formatted_file_size,
  }
}

/** Multi-output projects (e.g. YT + Gameplay Short) become one card per rendered clip. */
const buildVideoItemsFromProject = (project: any): VideoItem[] => {
  const base = buildVideoItemFromProject(project)
  const outputs = Array.isArray(project.output_videos)
    ? project.output_videos.filter((v: any) => v?.url)
    : []

  if (outputs.length <= 1) return [base]

  return outputs.map((output: any, index: number) => ({
    ...base,
    key: `${project.id}-${index + 1}`,
    title: `${base.title} · Clip ${index + 1}`,
    thumbnail_path: output.thumbnail || base.thumbnail_path,
    duration: formatClipDuration(output.duration) || base.duration,
    outputPath: output.url,
    formattedFileSize: null,
  }))
}

const getAspectRatioValue = (video: VideoItem) => {
  if (video.width && video.height) return video.width / video.height
  const [width, height] = video.aspectRatio.split(':').map(Number)
  return height > 0 ? width / height : 16 / 9
}

const isPortrait = (video: VideoItem) => getAspectRatioValue(video) < 1
const getGridColsClass = (video: VideoItem) => (isPortrait(video) ? 'col-span-1' : 'col-span-1 lg:col-span-2')
const getAspectRatioClass = (video: VideoItem) => (isPortrait(video) ? 'aspect-[9/16]' : 'aspect-video')

const Thumb = ({ video, children }: { video: VideoItem; children?: React.ReactNode }) => (
  <div
    className={cn('relative overflow-hidden', getAspectRatioClass(video))}
    style={
      video.thumbnail_path
        ? { backgroundImage: `url(${video.thumbnail_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: gradientFor(video.id) }
    }
  >
    {!video.thumbnail_path && (
      <div className="absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,.04),rgba(255,255,255,.04)_7px,transparent_7px,transparent_15px)]" />
    )}
    {children}
  </div>
)

function VideosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // The header search navigates here with ?q=… — seed the local box from it.
  const queryParam = searchParams.get('q') ?? ''
  const { projects, isFetchingProjects, fetchProjectsError, fetchProjects } = useProject()
  const [isGridView, setIsGridView] = useState(true)
  const [searchQuery, setSearchQuery] = useState(queryParam)

  useEffect(() => {
    fetchProjects().catch(() => {})
  }, [fetchProjects])

  // Keep the box in sync whenever the header sends a new query.
  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  const videos = useMemo(
    () => projects.filter((p) => p.output_path || p.status === 'completed').flatMap(buildVideoItemsFromProject),
    [projects]
  )

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return videos
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.templateType ?? '').toLowerCase().includes(q)
    )
  }, [videos, searchQuery])

  const openVideo = (video: VideoItem) => {
    if (video.outputPath) window.open(video.outputPath, '_blank')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">My Videos</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Every finished render, ready to download and share.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 shadow-soft sm:w-[260px]">
            <Search className="h-4 w-4 text-ink3" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos"
              className="flex-1 border-none bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-ink3"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
            <button
              onClick={() => setIsGridView(true)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                isGridView ? 'bg-primary text-primary-foreground' : 'text-ink3 hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                !isGridView ? 'bg-primary text-primary-foreground' : 'text-ink3 hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* States */}
      {isFetchingProjects && filteredVideos.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading videos…
        </div>
      ) : fetchProjectsError ? (
        <div className="rounded-2xl border border-accent-line bg-accent-soft p-6 text-sm text-primary">
          {fetchProjectsError}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-inset">
            <Play className="h-8 w-8 text-ink3" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No videos yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Finished renders will appear here.</p>
          <button
            onClick={() => router.push('/dashboard/templates')}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Create a video
          </button>
        </div>
      ) : isGridView ? (
        <div className="grid auto-rows-max grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className={getGridColsClass(video)}
            >
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-transform hover:-translate-y-0.5">
                <button onClick={() => openVideo(video)} className="block w-full text-left">
                  <Thumb video={video}>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                      <Play className="h-12 w-12 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur">
                      {video.duration}
                    </span>
                    <span className="absolute right-2.5 top-2.5 rounded-md bg-black/40 px-2 py-0.5 text-[10.5px] font-bold text-white backdrop-blur">
                      {video.aspectRatio}
                    </span>
                  </Thumb>
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-[14.5px] font-semibold text-foreground">{video.title}</h3>
                  <p className="mt-1 text-[12px] text-ink3">
                    {video.date}
                    {video.formattedFileSize ? ` · ${video.formattedFileSize}` : ''}
                  </p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <button
                      disabled={!video.outputPath}
                      onClick={() => openVideo(video)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card text-[13px] font-semibold text-foreground disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="group flex gap-4 rounded-2xl border border-border bg-card p-3.5 shadow-soft transition-colors hover:bg-inset"
            >
              <button onClick={() => openVideo(video)} className="w-28 flex-shrink-0 overflow-hidden rounded-xl sm:w-36">
                <Thumb video={video}>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                    <Play className="h-7 w-7 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                    {video.duration}
                  </span>
                </Thumb>
              </button>

              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                <div>
                  <h3 className="truncate text-[14.5px] font-semibold text-foreground">{video.title}</h3>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{video.date}</p>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-ink3">
                  <span className="rounded-md bg-inset px-2 py-0.5 font-semibold text-muted-foreground">{video.aspectRatio}</span>
                  {video.formattedFileSize && <span>{video.formattedFileSize}</span>}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-start gap-1.5">
                <button
                  disabled={!video.outputPath}
                  onClick={() => openVideo(video)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-50"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground" title="Share">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-destructive" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VideosPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading videos…
        </div>
      }
    >
      <VideosPageContent />
    </Suspense>
  )
}
