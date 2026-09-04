'use client'

import * as React from 'react'
import api from '@/lib/axios'
import { Captions, Check, Download, FileText, Film, Loader2, Pencil, Play, Wand2, X, Zap } from 'lucide-react'
import type { Storyboard } from './types'

/** m:ss over the whole storyboard. */
const stamp = (seconds: number): string => {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${String(Math.round(safe % 60)).padStart(2, '0')}`
}

/**
 * EditorHeader — what this project is, what it costs, and how to ship it.
 *
 * "Export kit" is the §10.7 deliverables in one place: the MP4 (per aspect,
 * when the §10.6 bundle was rendered), the SRT and the YouTube kit. It is
 * disabled until a render exists, because until then there is nothing to hand
 * over.
 */
export function EditorHeader({
  board,
  credits,
  cost,
  rendering,
  canRender,
  canAfford,
  hasSubscription,
  onRender,
  projectId,
  onRenamed,
}: {
  board: Storyboard
  credits: number
  cost: number
  rendering: boolean
  canRender: boolean
  canAfford: boolean
  hasSubscription: boolean
  onRender: () => void
  projectId: string
  onRenamed: () => void
}) {
  const [kitOpen, setKitOpen] = React.useState(false)
  const kitRef = React.useRef<HTMLDivElement | null>(null)

  // Rename. The title is the storyboard heading, the copy the thumbnail is
  // built from and what the YouTube packaging writes around, so it is worth
  // being able to change once the video has taken shape — it was fixed at
  // creation with no way back.
  const [renaming, setRenaming] = React.useState(false)
  const [draft, setDraft] = React.useState(board.title)
  const [saving, setSaving] = React.useState(false)
  const [renameError, setRenameError] = React.useState<string | null>(null)
  const titleRef = React.useRef<HTMLInputElement | null>(null)

  const openRename = () => {
    setDraft(board.title)
    setRenameError(null)
    setRenaming(true)
    setTimeout(() => {
      titleRef.current?.focus()
      titleRef.current?.select()
    }, 30)
  }

  const saveTitle = async () => {
    const next = draft.trim().replace(/\s+/g, ' ')
    if (next === board.title || next.length < 2) {
      setRenaming(false)
      return
    }
    setSaving(true)
    setRenameError(null)
    try {
      await api.post(`/api/explainer/projects/${projectId}/title`, { title: next })
      onRenamed()
      setRenaming(false)
    } catch (err: any) {
      setRenameError(err?.response?.data?.message || 'Could not rename this video.')
    } finally {
      setSaving(false)
    }
  }

  React.useEffect(() => {
    if (!kitOpen) return
    const onDown = (e: MouseEvent) => {
      if (!kitRef.current?.contains(e.target as Node)) setKitOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [kitOpen])

  const totalSeconds = board.scenes.reduce((a, s) => a + s.duration_seconds, 0)
  const videos = (board.output_videos ?? []).filter((v) => v.url)
  const hasKit = Boolean(board.output_url || board.srt_url || board.youtube_kit_url || videos.length)

  return (
    <header className="flex flex-none flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border pb-3.5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="inline-flex items-center gap-2 rounded-lg border border-accent-line bg-accent-soft px-2.5 py-1.5 text-[12px] font-bold tracking-[0.02em] text-primary">
          <Wand2 className="h-3.5 w-3.5" />
          AI EXPLAINER
        </span>
        <div className="min-w-0">
          {renaming ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={titleRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveTitle()
                  if (e.key === 'Escape') setRenaming(false)
                }}
                maxLength={120}
                disabled={saving}
                aria-label="Video title"
                className="w-[min(60vw,420px)] rounded-lg border border-primary bg-inset px-2 py-1 font-display text-[17px] font-semibold tracking-tight text-foreground outline-none disabled:opacity-60"
              />
              <button
                onClick={() => void saveTitle()}
                disabled={saving || draft.trim().length < 2}
                title="Save"
                className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setRenaming(false)}
                title="Cancel"
                className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-inset"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openRename}
              title="Rename this video"
              className="group flex min-w-0 items-center gap-1.5 text-left"
            >
              <h1 className="truncate font-display text-[17px] font-semibold tracking-tight text-foreground">
                {board.title}
              </h1>
              <Pencil className="h-3 w-3 shrink-0 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          {renameError && <p className="text-[11px] text-warn">{renameError}</p>}
          <div className="font-mono text-[12px] text-ink3">
            {board.scenes.length} scene{board.scenes.length === 1 ? '' : 's'} · {stamp(totalSeconds)} ·{' '}
            {board.aspect_ratio} · <span className="capitalize">{board.status}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span
          title={hasSubscription ? `${credits} credits · this render costs ${cost}` : 'Subscribe to render'}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-semibold text-muted-foreground"
        >
          <Zap className={`h-3.5 w-3.5 ${canAfford ? 'text-primary' : 'text-warn'}`} />
          {credits.toLocaleString()}
        </span>

        <div className="relative" ref={kitRef}>
          <button
            onClick={() => setKitOpen((o) => !o)}
            disabled={!hasKit}
            title={hasKit ? 'Download the finished files' : 'Nothing to export until this video has rendered'}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-inset disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            Export kit
          </button>
          {kitOpen && hasKit && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-60 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-soft-lg">
              {(videos.length ? videos : [{ aspect: board.aspect_ratio, label: 'Video', url: board.output_url }]).map(
                (v) =>
                  v.url ? (
                    <a
                      key={v.aspect}
                      href={v.url}
                      download
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-inset"
                    >
                      <Play className="h-3.5 w-3.5 text-primary" /> MP4 · {v.aspect}
                    </a>
                  ) : null
              )}
              {board.srt_url && (
                <a
                  href={board.srt_url}
                  download
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-inset"
                >
                  <Captions className="h-3.5 w-3.5 text-primary" /> SRT captions
                </a>
              )}
              {board.youtube_kit_url && (
                <a
                  href={board.youtube_kit_url}
                  download
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-inset"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" /> YouTube kit
                </a>
              )}
              {board.thumbnail_url && (
                <a
                  href={board.thumbnail_url}
                  download
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-inset"
                >
                  <Download className="h-3.5 w-3.5 text-primary" /> Thumbnail
                </a>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onRender}
          disabled={!canRender}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-lg bg-foreground px-4 text-[13px] font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {board.status === 'processing' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering {board.progress}%
            </>
          ) : rendering ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting…
            </>
          ) : !canAfford ? (
            <>
              <Film className="h-3.5 w-3.5" /> {hasSubscription ? 'Get credits' : 'View plans'}
            </>
          ) : (
            <>
              <Film className="h-3.5 w-3.5" /> Render video
            </>
          )}
        </button>
      </div>
    </header>
  )
}
