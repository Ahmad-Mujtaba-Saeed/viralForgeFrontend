'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Coins,
  Loader2,
  Lock,
  ReceiptText,
  SlidersHorizontal,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

// Chart mark color — the Liquid Glass violet accent, one tone per surface so
// the mark keeps contrast on both the light and dark card.
const BAR_LIGHT = '#6D5EF6'
const BAR_DARK = '#8B7CFF'

type WindowTotals = { events: number; renders: number; cost_usd: number }

type ServiceRow = { service: string; events: number; units: number; unit: string; cost_usd: number }

type TemplateRow = {
  template_type: string | null
  renders: number
  events: number
  cost_usd: number
  avg_per_render: number | null
}

type RecentRow = {
  project_id: number | null
  title: string | null
  status: string | null
  project_deleted: boolean
  template_type: string | null
  user: { id: number; name: string; email: string } | null
  events: number
  cost_usd: number
  last_event_at: string
}

type CostsResponse = {
  totals: { today: WindowTotals; last_7_days: WindowTotals; last_30_days: WindowTotals; all_time: WindowTotals }
  by_service: ServiceRow[]
  by_template: TemplateRow[]
  daily: { day: string; cost_usd: number }[]
  recent: RecentRow[]
  rates: Record<string, number>
  rate_labels: Record<string, string>
  rate_defaults: Record<string, number>
}

type LedgerEvent = {
  id: number
  service: string
  label: string
  units: number
  unit: string
  cost_usd: number
  meta: Record<string, unknown> | null
  created_at: string | null
}

type ProjectDetail = {
  project: { id: number; title: string | null; status: string | null; template_type: string | null; deleted: boolean }
  user: { id: number; name: string; email: string } | null
  total_cost_usd: number
  by_service: ServiceRow[]
  events: LedgerEvent[]
}

const SERVICE_LABELS: Record<string, string> = {
  openai_chat: 'OpenAI Chat',
  openai_tts: 'OpenAI TTS',
  fal_image: 'Fal Images',
}

function fmtUsd(v: number): string {
  if (v === 0) return '$0.00'
  if (v < 0.01) return `$${v.toFixed(4)}`
  if (v < 1) return `$${v.toFixed(3)}`
  return `$${v.toFixed(2)}`
}

function prettyTemplate(t: string | null): string {
  if (!t) return 'Unattributed'
  return t
    .split('_')
    .map((w) => (w === 'ai' ? 'AI' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

function prettyLabel(label: string): string {
  return label.replace(/_/g, ' ')
}

function fmtWhen(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function usageText(e: LedgerEvent): string {
  const meta = e.meta ?? {}
  if (e.service === 'openai_chat') {
    const model = typeof meta.model === 'string' && meta.model !== '' ? meta.model : 'gpt-4o-mini'
    const inTok = Number(meta.prompt_tokens ?? 0)
    const outTok = Number(meta.completion_tokens ?? 0)
    return `${inTok.toLocaleString()} in · ${outTok.toLocaleString()} out (${model})`
  }
  if (e.service === 'openai_tts') {
    return `${e.units} min of audio`
  }
  return `${e.units} ${e.unit}`
}

function SectionCard({
  icon: Icon,
  title,
  sub,
  children,
  delay = 0,
}: {
  icon: React.ElementType
  title: string
  sub: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-border bg-card p-6 shadow-soft"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

function StatTile({ label, totals }: { label: string; totals: WindowTotals }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-foreground">
        {fmtUsd(totals.cost_usd)}
      </p>
      <p className="mt-0.5 text-xs text-ink3">
        {totals.events.toLocaleString()} events · {totals.renders.toLocaleString()} renders
      </p>
    </div>
  )
}

/** Top-rounded column path anchored to the baseline (never rounds the base). */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(3, h / 2, w / 2)
  const bottom = y + h
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${bottom}`,
    'Z',
  ].join(' ')
}

function DailySpendChart({ daily }: { daily: { day: string; cost_usd: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)

  // 30-day domain ending today; the API only returns days with events.
  const days = useMemo(() => {
    const byDay = new Map(daily.map((d) => [d.day, d.cost_usd]))
    const out: { day: string; cost: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      out.push({ day: key, cost: byDay.get(key) ?? 0 })
    }
    return out
  }, [daily])

  const W = 800
  const H = 210
  const pad = { top: 10, right: 8, bottom: 24, left: 46 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const maxCost = Math.max(...days.map((d) => d.cost), 0.01)
  const step = plotW / days.length
  const barW = Math.max(4, step - 6)
  const yFor = (v: number) => pad.top + plotH * (1 - v / maxCost)
  const ticks = [0, maxCost / 2, maxCost]
  const allZero = days.every((d) => d.cost === 0)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily AI spend, last 30 days">
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={yFor(t)}
              y2={yFor(t)}
              className={i === 0 ? 'stroke-border' : 'stroke-border/50'}
              strokeWidth={1}
            />
            <text x={pad.left - 8} y={yFor(t) + 3.5} textAnchor="end" className="fill-ink3 text-[10px]">
              {fmtUsd(t)}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = pad.left + i * step + (step - barW) / 2
          const h = Math.max(d.cost > 0 ? 2 : 0, plotH * (d.cost / maxCost))
          const y = pad.top + plotH - h
          return (
            <g key={d.day}>
              {h > 0 && (
                <path
                  d={barPath(x, y, barW, h)}
                  className={cn(
                    'fill-[#6D5EF6] dark:fill-[#8B7CFF] transition-opacity',
                    hover !== null && hover !== i && 'opacity-45'
                  )}
                />
              )}
              {/* Full-height hit target so tiny bars stay hoverable */}
              <rect
                x={pad.left + i * step}
                y={pad.top}
                width={step}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {i % 6 === 0 && (
                <text
                  x={pad.left + i * step + step / 2}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-ink3 text-[10px]"
                >
                  {d.day.slice(5).replace('-', '/')}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-soft"
          style={{ left: `${((pad.left + hover * step + step / 2) / W) * 100}%` }}
        >
          <span className="font-semibold text-foreground">{fmtUsd(days[hover].cost)}</span>
          <span className="ml-2 text-muted-foreground">{days[hover].day}</span>
        </div>
      )}
      {allZero && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No spend recorded in the last 30 days.
        </p>
      )}
    </div>
  )
}

function BreakdownBars({
  rows,
}: {
  rows: { name: string; sub: string; cost: number }[]
}) {
  const max = Math.max(...rows.map((r) => r.cost), 0.0001)
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
  }
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-foreground">{r.name}</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{fmtUsd(r.cost)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-inset">
            <div
              className="h-full rounded-full bg-[#6D5EF6] dark:bg-[#8B7CFF]"
              style={{ width: `${Math.max(1.5, (r.cost / max) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink3">{r.sub}</p>
        </li>
      ))}
    </ul>
  )
}

function ProjectDetailPanel({ projectId }: { projectId: number }) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get(`/api/admin/costs/projects/${projectId}`)
      .then((res) => !cancelled && setDetail(res.data))
      .catch(() => !cancelled && setError('Could not load the cost detail for this render.'))
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (error) return <p className="px-4 py-3 text-sm text-warn">{error}</p>
  if (!detail)
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading ledger…
      </div>
    )

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex flex-wrap gap-2">
        {detail.by_service.map((s) => (
          <span
            key={s.service}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-inset px-3 py-1 text-xs text-foreground"
          >
            <span className="font-medium">{SERVICE_LABELS[s.service] ?? s.service}</span>
            <span className="text-ink3">
              {s.units} {s.unit}
            </span>
            <span className="font-semibold">{fmtUsd(s.cost_usd)}</span>
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-inset text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-semibold">When</th>
              <th className="px-3 py-2 font-semibold">Service</th>
              <th className="px-3 py-2 font-semibold">Step</th>
              <th className="px-3 py-2 font-semibold">Usage</th>
              <th className="px-3 py-2 text-right font-semibold">Cost</th>
            </tr>
          </thead>
          <tbody>
            {detail.events.map((e) => (
              <tr key={e.id} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{fmtWhen(e.created_at)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-foreground">{SERVICE_LABELS[e.service] ?? e.service}</td>
                <td className="px-3 py-2 capitalize text-foreground">{prettyLabel(e.label)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{usageText(e)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                  {fmtUsd(e.cost_usd)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-inset">
              <td colSpan={4} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total for this render
              </td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-foreground">
                {fmtUsd(detail.total_cost_usd)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function RatesEditor({
  rates,
  labels,
  defaults,
  onSaved,
}: {
  rates: Record<string, number>
  labels: Record<string, string>
  defaults: Record<string, number>
  onSaved: (rates: Record<string, number>) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, String(v)]))
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const payload: Record<string, number> = {}
      for (const [k, v] of Object.entries(values)) {
        const n = Number(v)
        if (!Number.isNaN(n) && n >= 0) payload[k] = n
      }
      const res = await api.put('/api/admin/costs/rates', payload)
      onSaved(res.data.rates)
      setValues(Object.fromEntries(Object.entries(res.data.rates as Record<string, number>).map(([k, v]) => [k, String(v)])))
      setMsg({ kind: 'success', text: 'Rates saved — they apply to new events only; history is never rewritten.' })
    } catch {
      setMsg({ kind: 'error', text: 'Could not save the rates.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {msg && (
        <div
          className={cn(
            'mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm',
            msg.kind === 'success' ? 'border-good/30 bg-good/10 text-good' : 'border-warn/30 bg-warn-soft text-warn'
          )}
        >
          {msg.kind === 'success' ? <Check className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(defaults).map((key) => (
          <div key={key}>
            <span className="mb-2 block text-[13px] font-semibold text-foreground">{labels[key] ?? key}</span>
            <input
              type="number"
              min={0}
              step="any"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
              value={values[key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
            <p className="mt-1.5 text-xs text-ink3">Default: ${defaults[key]}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save rates'}
        </button>
      </div>
    </div>
  )
}

export default function AdminCostsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<CostsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/costs')
      setData(res.data)
    } catch {
      setError('Could not load the cost report.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.is_admin) load()
  }, [user?.is_admin, load])

  if (user && !user.is_admin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-semibold text-foreground">Admins only</h1>
        <p className="text-sm text-muted-foreground">This page shows what renders cost in AI services and is restricted to administrators.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">AI Spend</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real money spent per render on OpenAI and Fal — recorded live as each render runs.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading || !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading cost report…
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Today" totals={data.totals.today} />
            <StatTile label="Last 7 days" totals={data.totals.last_7_days} />
            <StatTile label="Last 30 days" totals={data.totals.last_30_days} />
            <StatTile label="All time" totals={data.totals.all_time} />
          </div>

          <SectionCard icon={Coins} title="Daily spend" sub="Combined AI cost per day, last 30 days." delay={0.05}>
            <DailySpendChart daily={data.daily} />
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard icon={ReceiptText} title="By service" sub="Where the money goes." delay={0.08}>
              <BreakdownBars
                rows={data.by_service.map((s) => ({
                  name: SERVICE_LABELS[s.service] ?? s.service,
                  sub: `${s.events.toLocaleString()} calls · ${s.units.toLocaleString()} ${s.unit}`,
                  cost: s.cost_usd,
                }))}
              />
            </SectionCard>
            <SectionCard icon={ReceiptText} title="By template" sub="Which templates cost the most." delay={0.1}>
              <BreakdownBars
                rows={data.by_template.map((t) => ({
                  name: prettyTemplate(t.template_type),
                  sub:
                    `${t.renders.toLocaleString()} renders` +
                    (t.avg_per_render !== null ? ` · avg ${fmtUsd(t.avg_per_render)} each` : ''),
                  cost: t.cost_usd,
                }))}
              />
            </SectionCard>
          </div>

          <SectionCard
            icon={ReceiptText}
            title="Recent renders"
            sub="Newest first — open a row for its full ledger. Deleted projects keep their history."
            delay={0.12}
          >
            {data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No renders have recorded any spend yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-semibold">Project</th>
                      <th className="px-3 py-2 font-semibold">Template</th>
                      <th className="px-3 py-2 font-semibold">User</th>
                      <th className="px-3 py-2 text-right font-semibold">Events</th>
                      <th className="px-3 py-2 text-right font-semibold">Cost</th>
                      <th className="px-3 py-2 font-semibold">Last activity</th>
                      <th className="w-8 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((row) => {
                      const key = row.project_id ?? -1
                      const expandable = row.project_id !== null
                      const isOpen = expanded === key
                      return (
                        <FragmentRow
                          key={key}
                          row={row}
                          expandable={expandable}
                          isOpen={isOpen}
                          onToggle={() => setExpanded(isOpen ? null : key)}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={SlidersHorizontal}
            title="Unit rates"
            sub="What each unit costs you. Applied when an event is recorded — changing them never rewrites history."
            delay={0.15}
          >
            <RatesEditor
              rates={data.rates}
              labels={data.rate_labels}
              defaults={data.rate_defaults}
              onSaved={(rates) => setData((d) => (d ? { ...d, rates } : d))}
            />
          </SectionCard>
        </>
      )}
    </div>
  )
}

function FragmentRow({
  row,
  expandable,
  isOpen,
  onToggle,
}: {
  row: RecentRow
  expandable: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className={cn(
          'border-b border-border/60 transition-colors',
          expandable && 'cursor-pointer hover:bg-inset/60',
          isOpen && 'bg-inset/60'
        )}
        onClick={expandable ? onToggle : undefined}
      >
        <td className="max-w-[220px] truncate px-3 py-2.5 font-medium text-foreground">
          {row.project_id === null ? 'Unattributed (drafts & previews)' : row.title ?? `Project #${row.project_id}`}
          {row.project_deleted && (
            <span className="ml-2 rounded-full border border-border bg-inset px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              deleted
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{prettyTemplate(row.template_type)}</td>
        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{row.user?.name ?? '—'}</td>
        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.events}</td>
        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">{fmtUsd(row.cost_usd)}</td>
        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{fmtWhen(row.last_event_at)}</td>
        <td className="px-2 py-2.5 text-muted-foreground">
          {expandable && <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />}
        </td>
      </tr>
      {isOpen && row.project_id !== null && (
        <tr className="border-b border-border/60">
          <td colSpan={7} className="bg-inset/40 p-0">
            <ProjectDetailPanel projectId={row.project_id} />
          </td>
        </tr>
      )}
    </>
  )
}
