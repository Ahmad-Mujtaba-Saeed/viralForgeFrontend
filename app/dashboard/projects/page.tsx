'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FolderOpen, ArrowRight, RefreshCcw, Play, Clock4, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { retryProject } from '@/store/projectSlice'
import { useProject } from '@/hooks/useProject'
import { useAppDispatch } from '@/hooks/useAuth'

export default function ProjectsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const {
    projects,
    isFetchingProjects,
    fetchProjectsError,
    fetchProjects,
  } = useProject()
  const [retryingId, setRetryingId] = useState<number | null>(null)

  useEffect(() => {
    fetchProjects().catch(() => {})
  }, [fetchProjects])

  const handleSelectProject = (projectId: number) => {
    router.push(`/dashboard/create?projectId=${projectId}`)
  }

  const handleRetryProject = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation()
    setRetryingId(projectId)

    try {
      await dispatch(retryProject(projectId)).unwrap()
      await fetchProjects()
    } catch (err: any) {
      console.error('Failed to retry project:', err)
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <FolderOpen className="h-5 w-5" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Browse all created projects and continue editing or processing them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProjects().catch(() => {})}
                className="inline-flex items-center gap-2"
                disabled={isFetchingProjects}
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/dashboard/templates')}
                className="inline-flex items-center gap-2"
              >
                New Project
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {isFetchingProjects ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading projects...
            </div>
          ) : fetchProjectsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              {fetchProjectsError}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No projects found yet. Create a new one from Templates.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={project.status !== 'failed' ? { y: -2 } : {}}
                  className="group w-full rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
                >
                  {project.status === 'failed' && (
                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-orange-900">Processing Failed</p>
                        {project.failed_step && (
                          <p className="text-xs text-orange-800 mt-1">
                            Failed at: <span className="font-medium capitalize">{project.failed_step.replace(/_/g, ' ')}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectProject(project.id)}
                    disabled={project.status === 'failed'}
                    className="w-full text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.24em]">
                          Project ID {project.id}
                        </p>
                        <h2 className="mt-2 text-lg font-semibold text-foreground">
                          {project.title || 'Untitled Project'}
                        </h2>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{project.template_type || 'Unknown template'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock4 className="h-4 w-4" />
                        <span>{project.progress ?? 0}% progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        <span className="capitalize">{project.status ?? 'pending'}</span>
                      </div>
                    </div>
                  </button>

                  {project.status === 'failed' && (
                    <Button
                      onClick={(e) => handleRetryProject(e, project.id)}
                      disabled={retryingId === project.id}
                      size="sm"
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      <RefreshCcw className={`h-3 w-3 mr-2 ${retryingId === project.id ? 'animate-spin' : ''}`} />
                      {retryingId === project.id ? 'Retrying...' : 'Retry Processing'}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
