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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Explainer Video</h1>
          <p className="text-sm text-muted-foreground">
            Write a script. AI breaks it into scenes and picks layouts; you upload the visuals; it renders an edited video.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="GTA V vs GTA VI — Map Comparison"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Script</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            placeholder="Paste or write your script here. e.g. 'Today we compare the maps of GTA V and GTA VI...'"
            className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The AI will split this into scenes and decide where images vs. bullet points go.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Aspect ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Target length: {targetSeconds}s</label>
            <input
              type="range"
              min={20}
              max={180}
              step={10}
              value={targetSeconds}
              onChange={(e) => setTargetSeconds(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {submitting ? 'Analyzing...' : 'Generate Storyboard'}
        </button>
      </form>
    </div>
  )
}
