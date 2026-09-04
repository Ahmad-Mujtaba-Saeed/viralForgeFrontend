'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle, Check, Wand2, Send, X, CornerDownRight } from 'lucide-react'
import type { Storyboard } from './types'

/** Quality-gate report (§12): collapsible severity-chip summary of the
 *  storyboard lint — informational only, it never blocks a render. */
/**
 * The storyboard's edit surface: say what is wrong, in words.
 *
 * The promise that makes it usable — and the one the copy has to keep
 * repeating — is that only the cards the note is about get rebuilt. Every
 * other scene keeps the picture you uploaded to it and the voiceover already
 * recorded for it, so there is no reason to be shy about asking.
 */
export function RevisePanel({
  board, open, onOpen, text, onText, targets, onClearTarget, onSubmit, sending, error, textareaRef,
}: {
  board: Storyboard
  open: boolean
  onOpen: (open: boolean) => void
  text: string
  onText: (text: string) => void
  targets: string[]
  onClearTarget: (sceneId: string) => void
  onSubmit: () => void
  sending: boolean
  error: string | null
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const revision = board.revision
  const running = Boolean(revision?.running)
  const last = revision?.last ?? null
  const orderOf = (sceneId: string) => board.scenes.find((s) => s.scene_id === sceneId)?.order

  const examples = [
    'Scene 3 should be a bar chart of the revenue numbers, not bullet points.',
    'The intro is too long — cut it to one sentence.',
    'Add a scene after scene 5 explaining why the price fell.',
    'Drop the timeline card, it repeats what scene 2 already said.',
  ]

  const badge = (n: number | undefined, label: string, tone: string) =>
    n && n > 0 ? (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
        {n} {label}
      </span>
    ) : null

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card shadow-soft">
      <button
        onClick={() => onOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          {running ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Wand2 className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {running ? 'Applying your changes…' : 'Not right? Tell the AI what to change'}
          </span>
          {!running && !open ? (
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              — only the cards you mention are rebuilt
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-ink3">{open ? 'Hide' : 'Open'}</span>
      </button>

      {running && (
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span className="italic">“{revision?.request}”</span>
          <p className="mt-1 text-xs">
            Reading your note against the storyboard, rewriting only the cards it names, and fitting them back in.
            Everything else — including your uploads — is untouched.
          </p>
        </div>
      )}

      {open && !running && (
        <div className="border-t border-border p-4">
          {targets.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">About:</span>
              {targets.map((sceneId) => (
                <button
                  key={sceneId}
                  onClick={() => onClearTarget(sceneId)}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-inset"
                  title="Stop targeting this scene"
                >
                  Scene {orderOf(sceneId) ?? '?'}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit()
            }}
            rows={3}
            placeholder="e.g. “Scene 4's chart is wrong — use the 2019-2021 revenue instead” or “add a scene after scene 2 about the price cut”"
            className="w-full resize-y rounded-xl border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink3 focus:border-primary"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => onText(example)}
                  className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-inset"
                >
                  {example.length > 44 ? `${example.slice(0, 42)}…` : example}
                </button>
              ))}
            </div>
            <button
              onClick={onSubmit}
              disabled={sending || text.trim().length < 3}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Apply changes
            </button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Name a scene and only that card is rebuilt — anything you uploaded elsewhere, and the voiceover already
            made for it, stays exactly as it is. Up to {revision?.max_touched ?? 12} cards per request. Use{' '}
            <span className="font-semibold">Re-analyze</span> instead when you want the whole video rewritten.
          </p>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {!running && last && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {last.state === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-warn" />
            ) : (
              <Check className="h-4 w-4 text-good" />
            )}
            <span className="text-sm font-semibold text-foreground">
              {last.state === 'error' ? 'The last revision did not go through' : 'Last revision'}
            </span>
            {badge(last.changed?.length, 'rewritten', 'bg-accent-soft text-primary')}
            {badge(last.added?.length, 'added', 'bg-good/10 text-good')}
            {badge(last.removed?.length, 'removed', 'bg-warn/10 text-warn')}
            {badge(last.moved?.length, 'moved', 'bg-inset text-muted-foreground')}
          </div>

          {last.request ? (
            <p className="mt-1.5 text-sm italic text-muted-foreground">“{last.request}”</p>
          ) : null}
          {last.reply || last.message ? (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
              <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3" />
              <span>{last.reply || last.message}</span>
            </p>
          ) : null}
          {last.state === 'done' && last.summary ? (
            <p className="mt-1 text-xs text-muted-foreground">{last.summary}</p>
          ) : null}

          {(last.findings?.length ?? 0) > 0 && (
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {last.findings!.map((finding, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warn" />
                  <span>{finding.message}</span>
                </li>
              ))}
            </ul>
          )}

          {(revision?.log?.length ?? 0) > 1 && (
            <>
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                {historyOpen ? 'Hide' : `Show all ${revision!.log!.length} requests`}
              </button>
              {historyOpen && (
                <ul className="mt-2 space-y-1.5 border-t border-border pt-2">
                  {revision!.log!.map((entry, i) => (
                    <li key={i} className="text-xs">
                      <span className="italic text-muted-foreground">“{entry.request}”</span>
                      <span className="ml-1.5 text-ink3">— {entry.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

