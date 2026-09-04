'use client'

import * as React from 'react'
import {
  BadgeCheck, BookMarked, ChevronDown, ChevronUp, Columns2, Grid3x3, Loader2, Lock,
  Palette, ShieldCheck, Shuffle, Volume2, VolumeX, Wand2, Wind, Music, Music2,
  Captions, CaptionsOff, Plus, Sparkles,
} from 'lucide-react'
import { BrandControls } from './BrandControls'
import { LintReport } from './LintReport'
import { MusicPanel } from './MusicPanel'
import { StyleSelect, type SelectOption } from './StyleSelect'
import { COMPOSITION_LABELS, type Storyboard } from './types'

/**
 * The look/sound/motion/brand/delivery controls, folded into the inspector.
 *
 * Every control the storyboard ever had is here — the rows just stopped being
 * five full-width bars stacked above the scenes. Each section header carries
 * the setting's current value so the panel answers "what is this video set to"
 * without being opened, which is what the old bars were really for.
 */

export type SettingsHandlers = {
  onShuffleTheme: () => void
  onColorScheme: (name: string) => void
  onDeleteScheme: (name: string) => void
  onNewScheme: () => void
  onFontPack: (pack: string) => void
  onSkin: (skin: string) => void
  onCompositionMode: (mode: string) => void
  onBoardStyle: (style: string) => void
  onMotionStyle: (style: string) => void
  onRenderFps: (fps: number) => void
  onToggleMotionBlur: () => void
  onToggleBackdrop: () => void
  onToggleNarration: () => void
  onToggleMusic: () => void
  onToggleCaptions: () => void
  onToggleAutoVisuals: () => void
  onToggleChapterChip: () => void
  onToggleAccentShift: () => void
  onToggleAspectVariants: () => void
  onBrandLogo: (file: File | null, remove?: boolean) => void
  onBrandColor: (color: string) => void
}

export type PendingHelpers = {
  isPending: (key: string) => boolean
  groupPending: (prefix: string) => boolean
  pendingKeyIn: (prefix: string) => string | null
  switchingMode: string | null
}

function Section({
  id, icon, title, summary, open, onToggle, children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  summary: string
  open: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border">
      <button
        onClick={() => onToggle(id)}
        className={`flex w-full items-center justify-between gap-2.5 px-4 py-3 text-left transition-colors hover:bg-inset ${
          open ? 'bg-inset/60' : 'bg-transparent'
        }`}
      >
        <span className="flex items-center gap-2.5 text-[13px] font-bold text-foreground">
          <span className="text-primary [&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
          {title}
        </span>
        <span className="flex items-center gap-2">
          <span className="max-w-[150px] truncate font-mono text-[11px] text-ink3">{summary}</span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-ink3" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-ink3" />
          )}
        </span>
      </button>
      {open && <div className="flex flex-col gap-3 px-4 pb-4 pt-0.5">{children}</div>}
    </div>
  )
}

/** label — control, the shape every settings row in the design takes. */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
      <span className="text-muted-foreground" title={hint}>
        {label}
      </span>
      {children}
    </div>
  )
}

/** A boolean, as a pill that says which way it is set. */
function Toggle({
  on, onClick, busy, onIcon, offIcon, label, title, disabled,
}: {
  on: boolean
  onClick: () => void
  busy?: boolean
  onIcon: React.ReactNode
  offIcon?: React.ReactNode
  label: string
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        on ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-card text-muted-foreground hover:bg-inset'
      }`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : on ? (
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{onIcon}</span>
      ) : (
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{offIcon ?? onIcon}</span>
      )}
      {label} {on ? 'On' : 'Off'}
    </button>
  )
}

export function SettingsSections({
  board, projectId, onChange, handlers, pendings,
}: {
  board: Storyboard
  projectId: string
  onChange: () => Promise<void> | void
  handlers: SettingsHandlers
  pendings: PendingHelpers
}) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({ look: true })
  const toggleSection = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }))

  const { isPending, groupPending, pendingKeyIn, switchingMode } = pendings

  // Chalk and notebook boards — and the blueprint SKIN — ship a FIXED palette
  // that replaces the video's theme wholesale, so the colour scheme controls
  // would be lying if they stayed live. The registry marks which styles do
  // this — the UI does not hardcode the list.
  const resolvedBoardStyle = board.board_style_resolved ?? 'slate'
  const boardLocksTheme =
    board.composition_mode === 'math_board' &&
    Boolean(board.board_styles?.[resolvedBoardStyle]?.overrides_theme)
  const resolvedSkin = board.skin_resolved ?? 'flat'
  const skinLocksTheme = Boolean(board.skins?.[resolvedSkin]?.overrides_theme)
  const themeLocked = boardLocksTheme || skinLocksTheme
  const lockedBoardLabel = board.board_styles?.[resolvedBoardStyle]?.label ?? resolvedBoardStyle
  const themeLockOwner = boardLocksTheme
    ? `the ${lockedBoardLabel} board`
    : `the ${board.skins?.[resolvedSkin]?.label ?? resolvedSkin} skin`
  const themeLockEscape = boardLocksTheme
    ? 'Switch the board to Slate to use it.'
    : 'Switch the skin to Flat to use it.'
  const capitalisedOwner = `${themeLockOwner[0].toUpperCase()}${themeLockOwner.slice(1)}`

  const narrationOn = board.narration_enabled ?? true
  const musicOn = board.music_enabled ?? true
  const captionsOn = board.captions_enabled ?? board.aspect_ratio === '9:16'
  const backdropOn = board.backdrop_enabled ?? true
  const motionBlurOn = board.motion_blur ?? true
  const autoVisualsOn = Boolean(board.auto_visuals)
  const smoothFps = board.render_fps ?? 30

  // The palette list the picker shows. Built-ins have a recorded loop keyed by
  // name; a scheme the user mixed has none, so it carries its own colours for
  // the preview pane and the delete the row offers.
  const schemeOptions: SelectOption[] = React.useMemo(
    () =>
      (board.color_schemes ?? []).map((scheme) => {
        const custom = Boolean((scheme as { custom?: boolean }).custom)
        return {
          key: scheme.name,
          label: scheme.label,
          hint: custom ? 'A scheme you mixed — only you can see it.' : undefined,
          swatch: custom
            ? [scheme.bg_from, scheme.accent, scheme.accent2, scheme.text]
            : undefined,
          onDelete: custom ? () => handlers.onDeleteScheme(scheme.name) : undefined,
        }
      }),
    [board.color_schemes, handlers]
  )

  const motionSummary =
    board.motion_style && board.motion_style !== 'auto'
      ? board.motion_styles?.[board.motion_style]?.label ?? board.motion_style
      : board.motion_style_auto
        ? `Auto · ${board.motion_styles?.[board.motion_style_auto]?.label ?? board.motion_style_auto}`
        : 'Auto'

  return (
    <div className="border-t border-border">
      <Section
        id="look"
        icon={<Palette />}
        title="Look"
        summary={board.theme?.label ?? 'Auto'}
        open={Boolean(open.look)}
        onToggle={toggleSection}
      >
        {board.theme && (
          <>
            <StyleSelect
              group="scheme"
              label="Colour scheme"
              value={board.color_scheme ?? board.theme.name}
              pendingKey={pendingKeyIn('color-scheme')}
              disabled={groupPending('color-scheme') || themeLocked}
              onSelect={handlers.onColorScheme}
              options={schemeOptions}
              footer={
                <button
                  onClick={handlers.onNewScheme}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-inset"
                >
                  <Plus className="h-3.5 w-3.5" /> New colour scheme
                </button>
              }
            />
            <Row label="Palette">
              <span className="inline-flex items-center gap-2">
                <span className="flex gap-1">
                  {[board.theme.bg_to, board.theme.accent, board.theme.accent2, board.theme.text].map((c, i) => (
                    <span key={i} className="h-[22px] w-[22px] rounded-full border border-border" style={{ background: c }} />
                  ))}
                </span>
                <button
                  onClick={handlers.onShuffleTheme}
                  disabled={isPending('shuffle-theme') || themeLocked}
                  title={themeLocked ? capitalisedOwner + ' paints with its own fixed palette.' : 'Try another palette'}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shuffle className={isPending('shuffle-theme') ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} /> Shuffle
                </button>
              </span>
            </Row>
            {themeLocked && (
              <p className="flex items-start gap-1.5 rounded-lg bg-warn-soft px-2.5 py-1.5 text-[11px] text-warn">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                <span>The colour scheme is overridden by {themeLockOwner}. {themeLockEscape}</span>
              </p>
            )}
          </>
        )}

        {board.font_packs && Object.keys(board.font_packs).length > 0 && (
          <StyleSelect
            group="font"
            label="Typeface"
            value={board.font_pack ?? 'auto'}
            pendingKey={pendingKeyIn('font-pack')}
            disabled={groupPending('font-pack')}
            onSelect={handlers.onFontPack}
            options={[
              { key: 'auto', label: 'Auto', hint: 'Let the system pick the typography for the topic.' },
              ...Object.entries(board.font_packs).map(([key, meta]) => ({
                key,
                label: meta?.label ?? key,
                hint: meta?.use_when,
              })),
            ]}
          />
        )}

        {board.skins && (
          <StyleSelect
            group="skin"
            label="Skin"
            value={board.skin ?? 'auto'}
            pendingKey={pendingKeyIn('skin')}
            disabled={groupPending('skin')}
            onSelect={handlers.onSkin}
            options={[
              {
                key: 'auto',
                label: 'Auto',
                hint: 'Let the AI pick the surface treatment.',
                autoLabel: board.skin_auto ? board.skins[board.skin_auto]?.label ?? board.skin_auto : undefined,
              },
              ...Object.entries(board.skins).map(([key, meta]) => ({
                key,
                label: meta?.label ?? key,
                hint: meta?.use_when,
              })),
            ]}
          />
        )}

        {(board.composition_modes?.length ?? 0) > 0 &&
          (board.composition_mode === 'math_board' ? (
            board.board_styles && Object.keys(board.board_styles).length > 0 ? (
              <>
                <StyleSelect
                  group="board"
                  label="Board"
                  value={board.board_style ?? 'auto'}
                  pendingKey={pendingKeyIn('board-style')}
                  disabled={groupPending('board-style')}
                  onSelect={handlers.onBoardStyle}
                  options={[
                    {
                      key: 'auto',
                      label: 'Auto',
                      hint: 'Match the board to the topic: proofs get the chalkboard, worked problems the notebook.',
                      autoLabel: board.board_style_auto
                        ? board.board_styles[board.board_style_auto]?.label ?? board.board_style_auto
                        : undefined,
                    },
                    ...Object.entries(board.board_styles).map(([key, meta]) => ({
                      key,
                      label: meta?.label ?? key,
                      hint: meta?.use_when,
                    })),
                  ]}
                />
                <p className="text-[11px] text-muted-foreground">
                  Solved on one continuous board with a write-along camera — picked automatically for worked math.
                </p>
              </>
            ) : null
          ) : (
            <>
              <StyleSelect
                group="composition"
                label="Composition"
                value={board.composition_mode ?? ''}
                pendingKey={switchingMode}
                disabled={switchingMode !== null}
                onSelect={handlers.onCompositionMode}
                options={(board.composition_modes ?? []).map((mode) => ({
                  key: mode,
                  label: COMPOSITION_LABELS[mode] ?? mode,
                  hint:
                    mode === 'hybrid'
                      ? 'The AI mixes camera journeys and slide cuts to fit the script.'
                      : mode === 'canvas_journey'
                        ? 'One continuous camera flight across every scene.'
                        : 'Classic scene-by-scene transitions.',
                }))}
              />
              {board.composition_mode === 'hybrid' && board.chapter_plan?.chapters?.length ? (
                <p className="text-[11px] text-muted-foreground">
                  {board.chapter_plan.chapters.length} chapters{' '}
                  {board.chapter_plan.chapters.map((c) => c.mode).join(' - ')}
                </p>
              ) : null}
            </>
          ))}
      </Section>

      <Section
        id="sound"
        icon={<Volume2 />}
        title="Sound"
        summary={narrationOn ? (musicOn ? 'Voice + music' : 'Voice only') : musicOn ? 'Music only' : 'Silent'}
        open={Boolean(open.sound)}
        onToggle={toggleSection}
      >
        <Row label="Voiceover" hint="AI voiceover, recorded at render">
          <Toggle
            on={narrationOn}
            busy={isPending('narration')}
            onClick={handlers.onToggleNarration}
            onIcon={<Volume2 />}
            offIcon={<VolumeX />}
            label="Voice"
            title="AI voiceover"
          />
        </Row>
        <Row label="Music bed" hint="Curated background music, by scene mood">
          <Toggle
            on={musicOn}
            busy={isPending('music')}
            onClick={handlers.onToggleMusic}
            onIcon={<Music />}
            offIcon={<Music2 />}
            label="Music"
            title="Curated background music (by scene mood)"
          />
        </Row>
        {musicOn && <MusicPanel board={board} projectId={projectId} onChange={onChange} />}
      </Section>

      <Section
        id="motion"
        icon={<Wand2 />}
        title="Motion"
        summary={motionSummary}
        open={Boolean(open.motion)}
        onToggle={toggleSection}
      >
        {board.motion_styles && (
          <StyleSelect
            group="motion"
            label="Style"
            value={board.motion_style ?? 'auto'}
            pendingKey={pendingKeyIn('motion-style')}
            disabled={groupPending('motion-style')}
            onSelect={handlers.onMotionStyle}
            options={[
              {
                key: 'auto',
                label: 'Auto',
                hint: 'Let the AI match the motion to the topic.',
                autoLabel: board.motion_style_auto
                  ? board.motion_styles[board.motion_style_auto]?.label ?? board.motion_style_auto
                  : undefined,
              },
              ...Object.entries(board.motion_styles).map(([key, meta]) => ({
                key,
                label: meta?.label ?? key,
                hint: meta?.use_when,
              })),
            ]}
          />
        )}
        {(board.render_fps_options?.length ?? 0) > 1 && (
          <StyleSelect
            group="fps"
            label="Frame rate"
            value={String(smoothFps)}
            pendingKey={pendingKeyIn('render-fps')}
            disabled={groupPending('render-fps')}
            onSelect={(key) => handlers.onRenderFps(Number(key))}
            options={(board.render_fps_options ?? []).map((fps) => ({
              key: String(fps),
              label: fps + ' fps',
              hint:
                fps >= 60
                  ? 'Every camera move travels half as far between frames — the smoothest result. Renders take about twice as long.'
                  : 'The standard clock. Fast flights lean on motion blur to stay smooth.',
            }))}
          />
        )}
        <Row label="Motion blur">
          <Toggle
            on={motionBlurOn}
            busy={isPending('motion-blur')}
            onClick={handlers.onToggleMotionBlur}
            onIcon={<Wind />}
            label="Blur"
            title="Blur the camera's fastest moves the way a shutter would, so quick flights read as motion instead of steps"
          />
        </Row>
        <Row label="Backdrop">
          <Toggle
            on={backdropOn}
            busy={isPending('backdrop')}
            onClick={handlers.onToggleBackdrop}
            onIcon={<Grid3x3 />}
            label="Backdrop"
            title="A whisper-quiet grid/dot texture on the background, matched to each scene's mood"
          />
        </Row>
      </Section>

      <Section
        id="brand"
        icon={<BadgeCheck />}
        title="Brand"
        summary={board.brand?.logo_url ? 'Logo set' : 'No logo'}
        open={Boolean(open.brand)}
        onToggle={toggleSection}
      >
        <BrandControls
          board={board}
          onLogo={handlers.onBrandLogo}
          onColor={handlers.onBrandColor}
          logoPending={isPending('brand-logo')}
          colorPending={isPending('brand-color')}
        />
        {board.composition_mode === 'hybrid' && (
          <>
            <Row label="Chapter chip">
              <Toggle
                on={Boolean(board.chapter_chip)}
                busy={isPending('chapter-chip')}
                onClick={handlers.onToggleChapterChip}
                onIcon={<BookMarked />}
                label="Chip"
                title="Show a 02 / 06 chapter counter in the corner"
              />
            </Row>
            <Row label="Accent shift">
              <Toggle
                on={Boolean(board.accent_shift) && !themeLocked}
                busy={isPending('accent-shift')}
                disabled={themeLocked}
                onClick={handlers.onToggleAccentShift}
                onIcon={<Palette />}
                label="Shift"
                title={
                  themeLocked
                    ? `${capitalisedOwner} paints with its own fixed palette — accent shift has no effect on it.`
                    : 'Each chapter after the first tilts the accent hue ±20° so act breaks read in colour too'
                }
              />
            </Row>
          </>
        )}
      </Section>

      <Section
        id="delivery"
        icon={<Columns2 />}
        title="Delivery"
        summary={board.aspect_variants ? 'All aspects' : board.aspect_ratio}
        open={Boolean(open.delivery)}
        onToggle={toggleSection}
      >
        <Row label="Captions">
          <Toggle
            on={captionsOn}
            busy={isPending('captions')}
            onClick={handlers.onToggleCaptions}
            onIcon={<Captions />}
            offIcon={<CaptionsOff />}
            label="Captions"
            title="Karaoke word captions synced to the voiceover"
          />
        </Row>
        <Row label="AI visuals">
          <Toggle
            on={autoVisualsOn}
            busy={isPending('auto-visuals')}
            onClick={handlers.onToggleAutoVisuals}
            onIcon={<Sparkles />}
            label="AI art"
            title="Unfilled image slots are AI-illustrated at render — nothing to upload. Uploads still override."
          />
        </Row>
        <Row label="Also render 9:16 & 1:1">
          <Toggle
            on={Boolean(board.aspect_variants)}
            busy={isPending('aspect-variants')}
            onClick={handlers.onToggleAspectVariants}
            onIcon={<Columns2 />}
            label="Variants"
            title={`Render 16:9 + 9:16 + 1:1 in one go (${board.aspect_variants_multiplier ?? 2.5}× credits)`}
          />
        </Row>
        <p className="text-[11px] text-muted-foreground">
          Every render ships an MP4, an SRT caption file and a YouTube kit (chapters, description, hashtags).
        </p>
      </Section>

      {board.lint_report?.items?.length ? (
        <Section
          id="quality"
          icon={<ShieldCheck />}
          title="Quality check"
          summary={`${board.lint_report.counts.error}E · ${board.lint_report.counts.warn}W · ${board.lint_report.counts.info}I`}
          open={Boolean(open.quality)}
          onToggle={toggleSection}
        >
          <LintReport report={board.lint_report} />
        </Section>
      ) : null}
    </div>
  )
}
