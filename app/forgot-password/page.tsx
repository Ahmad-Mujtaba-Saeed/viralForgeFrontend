'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react'
import api from '@/lib/axios'
import { AuthShell, AuthAlert, AuthLabel, authInputClass, authButtonClass } from '@/components/auth/auth-shell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send you a link to reset it."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-good/10 text-good">
            <MailCheck className="h-6 w-6" />
          </div>
          <h3 className="text-[16px] font-semibold text-foreground">Check your inbox</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If an account exists for <span className="font-semibold text-foreground">{email}</span>, a password
            reset link is on its way.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <AuthAlert kind="error">{error}</AuthAlert>}
          <div>
            <AuthLabel htmlFor="email">Email</AuthLabel>
            <input
              id="email"
              type="email"
              className={authInputClass}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              autoComplete="email"
              required
            />
          </div>
          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
