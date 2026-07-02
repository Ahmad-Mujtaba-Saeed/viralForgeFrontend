'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useAuth } from '@/hooks/useAuth'
import { AuthShell, AuthAlert, AuthLabel, authInputClass, authButtonClass } from '@/components/auth/auth-shell'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState<string | undefined>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()
  const { register, isLoading, error, clearError, fetchCurrentUser, isAuthenticated } = useAuth()

  useEffect(() => {
    clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  const mismatch = !!confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (mismatch) return

    const result = await register({
      name,
      email,
      phone: phone || '',
      password,
      password_confirmation: confirmPassword,
    })

    if (result.meta.requestStatus === 'fulfilled') {
      await fetchCurrentUser()
      router.push('/dashboard')
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start free — make your first video in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthAlert kind="error">{error}</AuthAlert>}

        <div>
          <AuthLabel htmlFor="name">Full name</AuthLabel>
          <input
            id="name"
            type="text"
            className={authInputClass}
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) clearError()
            }}
            autoComplete="name"
            required
          />
        </div>

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
          <AuthLabel htmlFor="phone">Phone</AuthLabel>
          <PhoneInput
            international
            defaultCountry="US"
            value={phone}
            onChange={setPhone}
            placeholder="Enter your phone number"
            className="flex h-11 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-foreground transition-colors focus-within:border-primary [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-foreground [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-ink3"
          />
        </div>

        <div>
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <input
            id="password"
            type="password"
            className={authInputClass}
            placeholder="8–18 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) clearError()
            }}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <AuthLabel htmlFor="confirmPassword">Confirm password</AuthLabel>
          <input
            id="confirmPassword"
            type="password"
            className={authInputClass}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {mismatch && <p className="mt-1.5 text-xs text-destructive">Passwords do not match.</p>}
        </div>

        <button type="submit" disabled={isLoading || mismatch} className={authButtonClass}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthShell>
  )
}
