import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/axios'

export interface Plan {
  id: number
  name: string
  price: string | number
  daily_credits: number
  tier: string | null
  is_popular: boolean
  currency: string
  interval: string // 'month' | 'year'
  interval_count: number
  subdesc?: string | null
  features?: string[] | null
  stripe_price_id?: string | null
  is_active: boolean
}

export interface BillingSubscription {
  id: number
  name: string
  status: string
  type_id: number
  ends_at?: string | null
  starts_at?: string | null
  cancel_at_period_end?: boolean
  plan?: Plan | null
}

interface BillingState {
  hasSubscription: boolean
  credits: number
  dailyCredits: number
  creditsRefreshedOn: string | null
  subscription: BillingSubscription | null
  plan: Plan | null
  templateCosts: Record<string, number>
  defaultCost: number
  plans: Plan[]
  isLoading: boolean
  isLoadingPlans: boolean
  isCheckingOut: boolean
  error: string | null
}

const initialState: BillingState = {
  hasSubscription: false,
  credits: 0,
  dailyCredits: 0,
  creditsRefreshedOn: null,
  subscription: null,
  plan: null,
  templateCosts: {},
  defaultCost: 3,
  plans: [],
  isLoading: false,
  isLoadingPlans: false,
  isCheckingOut: false,
  error: null,
}

export const fetchBilling = createAsyncThunk(
  'billing/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/billing/me')
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load billing')
    }
  }
)

export const fetchPlans = createAsyncThunk(
  'billing/plans',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/billing/plans')
      return res.data as Plan[]
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load plans')
    }
  }
)

export const startCheckout = createAsyncThunk(
  'billing/checkout',
  async (planId: number, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/billing/stripe/create-subscription-session/${planId}`)
      return res.data as { checkoutUrl: string; sessionId: string }
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error || e.response?.data?.message || 'Failed to start checkout')
    }
  }
)

export const changePlan = createAsyncThunk(
  'billing/changePlan',
  async (planId: number, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/billing/subscription/change-plan/${planId}`)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to change plan')
    }
  }
)

export const cancelSubscription = createAsyncThunk(
  'billing/cancel',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/billing/subscription/cancel')
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Failed to cancel subscription')
    }
  }
)

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setCredits(state, action) {
      state.credits = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBilling.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchBilling.fulfilled, (state, action) => {
        state.isLoading = false
        state.hasSubscription = !!action.payload.has_subscription
        state.credits = action.payload.credits ?? 0
        state.dailyCredits = action.payload.daily_credits ?? 0
        state.creditsRefreshedOn = action.payload.credits_refreshed_on ?? null
        state.subscription = action.payload.subscription ?? null
        state.plan = action.payload.plan ?? null
        state.templateCosts = action.payload.template_costs ?? {}
        state.defaultCost = action.payload.default_cost ?? 3
      })
      .addCase(fetchBilling.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchPlans.pending, (state) => {
        state.isLoadingPlans = true
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoadingPlans = false
        state.plans = action.payload
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoadingPlans = false
        state.error = action.payload as string
      })
      .addCase(startCheckout.pending, (state) => {
        state.isCheckingOut = true
      })
      .addCase(startCheckout.fulfilled, (state) => {
        state.isCheckingOut = false
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.isCheckingOut = false
        state.error = action.payload as string
      })
  },
})

export const { setCredits } = billingSlice.actions
export default billingSlice.reducer
