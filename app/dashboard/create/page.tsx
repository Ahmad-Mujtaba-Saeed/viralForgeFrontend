'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCcw,
  AlertCircle,
  Sparkles,
  Info,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import { useProject } from '@/hooks/useProject'
import { useBilling } from '@/hooks/useBilling'
import { useProjectProgress } from '@/hooks/usePusher'
import { useTemplates } from '@/hooks/useTemplates'
import { useAppDispatch } from '@/hooks/useAuth'
import { updateCurrentProject, retryProject } from '@/store/projectSlice'
import { SteppedPreview } from '@/components/create/stepped-preview'
import { CaptionSample, captionStyleFor } from '@/components/create/caption-styles'
import { isSourceField, voiceLabel, voiceColor, prettyLabel } from '@/components/create/field-steps'

type StepKey = 'source' | 'style' | 'generate'

const STEP_META: Record<StepKey, { title: string; sub: string }> = {
  source: { title: 'Source', sub: 'Upload or input' },
  style: { title: 'Style & voice', sub: 'Look and sound' },
  generate: { title: 'Generate', sub: 'Review & render' },
}

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
  const { credits, hasSubscription, costFor, fetchBilling } = useBilling()

  const projectProgress = useProjectProgress(projectId ? Number(projectId) : null)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const [stepKey, setStepKey] = useState<StepKey>('source')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null)
  const [templateSettings, setTemplateSettings] = useState<Record<string, any>>({})
  const [localError, setLocalError] = useState<string | null>(null)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  // Synchronous re-entry guard so a fast double-click can't fire two renders.
  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---- narrator voice preview (▶ on a voice chip plays a cached sample) ----
  const [previewVoice, setPreviewVoice] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Stop any playing sample when leaving the page.
    return () => {
      previewAudioRef.current?.pause()
      previewAudioRef.current = null
    }
  }, [])

  const playVoicePreview = async (voiceId: string) => {
    // Clicking the active chip's button stops playback.
    if (previewVoice === voiceId) {
      previewAudioRef.current?.pause()
      previewAudioRef.current = null
      setPreviewVoice(null)
      return
    }

    previewAudioRef.current?.pause()
    previewAudioRef.current = null
    setPreviewVoice(voiceId)
    setPreviewLoading(true)

    try {
      const res = await api.post('/api/tts/preview', { voice: voiceId })
      const url: string | undefined = res.data?.url
      if (!url) throw new Error('No preview URL')

      const src = url.startsWith('http') ? url : `${api.defaults.baseURL ?? ''}${url}`
      const audio = new Audio(src)
      previewAudioRef.current = audio
      audio.onended = () => setPreviewVoice((v) => (v === voiceId ? null : v))
      audio.onerror = () => setPreviewVoice((v) => (v === voiceId ? null : v))
      await audio.play()
    } catch {
      setPreviewVoice((v) => (v === voiceId ? null : v))
    } finally {
      setPreviewLoading(false)
    }
  }

  const selectedTemplateType = currentProject?.template_type ?? null
  const isTemplateUploadRequired = templateConfig?.requires_upload !== false

  useEffect(() => {
    if (!selectedTemplateType) return
    loadTemplateConfig(selectedTemplateType).catch(() => {})
  }, [selectedTemplateType, loadTemplateConfig])

  useEffect(() => {
    fetchBilling().catch(() => {})
  }, [fetchBilling])

  const renderCost = selectedTemplateType ? costFor(selectedTemplateType) : 0
  const canAffordRender = hasSubscription && credits >= renderCost

  useEffect(() => {
    if (!templateConfig) return
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

  // ---- schema helpers (unchanged behaviour) ----
  const isFieldRequired = (fieldKey: string, fieldSchema: any) =>
    typeof fieldSchema.required === 'boolean' ? fieldSchema.required : false

  const isFieldVisible = (fieldKey: string, fieldSchema: any) => {
    if (!fieldSchema.visible_when) return true
    return Object.entries(fieldSchema.visible_when).every(
      ([conditionField, conditionValue]) => templateSettings[conditionField] === conditionValue
    )
  }

  const getFieldValue = (fieldKey: string, fieldSchema: any) =>
    templateSettings[fieldKey] ?? fieldSchema.default ?? (fieldSchema.type === 'checkbox' ? false : '')

  const validateEntries = (entries: [string, any][]) => {
    const missingFields = entries
      .filter(([fieldKey, fieldSchema]) => isFieldVisible(fieldKey, fieldSchema) && isFieldRequired(fieldKey, fieldSchema))
      .filter(([fieldKey, fieldSchema]) => {
        const value = templateSettings[fieldKey]
        if (fieldKey === 'video_file' && currentProject?.video_path) return false
        if (fieldSchema.type === 'file') {
          return !(value instanceof File) && (!value || String(value).trim().length === 0)
        }
        const strValue = String(value ?? fieldSchema?.default ?? '').trim()
        return strValue.length === 0
      })

    if (missingFields.length > 0) {
      setLocalError(
        `Please complete the following required field${missingFields.length > 1 ? 's' : ''}: ${missingFields
          .map(([fieldKey, fieldSchema]) => fieldSchema.label ?? prettyLabel(fieldKey))
          .join(', ')}`
      )
      return false
    }
    return true
  }

  // ---- restyled dynamic field renderer ----
  const inputCls =
    'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary'

  const renderTemplateField = (fieldKey: string, fieldSchema: any) => {
    const value = getFieldValue(fieldKey, fieldSchema)
    const required = isFieldRequired(fieldKey, fieldSchema)
    const label = fieldSchema.label ?? prettyLabel(fieldKey)
    const handleSettingChange = (newValue: any) =>
      setTemplateSettings((prev) => ({ ...prev, [fieldKey]: newValue }))

    const Label = () => (
      <span className="mb-2 block text-[13px] font-semibold text-foreground">
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </span>
    )

    if (fieldSchema.type === 'textarea') {
      return (
        <div key={fieldKey}>
          <Label />
          <textarea
            value={value}
            onChange={(e) => handleSettingChange(e.target.value)}
            placeholder={fieldSchema.placeholder ?? label}
            className={cn(inputCls, 'min-h-[110px] resize-y leading-relaxed')}
          />
        </div>
      )
    }

    if (fieldSchema.type === 'radio' && typeof fieldSchema.options === 'object') {
      return (
        <div key={fieldKey}>
          <Label />
          <div className="space-y-2">
            {Object.entries(fieldSchema.options).map(([optionValue, optionLabel]) => (
              <label
                key={optionValue}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-all',
                  value === optionValue ? 'border-primary bg-accent-soft' : 'border-border bg-card'
                )}
              >
                <input
                  type="radio"
                  name={fieldKey}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={(e) => handleSettingChange(e.target.value)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-foreground">{optionLabel as string}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    if (fieldSchema.type === 'select') {
      // Options may be a list (possibly of numbers) or a value→label map.
      const entries: [string, string][] = Array.isArray(fieldSchema.options)
        ? (fieldSchema.options as unknown[]).map((o) => [String(o), prettyLabel(o)])
        : Object.entries(fieldSchema.options ?? {}).map(([k, v]) => [k, String(v)])
      return (
        <div key={fieldKey}>
          <Label />
          <select
            value={String(value ?? '')}
            onChange={(e) => handleSettingChange(e.target.value)}
            className={inputCls}
          >
            <option value="">— Select —</option>
            {entries.map(([optionValue, optionLabel]) => (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldSchema.type === 'file') {
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
        <div key={fieldKey}>
          <Label />
          <input
            type="file"
            accept={fieldSchema.accept ?? '*'}
            onChange={(e) => handleSettingChange(e.target.files?.[0] ?? '')}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
          />
          {displayName && (
            <p className="mt-1.5 text-xs font-medium text-good">
              {isFileSelected ? 'Selected: ' : 'Uploaded: '}
              {displayName}
            </p>
          )}
          {fieldSchema.max_size && (
            <p className="mt-1 text-xs text-ink3">Max size: {(fieldSchema.max_size / 1024 / 1024).toFixed(0)} MB</p>
          )}
        </div>
      )
    }

    if (fieldSchema.type === 'checkbox') {
      return (
        <label key={fieldKey} className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleSettingChange(e.target.checked)}
            className="h-4 w-4 rounded accent-[var(--primary)]"
          />
          <span className="text-[13px] font-semibold text-foreground">{label}</span>
        </label>
      )
    }

    return (
      <div key={fieldKey}>
        <Label />
        <input
          value={value}
          onChange={(e) => handleSettingChange(e.target.value)}
          placeholder={fieldSchema.placeholder ?? label}
          className={inputCls}
        />
      </div>
    )
  }

  // ---- special style-step renderers (caption + voice) ----
  const renderStyleField = (fieldKey: string, fieldSchema: any) => {
    const optionList: string[] = Array.isArray(fieldSchema.options)
      ? fieldSchema.options
      : typeof fieldSchema.options === 'object'
        ? Object.keys(fieldSchema.options ?? {})
        : []
    const value = getFieldValue(fieldKey, fieldSchema)
    const set = (v: string) => setTemplateSettings((prev) => ({ ...prev, [fieldKey]: v }))

    if (fieldKey === 'caption_template' && optionList.length) {
      return (
        <div key={fieldKey}>
          <span className="mb-2.5 block text-[13px] font-semibold text-foreground">Caption style</span>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {optionList.map((opt) => {
              const { kind, label } = captionStyleFor(opt)
              const active = value === opt
              return (
                <button
                  key={opt}
                  onClick={() => set(opt)}
                  className={cn(
                    'flex flex-col items-center rounded-xl border px-2 pb-3 pt-3.5 transition-all',
                    active ? 'border-primary bg-accent-soft' : 'border-border bg-card'
                  )}
                >
                  <span className="flex h-[46px] w-full items-center justify-center">
                    <CaptionSample kind={kind} />
                  </span>
                  <span className="mt-2 text-[12px] font-semibold text-foreground">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (fieldKey === 'tts_voice' && optionList.length) {
      return (
        <div key={fieldKey}>
          <span className="mb-2.5 block text-[13px] font-semibold text-foreground">Narrator voice</span>
          <div className="flex flex-wrap gap-2">
            {optionList.map((opt) => {
              const { name, tone } = voiceLabel(opt)
              const active = value === opt
              const previewing = previewVoice === opt
              return (
                <button
                  key={opt}
                  onClick={() => set(opt)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border py-2 pl-2 pr-3.5 transition-all',
                    active ? 'border-primary bg-accent-soft' : 'border-border bg-card'
                  )}
                >
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={previewing ? `Stop ${name} preview` : `Play ${name} preview`}
                    title={previewing ? 'Stop preview' : 'Play preview'}
                    onClick={(e) => {
                      e.stopPropagation()
                      playVoicePreview(opt)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
                    style={{ background: voiceColor(opt) }}
                  >
                    {previewing && previewLoading ? (
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="animate-spin">
                        <circle cx="8" cy="8" r="5.5" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.4" />
                        <path d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    ) : previewing ? (
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="#fff">
                        <rect x="4" y="4" width="8" height="8" rx="1.5" />
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="#fff">
                        <polygon points="5,4 10,8 5,12" />
                      </svg>
                    )}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold text-foreground">{name}</span>
                    <span className="text-[10.5px] text-ink3">{tone}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    return renderTemplateField(fieldKey, fieldSchema)
  }

  // ---- effects: fetch + pusher (unchanged) ----
  useEffect(() => {
    if (!projectId) return
    fetchProjectById(Number(projectId)).catch(() => {})
  }, [projectId, fetchProjectById])

  useEffect(() => {
    if (!projectId) return
    const unsubscribe = projectProgress.onProgress((data) => {
      setDisplayProgress(data.progress)
      try {
        dispatch(updateCurrentProject({ progress: data.progress }))
      } catch {}
    })
    return unsubscribe
  }, [projectId, projectProgress])

  useEffect(() => {
    if (!projectId) return
    const unsubscribe = projectProgress.onStatus((data) => {
      if (data.status === 'processing') setLocalError(null)
      try {
        dispatch(updateCurrentProject({ status: data.status }))
      } catch {}
    })
    return unsubscribe
  }, [projectId, projectProgress])

  useEffect(() => {
    if (!projectId) return
    const unsubscribe = projectProgress.onCompletion(() => {
      setDisplayProgress(100)
      try {
        dispatch(updateCurrentProject({ progress: 100, status: 'completed' }))
      } catch {}
      fetchProjectById(Number(projectId)).catch(() => {})
    })
    return unsubscribe
  }, [projectId, projectProgress, fetchProjectById])

  useEffect(() => {
    if (!projectId) return
    const unsubscribe = projectProgress.onError((data) => {
      setLocalError(data.error)
      try {
        dispatch(updateCurrentProject({ status: 'failed', error_message: data.error }))
      } catch {}
    })
    return unsubscribe
  }, [projectId, projectProgress])

  // ---- actions (unchanged behaviour) ----
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setSelectedFileName(file?.name ?? '')
    setSelectedFilePreview(file ? URL.createObjectURL(file) : null)
    setLocalError(null)
  }

  const uploadSelectedFile = async (): Promise<boolean> => {
    if (!projectId || !selectedFile) return true
    try {
      await uploadProjectVideo({ projectId: Number(projectId), video: selectedFile })
      setSelectedFile(null)
      setSelectedFileName('')
      setSelectedFilePreview(null)
      return true
    } catch (e) {
      setLocalError('Failed to upload video. Please try again.')
      console.error(e)
      return false
    }
  }

  const sanitizeSettingsForBackend = (settings: Record<string, any>) => {
    const sanitized: Record<string, any> = {}
    Object.entries(settings).forEach(([key, value]) => {
      const fieldSchema = templateConfig?.settings_schema?.[key]
      if (fieldSchema?.type === 'file') {
        sanitized[key] = value instanceof File ? '' : value ?? ''
      } else {
        sanitized[key] = value ?? ''
      }
    })
    return sanitized
  }

  const handleProcess = async () => {
    if (!projectId || !currentProject) return
    // Re-entry guard: ignore extra clicks while a submission is already in flight
    // or while the project is already processing.
    if (submittingRef.current || isSubmitting || isProcessing || currentProject.status === 'processing') {
      return
    }
    submittingRef.current = true
    setIsSubmitting(true)
    setLocalError(null)

    try {
      const schemaEntries = Object.entries(templateConfig?.settings_schema ?? {})
      if (!validateEntries(schemaEntries)) return

      if (isTemplateUploadRequired && !currentProject.video_path) {
        setLocalError('This template requires a video upload before processing.')
        return
      }

      // Credit gate (client-side mirror of the server enforcement).
      if (!hasSubscription) {
        setLocalError('An active subscription is required to generate videos.')
        router.push('/dashboard/billing')
        return
      }
      if (credits < renderCost) {
        setLocalError(`You need ${renderCost} credits for this video but only have ${credits}.`)
        router.push('/dashboard/billing')
        return
      }

      const updatedSettings = { ...templateSettings }
      let latestProject = currentProject

      for (const [key, value] of Object.entries(templateSettings)) {
        if (value instanceof File) {
          if (key === 'video_file') {
            latestProject = await uploadProjectVideo({ projectId: Number(projectId), video: value })
            const pathUrl = latestProject.video_path ?? ''
            const storageIndex = pathUrl.indexOf('/storage/')
            const relativePath = storageIndex !== -1 ? pathUrl.substring(storageIndex + 9) : pathUrl
            updatedSettings[key] = relativePath
          } else {
            const uploadResult = await uploadProjectSettingFile({
              projectId: Number(projectId),
              fieldKey: key,
              file: value,
            })
            updatedSettings[key] = uploadResult.path
          }
        }
      }

      const sanitizedSettings = sanitizeSettingsForBackend(updatedSettings)
      const settingsChanged =
        JSON.stringify(currentProject.settings ?? {}) !== JSON.stringify(sanitizedSettings)

      if (settingsChanged) {
        await updateProject({ projectId: Number(projectId), data: { settings: sanitizedSettings } })
      }

      if (sanitizedSettings.input_mode === 'upload' && !latestProject.video_path) {
        setLocalError('Please select and upload a source video file.')
        return
      }

      await processProject(Number(projectId))
      // Optimistically reflect processing state so the UI locks immediately.
      dispatch(updateCurrentProject({ status: 'processing', progress: 0 }))
      // Reflect the just-spent credits in the header pill.
      fetchBilling().catch(() => {})
    } catch (error: any) {
      const msg = error?.message || error || 'Failed to start processing. Please try again.'
      setLocalError(typeof msg === 'string' ? msg : 'Failed to start processing. Please try again.')
      // Server-side credit/subscription rejection → send them to billing.
      if (typeof msg === 'string' && /subscription|credit/i.test(msg)) {
        router.push('/dashboard/billing')
      }
      console.error(error)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!projectId) return
    try {
      await updateProject({
        projectId: Number(projectId),
        data: { settings: sanitizeSettingsForBackend(templateSettings) },
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleRetry = async () => {
    if (!projectId) return
    setIsRetrying(true)
    setLocalError(null)
    try {
      await dispatch(retryProject(Number(projectId))).unwrap()
      dispatch(
        updateCurrentProject({ status: 'processing', progress: 0, error_message: null, failed_step: null })
      )
    } catch (error: any) {
      setLocalError(error || 'Failed to retry processing. Please try again.')
      console.error(error)
    } finally {
      setIsRetrying(false)
    }
  }

  // ---- step partition (derived from the template config) ----
  const schema = templateConfig?.settings_schema ?? {}
  const visibleEntries = Object.entries(schema).filter(([k, s]) => isFieldVisible(k, s))

  // "Style & voice" holds only the look/sound knobs: caption style, narrator
  // voice, toggles, and optional tuning selects. Everything else — the source
  // and the template's content/required fields — goes in the first step.
  const isStyleField = (k: string, s: any) =>
    k === 'caption_template' ||
    k === 'tts_voice' ||
    s.type === 'checkbox' ||
    (s.type === 'select' && !isFieldRequired(k, s))

  const sourceFields = visibleEntries.filter(([k, s]) => isSourceField(k, s))
  const detailFields = visibleEntries.filter(([k, s]) => !isSourceField(k, s) && !isStyleField(k, s))
  const step1Fields = [...sourceFields, ...detailFields]
  const styleFields = visibleEntries.filter(([k, s]) => !isSourceField(k, s) && isStyleField(k, s))
  const hasVideoFileField = sourceFields.some(
    ([k, s]) => k === 'video_file' || (s.type === 'file' && String(s.accept ?? '').includes('video'))
  )

  // Only show a step if it has content: skip the first step when there's no
  // upload and no fields; skip "Style & voice" when there are no style fields.
  const needDetails = isTemplateUploadRequired || step1Fields.length > 0
  const needStyle = styleFields.length > 0
  const stepKeys: StepKey[] = [
    ...(needDetails ? (['source'] as StepKey[]) : []),
    ...(needStyle ? (['style'] as StepKey[]) : []),
    'generate',
  ]
  let currentIndex = stepKeys.indexOf(stepKey)
  if (currentIndex === -1) currentIndex = 0
  const current = stepKeys[currentIndex]
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === stepKeys.length - 1
  const detailsTitle = isTemplateUploadRequired ? 'Source footage' : 'Project details'

  const goNext = async () => {
    setLocalError(null)
    if (current === 'source') {
      if (isTemplateUploadRequired && !hasVideoFileField && !currentProject?.video_path && !selectedFile) {
        setLocalError('Please add a source video to continue.')
        return
      }
      if (selectedFile) {
        const ok = await uploadSelectedFile()
        if (!ok) return
      }
      if (!validateEntries(step1Fields)) return
    } else if (current === 'style') {
      if (!validateEntries(styleFields)) return
    }
    if (isLastStep) await handleProcess()
    else setStepKey(stepKeys[currentIndex + 1])
  }

  const goBack = () => {
    setLocalError(null)
    if (currentIndex > 0) setStepKey(stepKeys[currentIndex - 1])
  }

  // ---- preview derivations ----
  const previewText = useMemo(() => {
    const keys = ['hook', 'title', 'headline', 'topic', 'script', 'prompt', 'text', 'caption']
    for (const k of keys) {
      if (templateSettings[k]) return String(templateSettings[k])
    }
    return templateConfig?.name ?? currentProject?.title ?? 'Your caption preview'
  }, [templateSettings, templateConfig?.name, currentProject?.title])

  const captionKind = captionStyleFor(String(templateSettings['caption_template'] ?? '')).kind
  const aspect =
    (currentProject as any)?.aspect_ratio ?? (templateConfig as any)?.aspect_ratio ?? '9:16'
  const lengthLabel =
    typeof templateConfig?.max_duration === 'number' ? `~${templateConfig.max_duration}s` : '~45s'
  const shownProgress = Math.max(currentProject?.progress ?? 0, displayProgress)

  // ---- summary rows ----
  const summary = useMemo(() => {
    const rows: { k: string; v: string }[] = [
      { k: 'Template', v: templateConfig?.name ?? currentProject?.template_type ?? '—' },
    ]
    if (isTemplateUploadRequired) {
      rows.push({ k: 'Source', v: currentProject?.video_path ? 'Uploaded video' : 'Pending upload' })
    }
    ;[...detailFields, ...styleFields].forEach(([k, s]) => {
      if (s.type === 'textarea' || s.type === 'file') return
      const val = templateSettings[k]
      if (val === undefined || val === '' || typeof val === 'object') return
      let display = String(val)
      if (k === 'caption_template') display = captionStyleFor(display).label
      else if (k === 'tts_voice') display = voiceLabel(display).name
      else if (typeof val === 'boolean') display = val ? 'On' : 'Off'
      else display = prettyLabel(display)
      rows.push({ k: s.label ?? prettyLabel(k), v: display })
    })
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailFields, styleFields, templateSettings, templateConfig?.name, currentProject, isTemplateUploadRequired])

  const renderStepRail = () => {
    if (stepKeys.length <= 1) return null
    return (
      <div className="mb-9 flex max-w-[680px] items-center">
        {stepKeys.map((key, i) => {
          const active = i === currentIndex
          const done = i < currentIndex
          const meta = STEP_META[key]
          const label = key === 'source' ? detailsTitle : meta.title
          return (
            <div key={key} className="flex items-center" style={{ flex: i < stepKeys.length - 1 ? 1 : '0 0 auto' }}>
              <button
                onClick={() => i < currentIndex && setStepKey(key)}
                className="flex flex-shrink-0 items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    'flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                    done
                      ? 'bg-primary text-primary-foreground'
                      : active
                        ? 'bg-foreground text-background'
                        : 'border border-border bg-inset text-ink3'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden flex-col whitespace-nowrap sm:flex">
                  <span className={cn('text-[13.5px] font-semibold', active || done ? 'text-foreground' : 'text-ink3')}>
                    {label}
                  </span>
                  <span className="text-[11px] text-ink3">{meta.sub}</span>
                </span>
              </button>
              {i < stepKeys.length - 1 && <span className="mx-4 h-[1.5px] flex-1 bg-border" />}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        {/* LEFT: form */}
        <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-9">
          {renderStepRail()}

          {/* error */}
          {(error || localError) && (
            <div className="mb-6 max-w-[620px] rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">
              {localError || error}
            </div>
          )}

          {/* STEP 1: DETAILS / SOURCE */}
          {current === 'source' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[620px] space-y-5"
            >
              <div>
                <h2 className="font-display text-[25px] font-semibold tracking-tight text-foreground">{detailsTitle}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {isTemplateUploadRequired
                    ? 'Add the source video and fill in the details. AI handles the rest.'
                    : 'Fill in the details below — this template generates the visuals for you.'}
                </p>
              </div>

              {isTemplateUploadRequired && !hasVideoFileField && (
                <label className="block">
                  <div className="relative cursor-pointer rounded-2xl border-[1.5px] border-dashed border-border bg-inset p-8 text-center transition-colors hover:border-primary/50">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <Upload className="mx-auto mb-3 h-8 w-8 text-ink3" />
                    <p className="text-sm font-semibold text-foreground">
                      {selectedFileName || (currentProject?.video_path ? 'Replace source video' : 'Drop your video or click to browse')}
                    </p>
                    <p className="mt-1 text-xs text-ink3">MP4, MOV, AVI, WEBM</p>
                    {currentProject?.video_path && !selectedFileName && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-good">
                        <Check className="h-3.5 w-3.5" /> Source already uploaded
                      </p>
                    )}
                  </div>
                </label>
              )}

              {step1Fields.length > 0 && (
                <div className="space-y-5">{step1Fields.map(([k, s]) => renderTemplateField(k, s))}</div>
              )}
            </motion.section>
          )}

          {/* STEP 2: STYLE & VOICE */}
          {current === 'style' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[620px] space-y-6"
            >
              <div>
                <h2 className="font-display text-[25px] font-semibold tracking-tight text-foreground">Style &amp; voice</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Set the look of the captions and how it sounds.
                </p>
              </div>

              {styleFields.length > 0 ? (
                <div className="space-y-6">{styleFields.map(([k, s]) => renderStyleField(k, s))}</div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <Info className="h-5 w-5 flex-shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground">This template has no style options to configure.</p>
                </div>
              )}
            </motion.section>
          )}

          {/* STEP 3: GENERATE */}
          {current === 'generate' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[620px]"
            >
              <h2 className="font-display text-[25px] font-semibold tracking-tight text-foreground">Review &amp; generate</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Double-check everything, then render. You can track progress on the right.
              </p>

              <div className="mt-6">
                {summary.map((row) => (
                  <div key={row.k} className="flex items-center justify-between border-b border-line2 py-3">
                    <span className="text-[13px] text-muted-foreground">{row.k}</span>
                    <span className="max-w-[60%] truncate text-[13.5px] font-semibold text-foreground">{row.v}</span>
                  </div>
                ))}
              </div>

              {/* failed retry */}
              {currentProject?.status === 'failed' && (
                <div className="mt-5 rounded-xl border border-warn-soft bg-warn-soft/60 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warn" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">Processing failed</h4>
                      {currentProject.failed_step && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Failed at: <span className="font-medium capitalize">{currentProject.failed_step.replace(/_/g, ' ')}</span>
                        </p>
                      )}
                      {currentProject.error_message && (
                        <p className="mt-2 text-xs text-ink3">{currentProject.error_message}</p>
                      )}
                      <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        <RefreshCcw className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
                        {isRetrying ? 'Retrying…' : 'Retry processing'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3.5">
                <Zap className="h-[18px] w-[18px] flex-shrink-0 text-accent fill-current" />
                <span className="text-[13px] text-foreground">
                  This render uses <b>{renderCost} credit{renderCost === 1 ? '' : 's'}</b>.{' '}
                  {hasSubscription ? (
                    <>You have <b>{credits.toLocaleString()}</b> left.</>
                  ) : (
                    <>Subscribe to get daily credits.</>
                  )}
                </span>
              </div>

              {!canAffordRender && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-[13px] text-warn">
                  <span>
                    {hasSubscription
                      ? `Not enough credits — you need ${renderCost}.`
                      : 'You need an active subscription to generate videos.'}
                  </span>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-white"
                  >
                    {hasSubscription ? 'Get more' : 'View plans'}
                  </Link>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleProcess}
                  disabled={isSubmitting || isProcessing || currentProject?.status === 'processing' || !canAffordRender}
                  className="inline-flex h-[50px] items-center gap-2.5 rounded-[13px] bg-primary px-6 text-[14.5px] font-bold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting || isProcessing || currentProject?.status === 'processing' ? (
                    <RefreshCcw className="h-[17px] w-[17px] animate-spin" />
                  ) : (
                    <Sparkles className="h-[17px] w-[17px]" />
                  )}
                  {isSubmitting
                    ? 'Starting…'
                    : isProcessing || currentProject?.status === 'processing'
                      ? 'Generating…'
                      : 'Generate video'}
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="inline-flex h-[50px] items-center rounded-[13px] border border-border bg-card px-5 text-[14px] font-semibold text-foreground"
                >
                  Save as draft
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP NAV */}
          <div className="mt-9 flex max-w-[620px] items-center justify-between border-t border-line2 pt-5">
            <button
              onClick={goBack}
              disabled={isFirstStep}
              className={cn(
                'inline-flex h-[46px] items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold',
                isFirstStep ? 'text-ink3' : 'text-foreground'
              )}
            >
              <ArrowLeft className="h-[15px] w-[15px]" />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={isUploading || isSubmitting || isProcessing || (isLastStep && currentProject?.status === 'processing')}
              className="inline-flex h-[46px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLastStep
                ? isSubmitting
                  ? 'Starting…'
                  : isProcessing || currentProject?.status === 'processing'
                    ? 'Generating…'
                    : 'Generate'
                : isUploading
                  ? 'Uploading…'
                  : 'Continue'}
              {!isLastStep && <ArrowRight className="h-[15px] w-[15px]" />}
            </button>
          </div>
        </main>

        {/* RIGHT: live preview */}
        <aside className="w-full flex-shrink-0 border-t border-border bg-inset p-7 lg:w-[430px] lg:border-l lg:border-t-0">
          <div className="lg:sticky lg:top-7">
            <SteppedPreview
              aspectRatio={aspect}
              title={currentProject?.title || templateConfig?.name}
              captionText={previewText}
              captionKind={captionKind}
              status={currentProject?.status}
              progress={shownProgress}
              isUploading={isUploading}
              outputVideoUrl={currentProject?.output_path}
              outputVideos={currentProject?.output_videos}
              lengthLabel={lengthLabel}
              scenesLabel={isFetching ? '…' : '—'}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center bg-background">Loading…</div>}
    >
      <CreatePageContent />
    </Suspense>
  )
}
