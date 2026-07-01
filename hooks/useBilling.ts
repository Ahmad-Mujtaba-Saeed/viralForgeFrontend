import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useAuth'
import {
  fetchBilling as fetchBillingThunk,
  fetchPlans as fetchPlansThunk,
  startCheckout as startCheckoutThunk,
  changePlan as changePlanThunk,
  cancelSubscription as cancelSubscriptionThunk,
} from '@/store/billingSlice'

export function useBilling() {
  const dispatch = useAppDispatch()
  const billing = useAppSelector((state) => state.billing)

  const fetchBilling = useCallback(
    async () => dispatch(fetchBillingThunk()).unwrap(),
    [dispatch]
  )

  const fetchPlans = useCallback(
    async () => dispatch(fetchPlansThunk()).unwrap(),
    [dispatch]
  )

  const startCheckout = useCallback(
    async (planId: number) => dispatch(startCheckoutThunk(planId)).unwrap(),
    [dispatch]
  )

  const changePlan = useCallback(
    async (planId: number) => dispatch(changePlanThunk(planId)).unwrap(),
    [dispatch]
  )

  const cancelSubscription = useCallback(
    async () => dispatch(cancelSubscriptionThunk()).unwrap(),
    [dispatch]
  )

  /** Credit cost for a template type (falls back to default). */
  const costFor = useCallback(
    (templateType: string) => billing.templateCosts[templateType] ?? billing.defaultCost,
    [billing.templateCosts, billing.defaultCost]
  )

  return {
    ...billing,
    fetchBilling,
    fetchPlans,
    startCheckout,
    changePlan,
    cancelSubscription,
    costFor,
  }
}
