'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Grid3x3, List, MoreVertical, Play, Download, Trash2, Share2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProject } from '@/hooks/useProject'

interface VideoItem {
  id: number
  title: string
  thumbnail_path: string
  thumbnailClass: string
  duration: string
  aspectRatio: string
  width: number
  height: number
  views: number
  likes: number
  date: string
  outputPath?: string | null
  videoPath?: string | null
  status?: string | null
  templateType?: string | null
  completedAt?: string | null
  fileType?: string | null
  fileSize?: number | null
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

const TEMPLATE_THUMBNAIL_CLASSES: Record<string, string> = {
  yt_automation_short: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  youtube_short: 'bg-gradient-to-br from-orange-500 to-rose-500',
  tiktok: 'bg-gradient-to-br from-slate-900 to-slate-700',
  instagram_story: 'bg-gradient-to-br from-pink-500 to-yellow-400',
  yt_automation_long: 'bg-gradient-to-br from-sky-500 to-cyan-500',
  youtube_long: 'bg-gradient-to-br from-blue-500 to-teal-500',
  default: 'bg-gradient-to-br from-slate-600 to-slate-800',
}

const getAspectRatioFromTemplateType = (templateType?: string) => {
  if (!templateType) return TEMPLATE_ASPECT_RATIOS.default
  return TEMPLATE_ASPECT_RATIOS[templateType] || TEMPLATE_ASPECT_RATIOS.default
}

const getProjectThumbnailClass = (templateType?: string) => {
  if (!templateType) return TEMPLATE_THUMBNAIL_CLASSES.default
  return TEMPLATE_THUMBNAIL_CLASSES[templateType] || TEMPLATE_THUMBNAIL_CLASSES.default
}

const formatProjectDate = (date?: string) => {
  if (!date) return 'Unknown date'
  const parsed = new Date(date)
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const buildVideoItemFromProject = (project: any): VideoItem => {
  const aspectRatio = getAspectRatioFromTemplateType(project.template_type)
  const [width, height] = aspectRatio.split(':').map(Number)

  return {
    id: project.id,
    title: project.title || project.file_name || `Project ${project.id}`,
    thumbnail_path: project.thumbnail_path,
    thumbnailClass: getProjectThumbnailClass(project.template_type),
    duration: project.formatted_duration || '0:00',
    aspectRatio,
    width: project.width || width * 90,
    height: project.height || height * 90,
    views: project.file_size || 0,
    likes: 0,
    date: formatProjectDate(project.completed_at || project.created_at),
    outputPath: project.output_path || project.video_path,
    videoPath: project.video_path,
    status: project.status,
    templateType: project.template_type,
    completedAt: project.completed_at,
    fileType: project.file_type,
    fileSize: project.file_size,
    formattedFileSize: project.formatted_file_size,
  }
}

const getAspectRatioValue = (video: VideoItem) => {
  if (video.width && video.height) {
    return video.width / video.height
  }

  const [width, height] = video.aspectRatio.split(':').map(Number)
  return height > 0 ? width / height : 16 / 9
}

const isPortrait = (video: VideoItem) => getAspectRatioValue(video) < 1

const getGridColsClass = (video: VideoItem, isGridView: boolean) => {
  if (!isGridView) return 'col-span-1'
  return isPortrait(video) ? 'col-span-1' : 'col-span-1 lg:col-span-2'
}

const getAspectRatioClass = (video: VideoItem) => {
  return isPortrait(video) ? 'aspect-[9/16]' : 'aspect-video'
}

export default function VideosPage() {
  const { projects, isFetchingProjects, fetchProjectsError, fetchProjects } = useProject()
  const [isGridView, setIsGridView] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProjects().catch(() => {})
  }, [fetchProjects])

  const videos = useMemo(
    () =>
      projects
        .filter((project) => project.output_path || project.status === 'completed')
        .map(buildVideoItemFromProject),
    [projects]
  )

  const filteredVideos = useMemo(
    () =>
      videos.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [videos, searchQuery]
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">My Videos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and organize all your created videos</p>
        </motion.div>

        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg border border-border bg-card/50 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={isGridView ? 'default' : 'outline'}
              size="icon"
              onClick={() => setIsGridView(true)}
              className="w-10 h-10"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={!isGridView ? 'default' : 'outline'}
              size="icon"
              onClick={() => setIsGridView(false)}
              className="w-10 h-10"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Videos Grid */}
        {isFetchingProjects ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
          >
            Loading videos...
          </motion.div>
        ) : fetchProjectsError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-800">
            {fetchProjectsError}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No output videos found yet. Create a new project or refresh the page.
          </div>
        ) : isGridView ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-max"
          >
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={getGridColsClass(video, isGridView)}
              >
                <div className="group rounded-lg sm:rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col">
                  {/* Video Thumbnail */}
                  <div
                    className={`relative ${getAspectRatioClass(video)} overflow-hidden ${video.thumbnail_path ? '' : video.thumbnailClass}`}
                    style={
                      video.thumbnail_path
                        ? {
                            backgroundImage: `url(${video.thumbnail_path})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <Play className="w-12 h-12 sm:w-16 sm:h-16 text-white fill-white" />
                      </motion.div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 sm:px-2.5 py-1 bg-black/80 rounded-md text-xs sm:text-sm font-semibold text-white">
                      {video.duration}
                    </div>

                    {/* Aspect Ratio Badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-1 bg-primary/80 rounded-md text-xs font-semibold text-primary-foreground">
                      {video.aspectRatio}
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 mb-2">{video.title}</h3>
                    
                    {/* <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 sm:mb-4">
                      <Eye className="w-3 h-3" />
                      <span>{(video.views / 1000).toFixed(0)}K views</span>
                      <span className="text-primary font-semibold">{(video.likes / 1000).toFixed(1)}K</span>
                    </div> */}

                    <p className="text-xs text-muted-foreground mb-3 sm:mb-4">{video.date}</p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm gap-1 sm:gap-2"
                        disabled={!video.outputPath}
                        onClick={() => video.outputPath && window.open(video.outputPath, '_blank')}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 sm:h-9 w-8 sm:w-9">
                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3 sm:space-y-4"
          >
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group rounded-lg sm:rounded-xl border border-border bg-card/50 hover:border-primary/50 hover:bg-card transition-all duration-300 p-3 sm:p-4 flex gap-3 sm:gap-4"
              >
                {/* Thumbnail */}
                <div
                  className={`flex-shrink-0 ${getAspectRatioClass(video)} rounded-lg overflow-hidden relative w-24 sm:w-32 lg:w-40 ${video.thumbnail_path ? '' : video.thumbnailClass}`}
                  style={
                    video.thumbnail_path
                      ? {
                          backgroundImage: `url(${video.thumbnail_path})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <motion.div whileHover={{ scale: 1.1 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 px-2 py-0.5 bg-black/80 rounded text-xs font-semibold text-white">
                    {video.duration}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{video.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{video.date}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">{video.aspectRatio}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(video.views / 1000).toFixed(0)}K
                    </span>
                    <span className="text-primary font-semibold">{(video.likes / 1000).toFixed(1)}K likes</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 sm:w-9 sm:h-9"
                    title="Download"
                    disabled={!video.outputPath}
                    onClick={() => video.outputPath && window.open(video.outputPath, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8 sm:w-9 sm:h-9" title="Share">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8 sm:w-9 sm:h-9 hover:text-destructive" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {filteredVideos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-12 sm:py-20"
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No videos found</h3>
              <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or create a new video</p>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create First Video
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
