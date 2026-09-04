'use client'

import * as React from 'react'
import {
  Captions, Grid3x3, Loader2, Music, RefreshCw, SlidersHorizontal, Sparkles, Volume2, Wand2, Wind,
} from 'lucide-react'
import type { Storyboard } from './types'

/**
 * QuickToggles — the six switches you actually flip while watching.
 *
 * Voice, music, captions, backdrop, motion blur and AI visuals were six
 * full-width buttons above the storyboard; they are the same six actions here,
 * as one segmented strip beside the stage. Each still has its full explanation
 * on hover, and every one of them also lives in the inspector's sections with
 * its neighbouring settings — this row is the shortcut, not the only way in.
 */
export function QuickToggles({
  board,
  isPending,
  settingsOpen,
  onToggleSettings,
  onToggleNarration,
  onToggleMusic,
  onToggleCaptions,
  onToggleBackdrop,
  onToggleMotionBlur,
  onToggleAutoVisuals,
  onReanalyze,
  onAskAi,
  revising,
}: {
  board: Storyboard
  isPending: (key: string) => boolean
  settingsOpen: boolean
  onToggleSettings: () => void
  onToggleNarration: () => void
  onToggleMusic: () => void
  onToggleCaptions: () => void
  onToggleBackdrop: () => void
  onToggleMotionBlur: () => void
  onToggleAutoVisuals: () => void
  onReanalyze: () => void
  onAskAi: () => void
  revising: boolean
}) {
  const toggles = [
    {
      key: 'narration',
      icon: <Volume2 className="h-4 w-4" />,
      on: board.narration_enabled ?? true,
      label: 'Voiceover',
      title: 'AI voiceover, recorded at render',
      onClick: onToggleNarration,
    },
    {
      key: 'music',
      icon: <Music className="h-4 w-4" />,
      on: board.music_enabled ?? true,
      label: 'Music bed',
      title: 'Curated background music (by scene mood)',
      onClick: onToggleMusic,
    },
    {
      key: 'captions',
      icon: <Captions className="h-4 w-4" />,
      on: board.captions_enabled ?? board.aspect_ratio === '9:16',
      label: 'Captions',
      title: 'Karaoke word captions synced to the voiceover',
      onClick: onToggleCaptions,
    },
    {
      key: 'backdrop',
      icon: <Grid3x3 className="h-4 w-4" />,
      on: board.backdrop_enabled ?? true,
      label: 'Backdrop',
      title: "A whisper-quiet grid/dot texture on the background, matched to each scene's mood",
      onClick: onToggleBackdrop,
    },
    {
      key: 'motion-blur',
      icon: <Wind className="h-4 w-4" />,
      on: board.motion_blur ?? true,
      label: 'Motion blur',
      title: "Blur the camera's fastest moves the way a shutter would, so quick flights read as motion instead of steps",
      onClick: onToggleMotionBlur,
    },
    {
      key: 'auto-visuals',
      icon: <Sparkles className="h-4 w-4" />,
      on: Boolean(board.auto_visuals),
      label: 'AI visuals',
      title: 'Unfilled image slots are AI-illustrated at render — nothing to upload. Uploads still override.',
      onClick: onToggleAutoVisuals,
    },
  ]

  const onCount = toggles.filter((t) => t.on).length

  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-inset p-1">
        {toggles.map((t) => (
          <button
            key={t.key}
            onClick={t.onClick}
            disabled={isPending(t.key)}
            title={`${t.label} — ${t.on ? 'on' : 'off'}. ${t.title}`}
            aria-pressed={t.on}
            className={`grid h-8 w-[34px] place-items-center rounded-[9px] transition-colors disabled:opacity-60 ${
              t.on ? 'bg-card text-primary shadow-soft' : 'bg-transparent text-ink3 hover:text-foreground'
            }`}
          >
            {isPending(t.key) ? <Loader2 className="h-4 w-4 animate-spin" /> : t.icon}
          </button>
        ))}
        <span className="mx-1 h-[22px] w-px bg-border" />
        <button
          onClick={onToggleSettings}
          title="Frame rate, aspect and the render bundle"
          className={`inline-flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-xs font-semibold transition-colors ${
            settingsOpen ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-[15px] w-[15px]" />
          Settings
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-ink3">{onCount} of 6 on</span>
        <button
          onClick={onAskAi}
          disabled={revising || board.status === 'analyzing'}
          title="Tell the AI what to change — only the cards your note is about are rebuilt"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-inset disabled:cursor-not-allowed disabled:opacity-60"
        >
          {revising ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <Wand2 className="h-3.5 w-3.5 text-primary" />
          )}
          {revising ? 'Applying…' : 'Edit with AI'}
        </button>
        <button
          onClick={onReanalyze}
          disabled={isPending('reanalyze') || revising}
          title="Rebuild the whole storyboard from the script — use “Edit with AI” to change only some cards"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending('reanalyze') ? 'animate-spin' : ''}`} />
          Re-analyze
        </button>
      </div>
    </div>
  )
}
