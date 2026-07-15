"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Heart, Play, ArrowRight, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useProject } from "@/hooks/useProject"
import { useTemplates } from "@/hooks/useTemplates"
import { TemplateArt, artKindFor, paletteFor } from "@/components/dashboard/template-art"

type DurationType = "all" | "short" | "long"

type TemplateCard = {
  templateType: string
  name: string
  description: string
  aspect_ratio?: string
  durationLabel: string
  rating: number
  uses: string
  isPremium: boolean
  isNew: boolean
  category: "short" | "long"
  enabled: boolean
  creditCost?: number
  trending: boolean
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export default function TemplatesPage() {
  const [durationType, setDurationType] = useState<DurationType>("all")
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
    loadTemplates,
    loadTemplateConfig,
    selectTemplate,
  } = useTemplates()

  const enrichedTemplates: TemplateCard[] = templates.map((template) => ({
    templateType: template.templateType,
    name: template.name,
    description: template.description,
    aspect_ratio: template.aspect_ratio,
    durationLabel: template.aspect_ratio === "9:16" ? "0:30" : "1:00",
    rating: template.rating ?? 4.8,
    uses: template.uses ?? "N/A",
    isPremium: template.isPremium ?? false,
    isNew: template.isNew ?? false,
    category: template.category ?? (template.aspect_ratio === "9:16" ? "short" : "long"),
    enabled: template.enabled ?? true,
    creditCost: template.credit_cost,
    trending: template.trending ?? false,
  }))

  const filteredTemplates = enrichedTemplates.filter((template) => {
    const matchesDuration =
      durationType === "all" ||
      (durationType === "short" && template.category === "short") ||
      (durationType === "long" && template.category === "long")

    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesDuration && matchesSearch
  })

  const featured = enrichedTemplates.find((t) => t.trending) ?? enrichedTemplates[0]

  const toggleFavorite = (templateType: string) => {
    setFavorites((prev) =>
      prev.includes(templateType) ? prev.filter((f) => f !== templateType) : [...prev, templateType]
    )
  }

  const handleUseTemplate = async (template: TemplateCard) => {
    if (isCreating || !template.enabled) return

    // The AI Explainer template has its own script -> storyboard -> render flow.
    if (template.templateType === "ai_explainer_video") {
      router.push("/dashboard/explainer")
      return
    }

    try {
      const settings = { ...templateSettings }
      const project = await createProject({
        title: template.name,
        template_type: template.templateType,
        settings,
      })
      if (project?.id) {
        router.push(`/dashboard/create?projectId=${project.id}`)
      }
    } catch (error) {
      console.error("Failed to create project", error)
    }
  }

  useEffect(() => {
    loadTemplates().catch(() => {})
  }, [loadTemplates])

  useEffect(() => {
    if (templatesStatus === "succeeded" && enrichedTemplates.length > 0 && !selectedTemplateType) {
      const firstTemplate = enrichedTemplates[0].templateType
      selectTemplate(firstTemplate)
      loadTemplateConfig(firstTemplate).catch(() => {})
    }
  }, [templatesStatus, enrichedTemplates, selectedTemplateType, selectTemplate, loadTemplateConfig])

  useEffect(() => {
    if (!selectedTemplateType) return
    loadTemplateConfig(selectedTemplateType).catch(() => {})
  }, [selectedTemplateType, loadTemplateConfig])

  useEffect(() => {
    if (!templateConfig) return
    const defaults: Record<string, any> = {}
    Object.entries(templateConfig.settings_schema ?? {}).forEach(([fieldKey, fieldSchema]) => {
      defaults[fieldKey] = fieldSchema.default ?? ""
    })
    setTemplateSettings(defaults)
  }, [templateConfig])

  const shortCount = enrichedTemplates.filter((t) => t.category === "short").length
  const longCount = enrichedTemplates.filter((t) => t.category === "long").length

  const cats: { k: DurationType; label: string; count: number }[] = [
    { k: "all", label: "All", count: enrichedTemplates.length },
    { k: "short", label: "Short form", count: shortCount },
    { k: "long", label: "Long form", count: longCount },
  ]

  return (
    <div className="space-y-8">
      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">Templates</h1>
        <div className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 shadow-soft sm:w-[300px]">
          <Search className="h-4 w-4 text-ink3" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates"
            className="flex-1 border-none bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-ink3"
          />
        </div>
      </div>

      {(projectError || templatesError) && (
        <div className="rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">
          {projectError || templatesError}
        </div>
      )}

      {/* Hero + stats */}
      {featured && (
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="relative flex min-h-[188px] flex-1 flex-col justify-between overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#5B7CF6,#7C5CFF_50%,#C05CE6)] p-8">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,.45), transparent 70%)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-10 -left-6 h-44 w-44 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,111,207,.55), transparent 70%)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  Trending now
                </span>
                {typeof featured.creditCost === "number" && (
                  <span className="inline-block rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {featured.creditCost} credits
                  </span>
                )}
                {!featured.enabled && (
                  <span className="inline-block rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">
                    Unavailable
                  </span>
                )}
              </div>
              <h2 className="font-display mt-4 max-w-[380px] text-[30px] font-bold leading-[1.1] tracking-tight text-white">
                {featured.name}
              </h2>
              <p className="mt-1.5 max-w-[400px] text-sm text-white/70 line-clamp-2">{featured.description}</p>
            </div>
            <button
              onClick={() => handleUseTemplate(featured)}
              disabled={isCreating || !featured.enabled}
              className="relative mt-5 inline-flex h-[42px] w-fit cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-[13.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating…" : !featured.enabled ? "Unavailable" : "Start with this"}
              <ArrowRight className="h-[15px] w-[15px]" />
            </button>
          </div>

          <div className="flex w-full flex-col justify-between rounded-3xl border border-border bg-card p-6 lg:w-[300px]">
            <div>
              <div className="text-[13px] font-semibold text-ink3">This week</div>
              <div className="font-display mt-1.5 text-[34px] font-bold tracking-tight text-foreground">
                {enrichedTemplates.length} templates
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                across short &amp; long form
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-inset text-xs font-semibold text-muted-foreground">
                {shortCount} short
              </div>
              <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-inset text-xs font-semibold text-muted-foreground">
                {longCount} long
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => {
            const active = durationType === c.k
            return (
              <button
                key={c.k}
                onClick={() => setDurationType(c.k)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-all",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {c.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                    active ? "bg-white/20" : "bg-inset text-ink3"
                  )}
                >
                  {c.count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="hidden items-center gap-2 text-[13px] text-ink3 sm:flex">
          <span>Sort</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] font-semibold text-foreground">
            Popular
            <ChevronDown className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template, i) => {
            const pal = paletteFor(i)
            const isFav = favorites.includes(template.templateType)
            return (
              <motion.div
                key={template.templateType}
                variants={itemVariants}
                layout
                className={cn("group card-lift", !template.enabled && "opacity-60")}
              >
                <div className="holo relative aspect-[16/11] overflow-hidden rounded-2xl" style={{ background: pal.bg }}>
                  <div className="absolute inset-0">
                    <TemplateArt kind={artKindFor(template.templateType)} accent={pal.a} />
                  </div>
                  {template.enabled ? (
                    <span className="absolute left-2.5 top-2.5 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur">
                      {template.aspect_ratio ?? "16:9"}
                    </span>
                  ) : (
                    <span className="absolute left-2.5 top-2.5 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur">
                      Unavailable
                    </span>
                  )}
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                    {typeof template.creditCost === "number" && (
                      <span className="rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur">
                        {template.creditCost} cr
                      </span>
                    )}
                    {template.isPremium && (
                      <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                        PRO
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(template.templateType)
                    }}
                    className={cn(
                      "absolute bottom-2.5 right-2.5 cursor-pointer rounded-md bg-black/30 p-1.5 backdrop-blur transition-opacity",
                      isFav ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5", isFav ? "fill-red-500 text-red-500" : "text-white")} />
                  </button>

                  {/* hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      disabled={isCreating || !template.enabled}
                      className="inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-lg bg-white px-4 text-[13px] font-bold text-[#1A1916] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Play className="h-3.5 w-3.5 fill-[#1A1916]" />
                      {isCreating ? "Creating…" : !template.enabled ? "Unavailable" : "Use template"}
                    </button>
                  </div>
                </div>

                <div className="px-1 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14.5px] font-semibold tracking-tight text-foreground">
                      {template.name}
                    </span>
                    <span className="flex-shrink-0 font-mono text-[11.5px] text-ink3">{template.durationLabel}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{template.description}</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && templatesStatus === "succeeded" && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-inset">
            <Search className="h-8 w-8 text-ink3" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No templates found</h3>
          <p className="mt-1 text-muted-foreground">Try adjusting your search or filters</p>
          <button
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground"
            onClick={() => {
              setSearchQuery("")
              setDurationType("all")
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
