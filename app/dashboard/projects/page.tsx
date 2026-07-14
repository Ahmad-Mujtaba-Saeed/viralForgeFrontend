'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RefreshCcw, Play, AlertCircle, Plus, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { retryProject } from '@/store/projectSlice'
import { useProject } from '@/hooks/useProject'
import { useAppDispatch } from '@/hooks/useAuth'
import { useProjectsLiveProgress } from '@/hooks/useProjectsLiveProgress'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const statusBadge = (status?: string): { label: string; cls: string } => {
  switch (status) {
    case 'completed':
      return { label: 'Done', cls: 'bg-good-soft text-good' }
    case 'processing':
      return { label: 'Rendering', cls: 'bg-warn-soft text-warn' }
    case 'failed':
      return { label: 'Failed', cls: 'bg-accent-soft text-primary' }
    default:
      return { label: 'Draft', cls: 'bg-inset text-muted-foreground' }
  }
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

const prettyTemplate = (t?: string) =>
  (t || 'Project').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const ProjectsSkeletonGrid = () => (
  <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
        <Skeleton className={cn('w-full rounded-none', i % 2 === 0 ? 'aspect-video' : 'aspect-[9/16]')} />
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

export default function ProjectsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { projects, isFetchingProjects, fetchProjectsError, fetchProjects, deleteProject } = useProject()
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [retryErrors, setRetryErrors] = useState<Record<number, string>>({})
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchProjects().catch(() => {})
  }, [fetchProjects])

  const processingIds = useMemo(
    () => projects.filter((p) => p.status === 'processing').map((p) => p.id),
    [projects]
  )
  useProjectsLiveProgress(processingIds)

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return
    const id = pendingDeleteId
    setDeletingId(id)
    try {
      await deleteProject(id)
      toast.success('Project deleted.')
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete project.')
    } finally {
      setDeletingId(null)
      setPendingDeleteId(null)
    }
  }

  const openProject = (project: { id: number; template_type?: string }) => {
    if (project.template_type === 'ai_explainer_video') {
      router.push(`/dashboard/explainer/${project.id}`)
    } else {
      router.push(`/dashboard/create?projectId=${project.id}`)
    }
  }

  const handleRetryProject = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation()
    setRetryingId(projectId)
    setRetryErrors((prev) => {
      const next = { ...prev }
      delete next[projectId]
      return next
    })
    try {
      await dispatch(retryProject(projectId)).unwrap()
      await fetchProjects()
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message || 'Failed to retry. Please try again.'
      setRetryErrors((prev) => ({ ...prev, [projectId]: message }))
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Every project you&apos;ve created — continue editing, render, or retry.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchProjects().catch(() => {})}
            disabled={isFetchingProjects}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-soft disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${isFetchingProjects ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => router.push('/dashboard/templates')}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-soft"
          >
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>
      </div>

      {fetchProjectsError && (
        <div className="rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">
          {fetchProjectsError}
        </div>
      )}

      {isFetchingProjects && projects.length === 0 ? (
        <ProjectsSkeletonGrid />
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No projects yet. Start from a template.</p>
          <button
            onClick={() => router.push('/dashboard/templates')}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Browse templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => {
            const badge = statusBadge(project.status)
            const isFailed = project.status === 'failed'
            const aspectRatio = (project.aspect_ratio || '16:9').replace(':', '/')
            return (
              <motion.div
                key={project.id}
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  disabled={isFailed}
                  className="block w-full cursor-pointer text-left disabled:cursor-default"
                >
                  <div
                    className="relative flex w-full items-center justify-center overflow-hidden"
                    style={{ background: gradientFor(project.id), aspectRatio }}
                  >
                    {project.thumbnail_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.thumbnail_path}
                        alt={project.title || 'thumbnail'}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,.04),rgba(255,255,255,.04)_7px,transparent_7px,transparent_15px)]" />
                    )}
                    {!isFailed && (
                      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                        <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
                      </span>
                    )}
                    <span className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {project.status === 'processing' && (
                      <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10.5px] text-white backdrop-blur">
                        {project.progress ?? 0}%
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-[14.5px] font-semibold text-foreground">
                        {project.title || 'Untitled Project'}
                      </h2>
                      {!isFailed && (
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-ink3">
                      <span className="truncate">{prettyTemplate(project.template_type)}</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-ink3" />
                      <span>ID {project.id}</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDeleteId(project.id)}
                  className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-black/40 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/60 group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {isFailed && (
                  <div className="border-t border-line2 px-4 pb-4 pt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warn" />
                      <div className="min-w-0 flex-1">
                        {project.failed_step && (
                          <p className="text-[11.5px] text-muted-foreground">
                            Failed at{' '}
                            <span className="font-medium capitalize">{project.failed_step.replace(/_/g, ' ')}</span>
                          </p>
                        )}
                        {project.error_message && (
                          <p className="mt-0.5 line-clamp-2 break-words text-[11px] text-ink3">{project.error_message}</p>
                        )}
                        {retryErrors[project.id] && (
                          <p className="mt-0.5 text-[11px] text-primary">{retryErrors[project.id]}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRetryProject(e, project.id)}
                      disabled={retryingId === project.id}
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-[13px] font-semibold text-foreground disabled:opacity-60"
                    >
                      <RefreshCcw className={`h-3.5 w-3.5 ${retryingId === project.id ? 'animate-spin' : ''}`} />
                      {retryingId === project.id ? 'Retrying…' : 'Retry processing'}
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project and any rendered output. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={deletingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId !== null}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
            >
              {deletingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
