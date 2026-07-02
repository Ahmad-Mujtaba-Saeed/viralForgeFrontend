'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AuthShell, AuthAlert, AuthLabel, authInputClass, authButtonClass } from '@/components/auth/auth-shell'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { login, isLoading, error, clearError, fetchCurrentUser, isAuthenticated } = useAuth()

  // Clear any stale error when landing on the page.
  useEffect(() => {
    clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A signed-in user has no business on the login page.
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const result = await login({ email, password })
    if (result.meta.requestStatus === 'fulfilled') {
      await fetchCurrentUser()
      router.push('/dashboard')
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep creating."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
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
              if (error) clearError()
            }}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <AuthLabel htmlFor="password">Password</AuthLabel>
            <Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className={authInputClass}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) clearError()
            }}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AuthShell>
  )
}
