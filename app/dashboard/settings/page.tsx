'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User as UserIcon, Lock, Check, AlertCircle, Loader2, Plug } from 'lucide-react'
import { useAuth, useAppDispatch } from '@/hooks/useAuth'
import { updateProfile, changePassword } from '@/store/authSlice'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

const inputCls =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <span className="mb-2 block text-[13px] font-semibold text-foreground">{label}</span>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink3">{hint}</p>}
    </div>
  )
}

function Banner({ kind, text }: { kind: 'success' | 'error'; text: string }) {
  return (
    <div
      className={cn(
        'mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm',
        kind === 'success'
          ? 'border-good/30 bg-good/10 text-good'
          : 'border-warn/30 bg-warn-soft text-warn'
      )}
    >
      {kind === 'success' ? (
        <Check className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  )
}

type YoutubeDownloaderState = {
  provider: string
  options: string[]
  rapidapi_configured: boolean
  apify_configured: boolean
}

const PROVIDER_META: Record<string, { label: string; desc: string }> = {
  rapidapi: { label: 'RapidAPI', desc: 'youtube-info-download-api (poll-based download)' },
  apify: { label: 'Apify', desc: 'truefetch/youtube-video-downloader actor' },
}

function AdminIntegrations() {
  const [state, setState] = useState<YoutubeDownloaderState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api
      .get('/api/admin/settings')
      .then((res) => setState(res.data.youtube_downloader))
      .catch(() => setMsg({ kind: 'error', text: 'Failed to load integration settings.' }))
      .finally(() => setLoading(false))
  }, [])

  const selectProvider = async (provider: string) => {
    if (saving || state?.provider === provider) return
    setMsg(null)
    setSaving(provider)
    try {
      const res = await api.put('/api/admin/settings', {
        youtube_downloader_provider: provider,
      })
      setState(res.data.youtube_downloader)
      setMsg({ kind: 'success', text: `YouTube downloader switched to ${PROVIDER_META[provider]?.label ?? provider}.` })
    } catch {
      setMsg({ kind: 'error', text: 'Failed to update the downloader provider.' })
    } finally {
      setSaving(null)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-soft"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Integrations</h2>
          <p className="text-xs text-muted-foreground">
            Admin only — choose which service downloads YouTube videos for templates.
          </p>
        </div>
      </div>

      {msg && <Banner kind={msg.kind} text={msg.text} />}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-ink3">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !state ? (
        <p className="py-4 text-sm text-ink3">Settings unavailable.</p>
      ) : (
        <div>
          <span className="mb-2 block text-[13px] font-semibold text-foreground">YouTube downloader</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {state.options.map((opt) => {
              const meta = PROVIDER_META[opt] ?? { label: opt, desc: '' }
              const active = state.provider === opt
              const configured = opt === 'apify' ? state.apify_configured : state.rapidapi_configured
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectProvider(opt)}
                  disabled={!!saving}
                  className={cn(
                    'relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors',
                    active
                      ? 'border-primary bg-accent-soft'
                      : 'border-border bg-card hover:border-primary/50',
                    saving && 'cursor-not-allowed opacity-70'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                    {saving === opt ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : active ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </div>
                  <span className="text-xs text-ink3">{meta.desc}</span>
                  <span
                    className={cn(
                      'mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                      configured ? 'bg-good/10 text-good' : 'bg-warn-soft text-warn'
                    )}
                  >
                    {configured ? 'API key configured' : 'Not configured'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-ink3">
            Both providers produce the same result. If a provider shows “Not configured”, set its API key
            in the backend <code className="font-mono">.env</code> first.
          </p>
        </div>
      )}
    </motion.section>
  )
}

export default function SettingsPage() {
  const { user, fetchCurrentUser } = useAuth()
  const dispatch = useAppDispatch()

  // ---- profile form ----
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', bio: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  // ---- password form ----
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchCurrentUser().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        bio: user.bio ?? '',
      })
    }
  }, [user])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingProfile) return
    setProfileMsg(null)
    setSavingProfile(true)
    try {
      await dispatch(updateProfile(profile)).unwrap()
      setProfileMsg({ kind: 'success', text: 'Profile updated successfully.' })
    } catch (err: any) {
      setProfileMsg({ kind: 'error', text: typeof err === 'string' ? err : 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingPw) return
    setPwMsg(null)

    if (pw.password !== pw.password_confirmation) {
      setPwMsg({ kind: 'error', text: 'New password and confirmation do not match.' })
      return
    }
    if (pw.password.length < 8) {
      setPwMsg({ kind: 'error', text: 'New password must be at least 8 characters.' })
      return
    }

    setSavingPw(true)
    try {
      await dispatch(changePassword(pw)).unwrap()
      setPwMsg({ kind: 'success', text: 'Password updated successfully.' })
      setPw({ current_password: '', password: '', password_confirmation: '' })
    } catch (err: any) {
      setPwMsg({ kind: 'error', text: typeof err === 'string' ? err : 'Failed to change password.' })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details and password.</p>
      </div>

      {/* Profile */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-7 rounded-2xl border border-border bg-card p-6 shadow-soft"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Profile</h2>
            <p className="text-xs text-muted-foreground">Your public account information.</p>
          </div>
        </div>

        {profileMsg && <Banner kind={profileMsg.kind} text={profileMsg.text} />}

        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={inputCls}
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </Field>
          </div>
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Bio" hint="A short description shown on your profile (max 300 characters).">
            <textarea
              className={cn(inputCls, 'min-h-[90px] resize-y leading-relaxed')}
              value={profile.bio}
              maxLength={300}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us about yourself"
            />
          </Field>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.section>

      {/* Password */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-soft"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Password</h2>
            <p className="text-xs text-muted-foreground">Change your password using your current one.</p>
          </div>
        </div>

        {pwMsg && <Banner kind={pwMsg.kind} text={pwMsg.text} />}

        <form onSubmit={handlePasswordSave} className="space-y-5">
          <Field label="Current password">
            <input
              type="password"
              className={inputCls}
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="New password" hint="8–18 characters.">
              <input
                type="password"
                className={inputCls}
                value={pw.password}
                onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className={inputCls}
                value={pw.password_confirmation}
                onChange={(e) => setPw((p) => ({ ...p, password_confirmation: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </motion.section>

      {/* Integrations (admin only) */}
      {user?.is_admin && <AdminIntegrations />}
    </div>
  )
}
