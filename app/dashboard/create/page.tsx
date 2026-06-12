'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VideoPreview } from '@/components/create/video-preview'
import { Sparkles, ArrowRight, Upload, RefreshCcw, FileText, Play, AlertCircle } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { useProjectProgress } from '@/hooks/usePusher'
import { useTemplates } from '@/hooks/useTemplates'
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
    uploadProjectSettingFile,
    updateProject,
    processProject,
  } = useProject()
  const { templateConfig, loadTemplateConfig } = useTemplates()
  
  const projectProgress = useProjectProgress(projectId ? Number(projectId) : null)
  const dispatch = useAppDispatch()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null)
  const [templateSettings, setTemplateSettings] = useState<Record<string, any>>({})
  const [localError, setLocalError] = useState<string | null>(null)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const selectedTemplateType = currentProject?.template_type ?? null
  const isTemplateUploadRequired = templateConfig?.requires_upload !== false

  useEffect(() => {
    if (!selectedTemplateType) {
      return
    }

    loadTemplateConfig(selectedTemplateType).catch(() => {
      // ignore failure handled in slice
    })
    console.log('Loading template config for type:', selectedTemplateType)
    console.log('Loaded template config:', templateConfig)
  }, [selectedTemplateType, loadTemplateConfig])

  useEffect(() => {
    if (!templateConfig) {
      return
    }

    const defaults: Record<string, any> = {}
    Object.entries(templateConfig.settings_schema ?? {}).forEach(([fieldKey, fieldSchema]) => {
      if (currentProject?.settings && fieldKey in currentProject.settings) {
        defaults[fieldKey] = currentProject.settings[fieldKey]
      } else {
        defaults[fieldKey] = fieldSchema.default ?? (fieldSchema.type === 'checkbox' ? false : '')
      }
    })

    setTemplateSettings(defaults)
  }, [templateConfig, currentProject?.settings])

  const isFieldRequired = (fieldKey: string, fieldSchema: any) => {
    return typeof fieldSchema.required === 'boolean' ? fieldSchema.required : false
  }

  const isFieldVisible = (fieldKey: string, fieldSchema: any) => {
    if (!fieldSchema.visible_when) {
      return true
    }

    // visible_when is an object like: { input_mode: 'youtube_url' }
    return Object.entries(fieldSchema.visible_when).every(([conditionField, conditionValue]) => {
      return templateSettings[conditionField] === conditionValue
    })
  }

  const getFieldValue = (fieldKey: string, fieldSchema: any) => {
    return templateSettings[fieldKey] ?? fieldSchema.default ?? (fieldSchema.type === 'checkbox' ? false : '')
  }

  const validateTemplateFields = () => {
    if (!templateConfig?.settings_schema) {
      return true
    }

    const missingFields = Object.entries(templateConfig.settings_schema)
      .filter(([fieldKey, fieldSchema]) => isFieldVisible(fieldKey, fieldSchema) && isFieldRequired(fieldKey, fieldSchema))
      .filter(([fieldKey, fieldSchema]) => {
        const value = templateSettings[fieldKey]

        // Special case: if fieldKey is video_file and project already has a video_path, it's satisfied
        if (fieldKey === 'video_file' && currentProject?.video_path) {
          return false
        }

        if (fieldSchema.type === 'file') {
          // Missing if not a File object and not a non-empty string path
          return !(value instanceof File) && (!value || String(value).trim().length === 0)
        }

        const strValue = String(
          value ?? templateConfig.settings_schema?.[fieldKey]?.default ?? ''
        ).trim()
        return strValue.length === 0
      })

    if (missingFields.length > 0) {
      setLocalError(
        `Please complete the following required field${missingFields.length > 1 ? 's' : ''}: ${missingFields
          .map(([fieldKey]) => fieldKey)
          .join(', ')}`
      )
      return false
    }

    return true
  }

  const renderTemplateField = (fieldKey: string, fieldSchema: any) => {
    const value = getFieldValue(fieldKey, fieldSchema)
    const required = isFieldRequired(fieldKey, fieldSchema)
    const label = `${fieldSchema.label}${required ? ' *' : ''}`

    const handleSettingChange = (newValue: any) => {
      setTemplateSettings((prev) => ({
        ...prev,
        [fieldKey]: newValue,
      }))
    }

    if (fieldSchema.type === 'textarea') {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          <textarea
            value={value}
            onChange={(event) => handleSettingChange(event.target.value)}
            placeholder={fieldSchema.placeholder ?? fieldSchema.label}
            className="w-full min-h-[120px] rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      )
    }

    if (fieldSchema.type === 'radio' && typeof fieldSchema.options === 'object') {
      return (
        <div key={fieldKey} className="space-y-3">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          <div className="space-y-2">
            {Object.entries(fieldSchema.options).map(([optionValue, optionLabel]) => (
              <div key={optionValue} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`${fieldKey}-${optionValue}`}
                  name={fieldKey}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={(event) => handleSettingChange(event.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <label htmlFor={`${fieldKey}-${optionValue}`} className="text-sm text-foreground cursor-pointer">
                  {optionLabel as string}
                </label>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (fieldSchema.type === 'select' && Array.isArray(fieldSchema.options)) {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          <select
            value={value}
            onChange={(event) => handleSettingChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">-- Select an option --</option>
            {fieldSchema.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldSchema.type === 'select' && typeof fieldSchema.options === 'object' && !Array.isArray(fieldSchema.options)) {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          <select
            value={value}
            onChange={(event) => handleSettingChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">-- Select an option --</option>
            {Object.entries(fieldSchema.options).map(([optionValue, optionLabel]) => (
              <option key={optionValue} value={optionValue}>{optionLabel as string}</option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldSchema.type === 'file') {
      // Determine file display name
      const isFileUploaded = value && typeof value === 'string'
      const isFileSelected = value instanceof File
      const displayName = isFileSelected
        ? (value as File).name
        : isFileUploaded
          ? (value as string).split('/').pop()
          : fieldKey === 'video_file' && currentProject?.video_path
            ? currentProject.video_path.split('/').pop()
            : ''

      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          <input
            type="file"
            accept={fieldSchema.accept ?? '*'}
            onChange={(event) => handleSettingChange(event.target.files?.[0] ?? '')}
            className="w-full px-3 py-2 text-sm text-foreground rounded-xl border border-border bg-background file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {displayName && (
            <p className="text-xs text-green-600 font-medium">
              {isFileSelected ? 'Selected: ' : 'Currently uploaded: '}{displayName}
            </p>
          )}
          {fieldSchema.max_size && (
            <p className="text-xs text-muted-foreground">
              Max file size: {(fieldSchema.max_size / 1024 / 1024).toFixed(0)} MB
            </p>
          )}
        </div>
      )
    }

    if (fieldSchema.type === 'checkbox') {
      return (
        <div key={fieldKey} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleSettingChange(event.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label className="text-sm font-medium text-foreground">{label}</label>
        </div>
      )
    }

    return (
      <div key={fieldKey} className="space-y-2">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <Input
          value={value}
          onChange={(event) => handleSettingChange(event.target.value)}
          placeholder={fieldSchema.placeholder ?? fieldSchema.label}
          className="w-full"
        />
      </div>
    )
  }

  const getTemplateRequirementNotes = () => {
    const notes: string[] = []

    if (templateConfig?.requires_upload === false) {
      notes.push('No video upload is required for this template.')
    } else {
      notes.push('This template requires a video upload before processing.')
    }

    const requiredFields = Object.entries(templateConfig?.settings_schema ?? {})
      .filter(([fieldKey, fieldSchema]) => isFieldVisible(fieldKey, fieldSchema) && fieldSchema.required)
      .map(([fieldKey, fieldSchema]) => fieldSchema.label ?? fieldKey)

    if (requiredFields.length > 0) {
      notes.push(`Required fields: ${requiredFields.join(', ')}.`)
    }

    return notes
  }

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

  const sanitizeSettingsForBackend = (settings: Record<string, any>) => {
    const sanitized: Record<string, any> = {}
    
    Object.entries(settings).forEach(([key, value]) => {
      const fieldSchema = templateConfig?.settings_schema?.[key]
      
      // For file fields, convert File objects to empty strings
      if (fieldSchema?.type === 'file') {
        sanitized[key] = value instanceof File ? '' : (value ?? '')
      } else {
        sanitized[key] = value ?? ''
      }
    })
    
    return sanitized
  }

  const handleProcess = async () => {
    if (!projectId || !currentProject) {
      return
    }

    setLocalError(null)

    if (!validateTemplateFields()) {
      return
    }

    if (isTemplateUploadRequired && !currentProject.video_path) {
      setLocalError('This template requires a video upload before processing.')
      return
    }

    try {
      // 1. Upload any File objects in templateSettings first
      const updatedSettings = { ...templateSettings }
      let latestProject = currentProject

      for (const [key, value] of Object.entries(templateSettings)) {
        if (value instanceof File) {
          if (key === 'video_file') {
            // Upload main video using existing hook
            latestProject = await uploadProjectVideo({
              projectId: Number(projectId),
              video: value,
            })
            // Extract relative storage path from the full URL returned by API Resource
            const pathUrl = latestProject.video_path ?? ''
            const storageIndex = pathUrl.indexOf('/storage/')
            const relativePath = storageIndex !== -1 ? pathUrl.substring(storageIndex + 9) : pathUrl
            // Update the settings key to the relative video path
            updatedSettings[key] = relativePath
          } else {
            // Upload settings file using new generic endpoint
            const uploadResult = await uploadProjectSettingFile({
              projectId: Number(projectId),
              fieldKey: key,
              file: value,
            })
            // Update the settings key to the returned file path
            updatedSettings[key] = uploadResult.path
          }
        }
      }

      // 2. Sanitize and save updated settings to backend
      const sanitizedSettings = sanitizeSettingsForBackend(updatedSettings)
      const settingsChanged = JSON.stringify(currentProject.settings ?? {}) !== JSON.stringify(sanitizedSettings)
      
      if (settingsChanged) {
        await updateProject({
          projectId: Number(projectId),
          data: { settings: sanitizedSettings },
        })
      }

      // Extra check: if in upload mode, ensure a video path actually exists
      if (sanitizedSettings.input_mode === 'upload' && !latestProject.video_path) {
        setLocalError('Please select and upload a source video file.')
        return
      }

      // 3. Start processing
      await processProject(Number(projectId))
    } catch (error: any) {
      setLocalError(error?.message || error || 'Failed to start processing. Please try again.')
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

  const canUpload = Boolean(
    projectId &&
      selectedFile &&
      currentProject?.status !== 'processing' &&
      isTemplateUploadRequired
  )

  const canProcess = Boolean(
    projectId &&
      currentProject &&
      currentProject.status !== 'processing' &&
      currentProject.status !== 'completed' &&
      currentProject.status !== 'failed' &&
      (!isTemplateUploadRequired || Boolean(currentProject.video_path))
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
            {templateConfig?.requires_upload === false
              ? 'Provide prompt details for the selected AI shorts template and start processing.'
              : 'Upload your video and start AI processing.'}
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
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  {isTemplateUploadRequired ? 'Upload video' : 'Template inputs'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTemplateUploadRequired
                    ? 'Select a video file to attach to this project.'
                    : 'This template does not require a video upload. Review the template fields below and start processing when ready.'}
                </p>
              </div>

              {!isTemplateUploadRequired ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/80 p-4">
                    <p className="text-sm text-muted-foreground">Template name</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {templateConfig?.name ?? currentProject?.template_type ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {templateConfig?.description ?? 'No additional template description available.'}
                    </p>
                  </div>

                  {templateConfig?.settings_schema ? (
                    <div className="rounded-xl border border-border bg-background/80 p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Template fields</h4>
                      {Object.entries(templateConfig.settings_schema).map(([fieldKey, fieldSchema]) =>
                        isFieldVisible(fieldKey, fieldSchema) ? renderTemplateField(fieldKey, fieldSchema) : null
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background/80 p-4">
                      <p className="text-sm text-muted-foreground">This template has no configurable fields.</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {templateConfig?.settings_schema ? (
                    <div className="rounded-xl border border-border bg-background/80 p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Template fields</h4>
                      {Object.entries(templateConfig.settings_schema).map(([fieldKey, fieldSchema]) =>
                        isFieldVisible(fieldKey, fieldSchema) ? renderTemplateField(fieldKey, fieldSchema) : null
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background/80 p-4">
                      <p className="text-sm text-muted-foreground">This template has no configurable fields.</p>
                    </div>
                  )}
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
                </>
              )}

              {!isTemplateUploadRequired && (
                <div className="mt-5">
                  <Button
                    onClick={handleProcess}
                    disabled={!canProcess || isProcessing}
                    className="h-11 sm:h-12 font-semibold"
                  >
                    {isProcessing ? 'Processing...' : 'Start Processing'}
                  </Button>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Selected project template</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {templateConfig?.name ?? currentProject?.template_type ?? 'Not selected'}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-background/80 p-4">
                <h4 className="text-sm font-semibold text-foreground">Requirements</h4>
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  {getTemplateRequirementNotes().map((note) => (
                    <p key={note}>• {note}</p>
                  ))}
                </div>
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
              {currentProject?.video_path && (
                <div className="mt-3">
                  <Button
                    onClick={() => {
                      const url = `/editor?projectId=${projectId}`;
                      window.location.href = url;
                    }}
                    size="sm"
                  >
                    Edit Video
                  </Button>
                </div>
              )}
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
