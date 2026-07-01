'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
import { Sparkles, Loader2 } from 'lucide-react'

const ASPECT_RATIOS = [
  { value: '16:9', label: 'Landscape 16:9' },
  { value: '9:16', label: 'Vertical 9:16' },
  { value: '1:1', label: 'Square 1:1' },
]

export default function ExplainerCreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [script, setScript] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [targetSeconds, setTargetSeconds] = useState(60)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (title.trim().length < 2 || script.trim().length < 10) {
      setError('Add a title and a script of at least a few sentences.')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/explainer/projects', {
        title: title.trim(),
        script: script.trim(),
        aspect_ratio: aspectRatio,
        target_seconds: targetSeconds,
      })
      const id = res.data?.data?.id
      router.push(`/dashboard/explainer/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">AI Explainer Video</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Write a script. AI breaks it into scenes and picks layouts; you upload visuals; it renders an edited video.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="GTA V vs GTA VI — Map Comparison"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-foreground">Script</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            placeholder="Paste or write your script here. e.g. 'Today we compare the maps of GTA V and GTA VI...'"
            className={`${inputCls} resize-y leading-relaxed`}
          />
          <p className="mt-1.5 text-xs text-ink3">
            The AI will split this into scenes and decide where images vs. bullet points go.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-foreground">Aspect ratio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={inputCls}>
              {ASPECT_RATIOS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-foreground">
              Target length: <span className="text-primary">{targetSeconds}s</span>
            </label>
            <input
              type="range"
              min={20}
              max={180}
              step={10}
              value={targetSeconds}
              onChange={(e) => setTargetSeconds(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-primary">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {submitting ? 'Analyzing…' : 'Generate Storyboard'}
        </button>
      </form>
    </div>
  )
}
