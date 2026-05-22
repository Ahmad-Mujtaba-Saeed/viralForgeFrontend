'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { VideoPreview } from '@/components/create/video-preview'
import { Sparkles, ArrowRight, Upload, RefreshCcw, FileText, Play, AlertCircle } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { useProjectProgress } from '@/hooks/usePusher'
import { useAppDispatch } from '@/hooks/useAuth'
import { updateCurrentProject, retryProject } from '@/store/projectSlice'

function CreatePageContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const {
    currentProject,
    isFetching,
    isUploading,
    isProcessing,
    error,
    fetchProjectById,
    uploadProjectVideo,
    processProject,
  } = useProject()
  
  const projectProgress = useProjectProgress(projectId ? Number(projectId) : null)
  const dispatch = useAppDispatch()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!projectId) {
      return
    }

    fetchProjectById(Number(projectId)).catch(() => {
      // handled in slice
    })
  }, [projectId, fetchProjectById])

  // Subscribe to Pusher progress updates
  useEffect(() => {
    if (!projectId) return

    const unsubscribe = projectProgress.onProgress((data) => {
      setDisplayProgress(data.progress)
      // keep redux store in sync so refresh shows updated value
      try {
        dispatch(updateCurrentProject({ progress: data.progress }))
      } catch (e) {
        // ignore
      }
    })

    return unsubscribe
  }, [projectId, projectProgress])

  // Subscribe to Pusher status updates
  useEffect(() => {
    if (!projectId) return

    const unsubscribe = projectProgress.onStatus((data) => {
      if (data.status === 'processing') {
        setLocalError(null)
      }
      try {
        dispatch(updateCurrentProject({ status: data.status }))
      } catch (e) {
        // ignore
      }
    })

    return unsubscribe
  }, [projectId, projectProgress])

  // Subscribe to Pusher completion updates
  useEffect(() => {
    if (!projectId) return

    const unsubscribe = projectProgress.onCompletion((data) => {
      setDisplayProgress(100)
      try {
        dispatch(updateCurrentProject({ progress: 100, status: 'completed' }))
      } catch (e) {
        // ignore
      }
      fetchProjectById(Number(projectId)).catch(() => {
        // handled in slice
      })
    })

    return unsubscribe
  }, [projectId, projectProgress, fetchProjectById])

  // Subscribe to Pusher error updates
  useEffect(() => {
    if (!projectId) return

    const unsubscribe = projectProgress.onError((data) => {
      setLocalError(data.error)
      try {
        dispatch(updateCurrentProject({ status: 'failed', error_message: data.error }))
      } catch (e) {
        // ignore
      }
    })

    return unsubscribe
  }, [projectId, projectProgress])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setSelectedFileName(file?.name ?? '')
    
    // Create preview URL for the selected file
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setSelectedFilePreview(previewUrl)
    } else {
      setSelectedFilePreview(null)
    }
    setLocalError(null)
  }

  const handleUpload = async () => {
    if (!projectId || !selectedFile) {
      setLocalError('Please select a video file before uploading.')
      return
    }

    setLocalError(null)

    try {
      await uploadProjectVideo({
        projectId: Number(projectId),
        video: selectedFile,
      })
      setSelectedFile(null)
      setSelectedFileName('')
      setSelectedFilePreview(null)
      
      // Auto-start processing after upload completes
      await processProject(Number(projectId))
    } catch (error) {
      setLocalError('Failed to upload video. Please try again.')
      console.error(error)
    }
  }

  const handleProcess = async () => {
    if (!projectId) {
      return
    }

    setLocalError(null)

    try {
      await processProject(Number(projectId))
    } catch (error) {
      setLocalError('Failed to start processing. Please try again.')
      console.error(error)
    }
  }

  const handleRetry = async () => {
    if (!projectId) {
      return
    }

    setIsRetrying(true)
    setLocalError(null)

    try {
      const result = await dispatch(retryProject(Number(projectId))).unwrap()
      dispatch(updateCurrentProject({ 
        status: 'processing', 
        progress: 0,
        error_message: null,
        failed_step: null
      }))
    } catch (error: any) {
      setLocalError(error || 'Failed to retry processing. Please try again.')
      console.error(error)
    } finally {
      setIsRetrying(false)
    }
  }

  const canUpload = Boolean(projectId && selectedFile && currentProject?.status !== 'processing')
  const canProcess = Boolean(
    projectId &&
      currentProject?.video_path &&
      currentProject.status !== 'processing' &&
      currentProject.status !== 'completed' &&
      currentProject.status !== 'failed'
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Project Workflow</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload your video and start AI processing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="rounded-xl sm:rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6">
              <div className="mb-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">Project status</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {projectId
                        ? 'Manage the selected project and track progress.'
                        : 'Pick a template first from the Templates page.'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => projectId && fetchProjectById(Number(projectId))}
                    className="h-10 w-10"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {currentProject?.title ?? 'No project loaded'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                  <p className="mt-2 text-sm font-semibold text-foreground capitalize">
                    {isFetching ? 'Loading...' : currentProject?.status ?? 'pending'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {currentProject?.progress ?? 0}%
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Video uploaded</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {currentProject?.video_path ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {(error || localError) && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {localError || error}
                </div>
              )}

              {currentProject?.status === 'failed' && (
                <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900">Processing Failed</h4>
                      {currentProject.failed_step && (
                        <p className="text-sm text-orange-800 mt-1">
                          Failed at: <span className="font-medium capitalize">{currentProject.failed_step.replace(/_/g, ' ')}</span>
                        </p>
                      )}
                      {currentProject.error_message && (
                        <p className="text-xs text-orange-700 mt-2">{currentProject.error_message}</p>
                      )}
                      <Button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        size="sm"
                        className="mt-3 bg-orange-600 hover:bg-orange-700"
                      >
                        <RefreshCcw className={`h-3 w-3 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Retrying...' : 'Retry Processing'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Upload video</h3>
                <p className="text-sm text-muted-foreground mt-1">Select a video file to attach to this project.</p>
              </div>

              <label className="block">
                <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-background/80">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {selectedFileName || 'Drop your video or click to browse'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI, WEBM</p>
                </div>
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleUpload}
                  disabled={!canUpload || isUploading}
                  className="h-11 sm:h-12 font-semibold"
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </Button>
                <Button
                  onClick={handleProcess}
                  disabled={!canProcess || isProcessing}
                  className="h-11 sm:h-12 font-semibold"
                >
                  {isProcessing ? 'Processing...' : 'Start Processing'}
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Selected project template</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{currentProject?.template_type ?? 'Not selected'}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-20 h-fit"
          >
            <div className="rounded-xl sm:rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Live Preview</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Watch the project progress while AI works.</p>
              </div>
              <VideoPreview
                status={currentProject?.status}
                progress={currentProject?.progress ?? 0}
                isUploading={isUploading}
                isUploadingDone={currentProject?.video_path ? true : false}
                selectedFilePreview={selectedFilePreview}
                outputVideoUrl={currentProject?.output_path}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}
