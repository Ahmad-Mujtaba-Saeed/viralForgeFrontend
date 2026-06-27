"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Play, 
  Clock, 
  Star, 
  Heart,
  Zap,
  Timer,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  Users
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useProject } from '@/hooks/useProject'
import { useTemplates } from '@/hooks/useTemplates'

type DurationType = "all" | "short" | "long"
type ViewMode = "grid" | "list"

type TemplateCard = {
  templateType: string
  name: string
  description: string
  aspect_ratio?: string
  platform: string
  durationLabel: string
  rating: number
  uses: string
  views: string
  isPremium: boolean
  isNew: boolean
  category: "short" | "long"
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export default function TemplatesPage() {
  const [durationType, setDurationType] = useState<DurationType>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [favorites, setFavorites] = useState<string[]>([])
  const [templateSettings, setTemplateSettings] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { createProject, isCreating, error: projectError } = useProject()

  const {
    templates,
    selectedTemplateType,
    templateConfig,
    status: templatesStatus,
    error: templatesError,
    configStatus,
    loadTemplates,
    loadTemplateConfig,
    selectTemplate,
  } = useTemplates()

  const enrichedTemplates: TemplateCard[] = templates.map((template) => ({
    templateType: template.templateType,
    name: template.name,
    description: template.description,
    aspect_ratio: template.aspect_ratio,
    platform: template.aspect_ratio === '9:16' ? 'Shorts' : 'Video',
    durationLabel: template.aspect_ratio === '9:16' ? '0:30' : '1:00',
    rating: template.rating ?? 4.8,
    uses: template.uses ?? 'N/A',
    views: template.views ?? 'N/A',
    isPremium: template.isPremium ?? false,
    isNew: template.isNew ?? false,
    category: template.category ?? (template.aspect_ratio === '9:16' ? 'short' : 'long'),
  }))

  const selectedTemplate = enrichedTemplates.find(
    (template) => template.templateType === selectedTemplateType
  )

  const filteredTemplates = enrichedTemplates.filter((template) => {
    const matchesDuration =
      durationType === "all" ||
      (durationType === "short" && template.category === 'short') ||
      (durationType === "long" && template.category === 'long')

    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesDuration && matchesSearch
  })

  const toggleFavorite = (templateType: string) => {
    setFavorites((prev) =>
      prev.includes(templateType) ? prev.filter((f) => f !== templateType) : [...prev, templateType]
    )
  }

  const handleUseTemplate = async (template: TemplateCard) => {
    if (isCreating) {
      return
    }

    // The AI Explainer template has its own script -> storyboard -> render flow.
    if (template.templateType === 'ai_explainer_video') {
      router.push('/dashboard/explainer')
      return
    }

    try {
      const settings = {
        ...templateSettings,
      }

      const project = await createProject({
        title: template.name,
        template_type: template.templateType,
        settings,
      })

      console.log('Project created:', project)
      if (project?.id) {
        router.push(`/dashboard/create?projectId=${project.id}`)
      }
    } catch (error) {
      console.error('Failed to create project', error)
    }
  }

  useEffect(() => {
      loadTemplates().catch(() => {
        // ignore failure handled in slice
      })
  }, [loadTemplates])

  useEffect(() => {
    if (templatesStatus === 'succeeded' && enrichedTemplates.length > 0 && !selectedTemplateType) {
      const firstTemplate = enrichedTemplates[0].templateType
      selectTemplate(firstTemplate)
      loadTemplateConfig(firstTemplate).catch(() => {
        // ignore
      })
    }
  }, [templatesStatus, enrichedTemplates, selectedTemplateType, selectTemplate, loadTemplateConfig])

  useEffect(() => {
    if (!selectedTemplateType) {
      return
    }

    loadTemplateConfig(selectedTemplateType).catch(() => {
      // ignore
    })
  }, [selectedTemplateType, loadTemplateConfig])

  useEffect(() => {
    if (!templateConfig) {
      return
    }

    const defaults: Record<string, any> = {}
    Object.entries(templateConfig.settings_schema ?? {}).forEach(([fieldKey, fieldSchema]) => {
      defaults[fieldKey] = fieldSchema.default ?? ''
    })
    setTemplateSettings(defaults)
  }, [templateConfig])

  const shortCount = enrichedTemplates.filter((t) => t.category === 'short').length
  const longCount = enrichedTemplates.filter((t) => t.category === 'long').length

  const getTemplateRequirementNotes = () => {
    if (!selectedTemplate || !templateConfig) {
      return []
    }

    const notes: string[] = []
    if (templateConfig.requires_upload === false) {
      notes.push('No video upload is required for this template.')
    } else {
      notes.push('A video upload will be required as part of this workflow.')
    }

    const requiredFields = Object.entries(templateConfig.settings_schema ?? {})
      .filter(([, fieldSchema]) => fieldSchema.required)
      .map(([fieldKey, fieldSchema]) => fieldSchema.label ?? fieldKey)

    if (requiredFields.length > 0) {
      notes.push(`Required fields: ${requiredFields.join(', ')}.`)
    }

    return notes
  }

  const renderFieldInput = (fieldKey: string, fieldSchema: any) => {
    const value = templateSettings[fieldKey] ?? ''

    const handleChange = (newValue: string) => {
      setTemplateSettings((prev) => ({
        ...prev,
        [fieldKey]: newValue,
      }))
    }

    if (fieldSchema.type === 'textarea') {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{fieldSchema.label}</label>
          <textarea
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={fieldSchema.placeholder ?? fieldSchema.label}
            className="w-full min-h-[120px] rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      )
    }

    if (fieldSchema.type === 'select' && Array.isArray(fieldSchema.options)) {
      return (
        <div key={fieldKey} className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{fieldSchema.label}</label>
          <select
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {fieldSchema.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )
    }

    return (
      <div key={fieldKey} className="space-y-2">
        <label className="block text-sm font-medium text-foreground">{fieldSchema.label}</label>
        <Input
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={fieldSchema.placeholder ?? fieldSchema.label}
          className="w-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Choose from professionally designed video templates
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center border border-border rounded-lg p-1 bg-card">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {(projectError || templatesError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {projectError || templatesError}
        </div>
      )}

      {/* Duration Filter Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            durationType === "short" 
              ? "ring-2 ring-primary bg-primary/5" 
              : "hover:border-primary/30"
          )}
          onClick={() => setDurationType(durationType === "short" ? "all" : "short")}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  durationType === "short" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}>
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Short Form</h3>
                  <p className="text-sm text-muted-foreground">Under 60 seconds</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground">{shortCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            durationType === "long" 
              ? "ring-2 ring-primary bg-primary/5" 
              : "hover:border-primary/30"
          )}
          onClick={() => setDurationType(durationType === "long" ? "all" : "long")}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  durationType === "long" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}>
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Long Form</h3>
                  <p className="text-sm text-muted-foreground">60 seconds and above</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground">{longCount}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </motion.div>

      {/* Active Filter & Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {durationType !== "all" && (
            <button
              onClick={() => setDurationType("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              {durationType === "short" ? <Zap className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
              {durationType === "short" ? "Short Form" : "Long Form"}
              <span className="ml-1 opacity-60">&times;</span>
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
        </p>
      </div>

      {selectedTemplate && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected template</p>
              <h2 className="text-2xl font-semibold text-foreground">{selectedTemplate.name}</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">{selectedTemplate.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {selectedTemplate.aspect_ratio ?? 'Video'}
              </span>
              <Button
                onClick={() => handleUseTemplate(selectedTemplate)}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Use this template'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Requirements</h3>
                <div className="mt-3 space-y-2">
                  {getTemplateRequirementNotes().map((note) => (
                    <p key={note} className="text-sm text-muted-foreground">• {note}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <h3 className="text-sm font-semibold text-foreground">Quick summary</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Template type</span>
                  <span className="font-medium text-foreground">{selectedTemplate.templateType}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Aspect ratio</span>
                  <span className="font-medium text-foreground">{selectedTemplate.aspect_ratio ?? 'Auto'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Estimated input</span>
                  <span className="font-medium text-foreground">{selectedTemplate.category === 'short' ? 'Short form' : 'Long form'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <AnimatePresence mode="popLayout">
        {viewMode === "grid" ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.templateType}
                variants={itemVariants}
                layout
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-md transition-all hover:border-primary/20">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-foreground/10" />
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-background hover:scale-105">
                        <Play className="h-5 w-5 text-foreground fill-foreground ml-0.5" />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {template.isNew && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded">
                          New
                        </span>
                      )}
                      {template.isPremium && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
                          Pro
                        </span>
                      )}
                    </div>

                    {/* Favorite */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(template.templateType)
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background transition-colors"
                    >
                      <Heart className={cn(
                        "h-4 w-4 transition-colors",
                        favorites.includes(template.templateType)
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground"
                      )} />
                    </button>

                    {/* Duration & Platform */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-foreground/80 text-background text-xs font-medium rounded">
                      <Clock className="h-3 w-3" />
                      {template.durationLabel}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-background/90 text-foreground text-xs font-medium rounded">
                      {template.platform}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {template.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {template.uses}
                        </span>
                      </div>
                      <Button onClick={() => handleUseTemplate(template)} size="sm" variant="ghost" className="h-8 px-3 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground" >
                        <Sparkles className="h-3 w-3" />
                        {isCreating ? 'Creating...' : 'Use'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.templateType}
                variants={itemVariants}
                layout
              >
                <Card className="hover:shadow-md transition-all hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-32 h-20 rounded-lg bg-muted overflow-hidden shrink-0 group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-foreground/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-6 w-6 text-foreground/50 group-hover:text-foreground group-hover:scale-110 transition-all" />
                        </div>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-foreground/80 text-background text-xs font-medium rounded">
                          {template.durationLabel}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{template.name}</h3>
                              {template.isNew && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded">
                                  New
                                </span>
                              )}
                              {template.isPremium && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                  Pro
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {template.description}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-muted rounded">{template.platform}</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {template.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {template.uses} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {template.views} views
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => toggleFavorite(template.templateType)}
                          className="p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Heart className={cn(
                            "h-4 w-4 transition-colors",
                            favorites.includes(template.templateType) 
                              ? "fill-red-500 text-red-500" 
                              : "text-muted-foreground"
                          )} />
                        </button>
                        <Button size="sm" className="gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {isCreating ? 'Creating...' : 'Use Template'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No templates found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery("")
              setDurationType("all")
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
