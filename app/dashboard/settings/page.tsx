'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  Lock,
  Check,
  AlertCircle,
  Loader2,
  Plug,
  Palette,
  ExternalLink,
  Plus,
  Trash2,
  Star,
  KeyRound,
} from 'lucide-react'
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

type ApiKey = {
  id: number
  provider: string
  label: string | null
  credential_masked: string
  is_default: boolean
  is_active: boolean
  failure_count: number
  last_error: string | null
  last_error_at: string | null
  last_used_at: string | null
  last_success_at: string | null
}

type CredentialGroups = Record<string, ApiKey[]>

type YoutubeDownloaderState = {
  provider: string
  options: string[]
  rapidapi_configured: boolean
  apify_configured: boolean
  credentials: CredentialGroups
}

const PROVIDER_META: Record<string, { label: string; desc: string; keyNoun: string }> = {
  rapidapi: { label: 'RapidAPI', desc: 'youtube-info-download-api (poll-based download)', keyNoun: 'API key' },
  apify: { label: 'Apify', desc: 'truefetch/youtube-video-downloader actor', keyNoun: 'API token' },
}

function hasActiveKey(credentials: CredentialGroups | undefined, provider: string): boolean {
  return (credentials?.[provider] ?? []).some((k) => k.is_active)
}

function ProviderKeyManager({
  provider,
  keys,
  busy,
  setBusy,
  onCredentials,
  onError,
}: {
  provider: string
  keys: ApiKey[]
  busy: boolean
  setBusy: (b: boolean) => void
  onCredentials: (credentials: CredentialGroups, successText: string) => void
  onError: (text: string) => void
}) {
  const meta = PROVIDER_META[provider] ?? { label: provider, desc: '', keyNoun: 'API key' }
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const run = async (
    action: () => Promise<{ data: { credentials: CredentialGroups } }>,
    successText: string
  ): Promise<boolean> => {
    if (busy) return false
    setBusy(true)
    try {
      const res = await action()
      onCredentials(res.data.credentials, successText)
      return true
    } catch (err: any) {
      onError(err?.response?.data?.message ?? `Failed to update ${meta.label} keys.`)
      return false
    } finally {
      setBusy(false)
    }
  }

  const addKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim()) return
    const ok = await run(
      () => api.post('/api/admin/credentials', { provider, label: newLabel.trim() || null, credential: newKey.trim() }),
      `${meta.label} ${meta.keyNoun} added.`
    )
    if (ok) {
      setNewKey('')
      setNewLabel('')
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">{meta.label} keys</span>
        <span className="text-xs text-ink3">— tried in order, default first; on failure the next key is used automatically.</span>
      </div>

      {keys.length === 0 ? (
        <p className="mb-3 text-xs text-warn">No keys yet — this provider will fail until you add one.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className={cn(
                'rounded-lg border px-3 py-2.5',
                k.is_active ? 'border-border bg-card' : 'border-border bg-card opacity-55'
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-xs text-foreground">{k.credential_masked}</code>
                {k.label && <span className="text-xs text-ink3">{k.label}</span>}
                {k.is_default && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    <Star className="h-3 w-3" /> Default
                  </span>
                )}
                {!k.is_active && (
                  <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">Disabled</span>
                )}
                {k.failure_count > 0 && (
                  <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">
                    {k.failure_count} failure{k.failure_count > 1 ? 's' : ''}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1.5">
                  {!k.is_default && k.is_active && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(() => api.post(`/api/admin/credentials/${k.id}/default`), `Default ${meta.label} key updated.`)
                      }
                      className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/50 disabled:opacity-60"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => api.put(`/api/admin/credentials/${k.id}`, { is_active: !k.is_active }),
                        `${meta.label} key ${k.is_active ? 'disabled' : 'enabled'}.`
                      )
                    }
                    className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/50 disabled:opacity-60"
                  >
                    {k.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Delete this ${meta.label} ${meta.keyNoun}? This cannot be undone.`)) {
                        run(() => api.delete(`/api/admin/credentials/${k.id}`), `${meta.label} key deleted.`)
                      }
                    }}
                    className="rounded-lg border border-border p-1 text-warn transition-colors hover:border-warn/50 disabled:opacity-60"
                    aria-label="Delete key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              {k.last_error && (
                <p className="mt-1.5 text-[11px] text-warn">
                  Last error{k.last_error_at ? ` (${new Date(k.last_error_at).toLocaleString()})` : ''}: {k.last_error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addKey} className="flex flex-col gap-2 sm:flex-row">
        <input
          className={cn(inputCls, 'sm:w-40')}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (optional)"
          disabled={busy}
        />
        <input
          className={cn(inputCls, 'flex-1 font-mono')}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={`Paste a new ${meta.label} ${meta.keyNoun}`}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !newKey.trim()}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Add key
        </button>
      </form>
    </div>
  )
}

function AdminIntegrations() {
  const [state, setState] = useState<YoutubeDownloaderState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [keysBusy, setKeysBusy] = useState(false)
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

  const applyCredentials = (credentials: CredentialGroups, successText: string) => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            credentials,
            rapidapi_configured: hasActiveKey(credentials, 'rapidapi'),
            apify_configured: hasActiveKey(credentials, 'apify'),
          }
        : prev
    )
    setMsg({ kind: 'success', text: successText })
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
                    {configured
                      ? `${(state.credentials?.[opt] ?? []).filter((k) => k.is_active).length} active key(s)`
                      : 'No keys configured'}
                  </span>
                </button>
              )
            })}
          </div>

          {state.options.map((opt) => (
            <ProviderKeyManager
              key={opt}
              provider={opt}
              keys={state.credentials?.[opt] ?? []}
              busy={keysBusy}
              setBusy={setKeysBusy}
              onCredentials={applyCredentials}
              onError={(text) => setMsg({ kind: 'error', text })}
            />
          ))}

          <p className="mt-3 text-xs text-ink3">
            Both providers produce the same result. Keys are stored in the app database (not{' '}
            <code className="font-mono">.env</code>): the default key is used first and, if it fails, the
            remaining active keys are tried automatically. RapidAPI keys are also used for YouTube
            transcript fetching.
          </p>
        </div>
      )}
    </motion.section>
  )
}

type LandingState = {
  variant: string
  options: string[]
}

const LANDING_META: Record<string, { label: string; desc: string; swatch: string[] }> = {
  editorial: {
    label: 'Warm editorial',
    desc: 'Cream background, bold display type, orange accent. Matches the dashboard.',
    swatch: ['#FBFAF8', '#1A1916', '#E8492B'],
  },
  cinematic: {
    label: 'Bold cinematic',
    desc: 'Dark charcoal, neon-orange, product-forward and dramatic.',
    swatch: ['#0D0C0A', '#241722', '#FF5A38'],
  },
  minimal: {
    label: 'Minimal clean',
    desc: 'White, airy and restrained. A calm, modern SaaS look.',
    swatch: ['#FFFFFF', '#F4F4F5', '#18181B'],
  },
}

function AdminLanding() {
  const [state, setState] = useState<LandingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api
      .get('/api/admin/settings')
      .then((res) => setState(res.data.landing))
      .catch(() => setMsg({ kind: 'error', text: 'Failed to load landing settings.' }))
      .finally(() => setLoading(false))
  }, [])

  const selectVariant = async (variant: string) => {
    if (saving || state?.variant === variant) return
    setMsg(null)
    setSaving(variant)
    try {
      const res = await api.put('/api/admin/settings', { landing_variant: variant })
      setState(res.data.landing)
      setMsg({ kind: 'success', text: `Landing page set to “${LANDING_META[variant]?.label ?? variant}”.` })
    } catch {
      setMsg({ kind: 'error', text: 'Failed to update the landing page.' })
    } finally {
      setSaving(null)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-soft"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Landing page</h2>
            <p className="text-xs text-muted-foreground">Admin only — choose which design is served at the public homepage.</p>
          </div>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
        >
          View live <ExternalLink className="h-3.5 w-3.5" />
        </a>
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
          <span className="mb-2 block text-[13px] font-semibold text-foreground">Design variant</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {state.options.map((opt) => {
              const meta = LANDING_META[opt] ?? { label: opt, desc: '', swatch: ['#E9E6E0', '#E9E6E0', '#E9E6E0'] }
              const active = state.variant === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectVariant(opt)}
                  disabled={!!saving}
                  className={cn(
                    'relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors',
                    active ? 'border-primary bg-accent-soft' : 'border-border bg-card hover:border-primary/50',
                    saving && 'cursor-not-allowed opacity-70'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex gap-1">
                      {meta.swatch.map((c, i) => (
                        <span key={i} className="h-4 w-4 rounded-full border border-black/5" style={{ background: c }} />
                      ))}
                    </div>
                    {saving === opt ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : active ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  <span className="text-xs text-ink3">{meta.desc}</span>
                  {active && (
                    <span className="mt-0.5 inline-flex items-center rounded-full bg-good/10 px-2 py-0.5 text-[11px] font-medium text-good">
                      Live now
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-ink3">Changes go live immediately on the public homepage — refresh to see them.</p>
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

      {/* Admin-only settings */}
      {user?.is_admin && <AdminLanding />}
      {user?.is_admin && <AdminIntegrations />}
    </div>
  )
}
