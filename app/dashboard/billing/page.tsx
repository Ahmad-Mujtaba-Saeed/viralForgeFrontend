'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Zap, Loader2, Sparkles } from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import type { Plan } from '@/store/billingSlice'
import { cn } from '@/lib/utils'

const TIER_ORDER: Record<string, number> = { starter: 0, creator: 1, studio: 2 }

export default function BillingPage() {
  const {
    plans,
    credits,
    dailyCredits,
    hasSubscription,
    subscription,
    plan: currentPlan,
    isLoadingPlans,
    fetchBilling,
    fetchPlans,
    startCheckout,
    changePlan,
    cancelSubscription,
  } = useBilling()

  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [busyPlan, setBusyPlan] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBilling().catch(() => {})
    fetchPlans().catch(() => {})
  }, [fetchBilling, fetchPlans])

  const visiblePlans = useMemo(() => {
    return plans
      .filter((p) => p.interval === interval && p.is_active)
      .sort((a, b) => (TIER_ORDER[a.tier ?? ''] ?? 99) - (TIER_ORDER[b.tier ?? ''] ?? 99))
  }, [plans, interval])

  const handleSubscribe = async (p: Plan) => {
    setError(null)
    setBusyPlan(p.id)
    try {
      if (hasSubscription) {
        // Existing subscriber: switch the current subscription's plan in place
        // (a second checkout would create a duplicate subscription).
        await changePlan(p.id)
        await fetchBilling()
      } else {
        const res = await startCheckout(p.id)
        if (res?.checkoutUrl) {
          window.location.href = res.checkoutUrl
          return
        }
        setError('Could not start checkout. Please try again.')
      }
    } catch (e: any) {
      setError(typeof e === 'string' ? e : 'Could not complete that action.')
    } finally {
      setBusyPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription at the end of the current period?')) return
    setCancelling(true)
    try {
      await cancelSubscription()
      await fetchBilling()
    } catch {
      setError('Could not cancel subscription.')
    } finally {
      setCancelling(false)
    }
  }

  const monthlyEquivForYear = (yearly: number) => (yearly / 12).toFixed(2)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Status banner */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Billing & Credits</h1>
            <p className="mt-1 text-sm text-ink3">
              {hasSubscription
                ? `You're on the ${currentPlan?.name ?? 'current'} plan.`
                : 'Subscribe to unlock daily credits and start generating videos.'}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-accent-soft border border-accent-line px-5 py-3">
            <Zap className="h-6 w-6 text-accent fill-current" />
            <div>
              <div className="text-2xl font-bold text-accent leading-none">{credits.toLocaleString()}</div>
              <div className="text-xs text-ink3 mt-0.5">
                credits left{hasSubscription ? ` · ${dailyCredits.toLocaleString()}/day` : ''}
              </div>
            </div>
          </div>
        </div>
        {hasSubscription && !subscription?.cancel_at_period_end && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-4 text-sm text-warn hover:underline disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel subscription'}
          </button>
        )}
        {subscription?.cancel_at_period_end && (
          <p className="mt-4 text-sm text-warn">
            Your subscription is set to cancel at the end of the period.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {error}
        </div>
      )}

      {/* Interval toggle */}
      <div className="mb-8 flex items-center justify-center">
        <div className="inline-flex rounded-xl border border-border bg-inset p-1">
          {(['month', 'year'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setInterval(opt)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                interval === opt ? 'bg-card text-foreground shadow-soft' : 'text-ink3 hover:text-foreground'
              )}
            >
              {opt === 'month' ? 'Monthly' : 'Yearly'}
              {opt === 'year' && (
                <span className="ml-2 rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-bold text-good">
                  Save 25%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      {isLoadingPlans ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink3" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {visiblePlans.map((p) => {
            const isCurrent = hasSubscription && currentPlan?.id === p.id
            const price = Number(p.price)
            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 shadow-soft',
                  p.is_popular ? 'border-accent bg-card ring-2 ring-accent/30' : 'border-border bg-card'
                )}
              >
                {p.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {p.name.replace(/ \((Monthly|Yearly)\)$/, '')}
                  </h3>
                  <p className="mt-1 text-sm text-ink3">{p.subdesc}</p>
                </div>

                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">${price.toFixed(price % 1 ? 2 : 0)}</span>
                  <span className="text-ink3">/{interval === 'year' ? 'yr' : 'mo'}</span>
                </div>
                {interval === 'year' && (
                  <p className="-mt-3 mb-4 text-xs text-good">≈ ${monthlyEquivForYear(price)}/mo billed yearly</p>
                )}

                <div className="mb-5 flex items-center gap-2 rounded-xl bg-accent-soft border border-accent-line px-3 py-2 text-sm font-semibold text-accent">
                  <Zap className="h-4 w-4 fill-current" />
                  {p.daily_credits.toLocaleString()} credits / day
                </div>

                <ul className="mb-6 space-y-2.5">
                  {(p.features ?? []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-good" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(p)}
                  disabled={busyPlan === p.id || isCurrent}
                  className={cn(
                    'mt-auto flex h-11 items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-60',
                    isCurrent
                      ? 'bg-inset text-ink3 cursor-default'
                      : p.is_popular
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  )}
                >
                  {busyPlan === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent ? 'Current plan' : hasSubscription ? 'Switch to this plan' : 'Subscribe'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!isLoadingPlans && visiblePlans.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-ink3">
          <Sparkles className="h-6 w-6" />
          <p>No plans are available yet. Run the plan seeder to create them.</p>
        </div>
      )}
    </div>
  )
}
