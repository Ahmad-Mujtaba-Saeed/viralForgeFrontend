"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Plus,
  Sparkles,
  Film,
  Link2,
  ChevronRight,
  Play,
} from "lucide-react"
import { useProject } from "@/hooks/useProject"
import { useProjectsLiveProgress } from "@/hooks/useProjectsLiveProgress"
import type { Project } from "@/store/projectSlice"
import { Skeleton } from "@/components/ui/skeleton"

const quickStarts = [
  {
    title: "Faceless short",
    sub: "Story · 9:16",
    href: "/dashboard/templates",
    icon: Film,
    color: "#E8492B",
  },
  {
    title: "AI Explainer",
    sub: "Script → video",
    href: "/dashboard/explainer",
    icon: Sparkles,
    color: "#8A57D8",
  },
  {
    title: "From a link",
    sub: "Repurpose a video",
    href: "/dashboard/templates",
    icon: Link2,
    color: "#3B6FE0",
  },
]

const statusBadge = (status?: string): { label: string; cls: string } => {
  switch (status) {
    case "completed":
      return { label: "Done", cls: "bg-good-soft text-good" }
    case "processing":
      return { label: "Rendering", cls: "bg-warn-soft text-warn" }
    case "failed":
      return { label: "Failed", cls: "bg-accent-soft text-primary" }
    default:
      return { label: "Draft", cls: "bg-inset text-muted-foreground" }
  }
}

const gradientFor = (seed: number) => {
  const palette = [
    "linear-gradient(160deg,#2A1E3A,#15131C)",
    "linear-gradient(160deg,#11324A,#0C1A26)",
    "linear-gradient(160deg,#16302A,#0C1A17)",
    "linear-gradient(160deg,#2E2410,#171206)",
    "linear-gradient(160deg,#3A1320,#1C0C12)",
    "linear-gradient(160deg,#1A1430,#0E0B1A)",
  ]
  return palette[seed % palette.length]
}

const timeAgo = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return ""
  const diff = Date.now() - d
  const m = Math.round(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  return `${days}d ago`
}

const prettyTemplate = (t?: string) =>
  (t || "Project").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export function DashboardContent() {
  const router = useRouter()
  const { projects, isFetchingProjects, fetchProjects } = useProject() as {
    projects: Project[]
    isFetchingProjects?: boolean
    fetchProjects: () => Promise<unknown>
  }

  useEffect(() => {
    fetchProjects().catch(() => {})
  }, [fetchProjects])

  const sorted = useMemo(
    () =>
      [...(projects ?? [])].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : a.id
        const tb = b.created_at ? new Date(b.created_at).getTime() : b.id
        return tb - ta
      }),
    [projects]
  )

  const rendering = sorted.find((p) => p.status === "processing")
  const recent = sorted.filter((p) => p.id !== rendering?.id).slice(0, 8)
  const draftCount = sorted.filter(
    (p) => !["processing", "completed"].includes(p.status)
  ).length

  const renderingIds = useMemo(() => (rendering ? [rendering.id] : []), [rendering?.id])
  useProjectsLiveProgress(renderingIds)

  const open = (id: number) => router.push(`/dashboard/create?projectId=${id}`)

  return (
    <div className="space-y-8">
      {/* Heading + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {rendering ? (
              <>
                You have <b className="text-foreground">1 render in progress</b>
                {draftCount > 0 ? <> and {draftCount} drafts waiting.</> : "."}
              </>
            ) : (
              <>You have {sorted.length} project{sorted.length === 1 ? "" : "s"}.</>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/templates"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New video
        </Link>
      </div>

      {/* Quick starts */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {quickStarts.map((q) => (
          <Link
            key={q.title}
            href={q.href}
            className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: q.color }}
            >
              <q.icon className="h-[19px] w-[19px]" />
            </span>
            <span className="flex flex-col">
              <span className="text-[14.5px] font-semibold text-foreground">{q.title}</span>
              <span className="text-[12.5px] text-ink3">{q.sub}</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-ink3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {/* Rendering now */}
      {rendering && (
        <section>
          <h2 className="mb-3.5 text-base font-semibold tracking-tight text-foreground">
            Rendering now
          </h2>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:gap-5 sm:p-5">
            <div
              className="relative h-[74px] w-[54px] flex-shrink-0 overflow-hidden rounded-lg"
              style={{ background: gradientFor(rendering.id) }}
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,.05),rgba(255,255,255,.05)_6px,transparent_6px,transparent_13px)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="truncate text-[14.5px] font-semibold text-foreground">
                  {rendering.title || "Untitled Project"}
                </span>
                <span className="flex-shrink-0 rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-bold text-warn">
                  Rendering
                </span>
              </div>
              <div className="mt-1 text-[12.5px] text-ink3">
                {prettyTemplate(rendering.template_type)} · started {timeAgo(rendering.created_at) || "recently"}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(rendering.progress ?? 0, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {Math.min(rendering.progress ?? 0, 100)}%
                </span>
              </div>
            </div>
            <button
              onClick={() => open(rendering.id)}
              className="h-9 flex-shrink-0 rounded-lg border border-border bg-card px-4 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              View
            </button>
          </div>
        </section>
      )}

      {/* Recent projects */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Recent projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-[13px] font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {isFetchingProjects && recent.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <div className="space-y-1.5 px-0.5 pt-2.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No projects yet.</p>
            <Link
              href="/dashboard/templates"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Create your first video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((p) => {
              const badge = statusBadge(p.status)
              return (
                <button
                  key={p.id}
                  onClick={() => open(p.id)}
                  className="group cursor-pointer text-left"
                >
                  <div
                    className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl"
                    style={{ background: gradientFor(p.id) }}
                  >
                    {p.thumbnail_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail_path}
                        alt={p.title || "thumbnail"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(125deg,rgba(255,255,255,.04),rgba(255,255,255,.04)_7px,transparent_7px,transparent_15px)]" />
                    )}
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
                    </span>
                    <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="px-0.5 pt-2.5">
                    <div className="truncate text-[13.5px] font-semibold text-foreground">
                      {p.title || "Untitled Project"}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink3">
                      {prettyTemplate(p.template_type)}
                      {p.created_at ? ` · ${timeAgo(p.created_at)}` : ""}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
