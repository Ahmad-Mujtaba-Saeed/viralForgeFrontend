"use client"

import { useState } from "react"
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

type DurationType = "all" | "short" | "long"
type ViewMode = "grid" | "list"

const templates = [
  {
    id: 1,
    title: "Viral Hook Opener",
    description: "Grab attention in the first 3 seconds with proven hook patterns",
    platform: "TikTok",
    duration: 15,
    durationLabel: "0:15",
    rating: 4.9,
    uses: "125K",
    views: "2.4M",
    isPremium: false,
    isNew: true,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 2,
    title: "Product Showcase",
    description: "Professional product reveal with smooth transitions",
    platform: "Instagram",
    duration: 30,
    durationLabel: "0:30",
    rating: 4.8,
    uses: "89K",
    views: "1.8M",
    isPremium: true,
    isNew: false,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 3,
    title: "Tutorial Deep Dive",
    description: "Step-by-step educational content with chapter markers",
    platform: "YouTube",
    duration: 480,
    durationLabel: "8:00",
    rating: 4.9,
    uses: "156K",
    views: "5.2M",
    isPremium: true,
    isNew: false,
    category: "long",
    apiType: 'yt_automation_short',
  },
  {
    id: 4,
    title: "Story Time",
    description: "Engaging narrative structure for personal stories",
    platform: "TikTok",
    duration: 45,
    durationLabel: "0:45",
    rating: 4.7,
    uses: "67K",
    views: "890K",
    isPremium: false,
    isNew: true,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 5,
    title: "Podcast Highlights",
    description: "Extract and showcase best moments from longer content",
    platform: "Shorts",
    duration: 55,
    durationLabel: "0:55",
    rating: 4.6,
    uses: "34K",
    views: "450K",
    isPremium: false,
    isNew: false,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 6,
    title: "Course Module",
    description: "Professional online course lesson with slides integration",
    platform: "YouTube",
    duration: 900,
    durationLabel: "15:00",
    rating: 4.9,
    uses: "78K",
    views: "3.1M",
    isPremium: true,
    isNew: true,
    category: "long",
    apiType: 'yt_automation_short',
  },
  {
    id: 7,
    title: "Before & After",
    description: "Dramatic transformation reveal with split-screen effects",
    platform: "Instagram",
    duration: 20,
    durationLabel: "0:20",
    rating: 4.8,
    uses: "112K",
    views: "2.1M",
    isPremium: false,
    isNew: false,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 8,
    title: "Vlog Documentary",
    description: "Cinematic vlog format with b-roll integration points",
    platform: "YouTube",
    duration: 600,
    durationLabel: "10:00",
    rating: 4.7,
    uses: "45K",
    views: "1.2M",
    isPremium: true,
    isNew: false,
    category: "long",
    apiType: 'yt_automation_short',
  },
  {
    id: 9,
    title: "Quick Tips",
    description: "Fast-paced educational tips with text overlays",
    platform: "TikTok",
    duration: 30,
    durationLabel: "0:30",
    rating: 4.6,
    uses: "56K",
    views: "780K",
    isPremium: false,
    isNew: false,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 10,
    title: "Interview Series",
    description: "Professional two-person interview layout with lower thirds",
    platform: "YouTube",
    duration: 1200,
    durationLabel: "20:00",
    rating: 4.8,
    uses: "23K",
    views: "890K",
    isPremium: true,
    isNew: true,
    category: "long",
    apiType: 'yt_automation_short',
  },
  {
    id: 11,
    title: "Unboxing Experience",
    description: "Build anticipation with timed reveals and reactions",
    platform: "Shorts",
    duration: 45,
    durationLabel: "0:45",
    rating: 4.5,
    uses: "41K",
    views: "560K",
    isPremium: false,
    isNew: false,
    category: "short",
    apiType: 'yt_automation_short',
  },
  {
    id: 12,
    title: "Webinar Format",
    description: "Professional presentation with slides and speaker layout",
    platform: "YouTube",
    duration: 2700,
    durationLabel: "45:00",
    rating: 4.9,
    uses: "12K",
    views: "340K",
    isPremium: true,
    isNew: false,
    category: "long",
    apiType: 'yt_automation_short',
  },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [favorites, setFavorites] = useState<number[]>([])
  const router = useRouter()
  const { createProject, isCreating, error: projectError } = useProject()

  const filteredTemplates = templates.filter((template) => {
    const matchesDuration = 
      durationType === "all" || 
      (durationType === "short" && template.duration < 60) ||
      (durationType === "long" && template.duration >= 60)
    
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesDuration && matchesSearch
  })

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const handleUseTemplate = async (template: (typeof templates)[number]) => {
    if (isCreating) {
      return
    }

    try {
      const project = await createProject({
        title: template.title,
        template_type: template.apiType,
        settings: {
          tts_voice: 'am_michael',
          rewrite_style: 'professional',
        },
      });
      console.log('Project created:', project)
      if (project?.id) {
        router.push(`/dashboard/create?projectId=${project.id}`)
      }
    } catch (error) {
      console.error('Failed to create project', error)
    }
  }

  const shortCount = templates.filter(t => t.duration < 60).length
  const longCount = templates.filter(t => t.duration >= 60).length

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

      {projectError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {projectError}
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
                key={template.id}
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
                        toggleFavorite(template.id)
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background transition-colors"
                    >
                      <Heart className={cn(
                        "h-4 w-4 transition-colors",
                        favorites.includes(template.id) 
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
                      {template.title}
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
                key={template.id}
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
                              <h3 className="font-semibold text-foreground">{template.title}</h3>
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
                          onClick={() => toggleFavorite(template.id)}
                          className="p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Heart className={cn(
                            "h-4 w-4 transition-colors",
                            favorites.includes(template.id) 
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
