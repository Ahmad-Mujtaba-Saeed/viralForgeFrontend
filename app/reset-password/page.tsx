'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import api from '@/lib/axios'
import { AuthShell, AuthAlert, AuthLabel, authInputClass, authButtonClass } from '@/components/auth/auth-shell'

function ResetInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') || ''
  const email = params.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const invalidLink = !token || !email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirm,
      })
      setDone(true)
      setTimeout(() => router.push('/login'), 1600)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not reset your password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (invalidLink) {
    return (
      <div className="space-y-5">
        <AuthAlert kind="error">This reset link is invalid or incomplete. Please request a new one.</AuthAlert>
        <Link href="/forgot-password" className={authButtonClass}>
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-good/10 text-good">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-[16px] font-semibold text-foreground">Password reset</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">Redirecting you to sign in…</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Go to sign in now
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <AuthAlert kind="error">{error}</AuthAlert>}

      <div>
        <AuthLabel htmlFor="email">Email</AuthLabel>
        <input id="email" type="email" className={authInputClass} value={email} disabled readOnly />
      </div>

      <div>
        <AuthLabel htmlFor="password">New password</AuthLabel>
        <input
          id="password"
          type="password"
          className={authInputClass}
          placeholder="8–18 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(null)
          }}
          autoComplete="new-password"
          required
        />
      </div>

      <div>
        <AuthLabel htmlFor="confirm">Confirm new password</AuthLabel>
        <input
          id="confirm"
          type="password"
          className={authInputClass}
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className={authButtonClass}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Resetting…
          </>
        ) : (
          'Reset password'
        )}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you’ll remember."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      }
    >
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ResetInner />
      </Suspense>
    </AuthShell>
  )
}
