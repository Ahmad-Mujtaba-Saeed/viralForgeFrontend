'use client'

import { AlertTriangle } from 'lucide-react'
import type { LintItem, LintReportData } from './types'

/**
 * Quality-gate report (§12): the storyboard lint, item by item.
 *
 * Informational only — it never blocks a render. The collapsing lives in the
 * inspector section that wraps this, so the list itself is plain.
 */
export function LintReport({ report }: { report?: LintReportData | null }) {
  if (!report || !report.items?.length) return null

  const chip = (n: number, tone: string, label: string) =>
    n > 0 ? (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
        {n} {label}
      </span>
    ) : null

  const toneFor = (s: LintItem['severity']) =>
    s === 'error' ? 'text-destructive' : s === 'warn' ? 'text-warn' : 'text-muted-foreground'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-warn" />
        {chip(report.counts.error, 'bg-destructive/10 text-destructive', 'error')}
        {chip(report.counts.warn, 'bg-warn/10 text-warn', 'warning')}
        {chip(report.counts.info, 'bg-inset text-muted-foreground', 'note')}
      </div>
      <ul className="space-y-1.5">
        {report.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 text-[10px] font-bold uppercase ${toneFor(item.severity)}`}>
              {item.severity}
            </span>
            <span className="text-foreground">
              {item.scene_id ? <span className="mr-1.5 font-mono text-[10px] text-ink3">{item.scene_id}</span> : null}
              {item.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
