import { apiRequest } from './apiClient'

/**
 * Fetch subscription plans with prices from Stripe (via backend).
 * Backend should return plans with Stripe price data (amount in cents, currency).
 *
 * Response shape: { plans: [ { id, name, tagline, credits, moreFeatures (string[]), popular, prices: { month: { amount, currency }, year: { amount, currency } } } ] }
 */
export const getSubscriptionPlans = async () => {
  const result = await apiRequest('/subscriptions/plans', { method: 'GET' })
  if (result.success && Array.isArray(result.data?.plans)) {
    return { success: true, plans: result.data.plans }
  }
  return {
    success: false,
    plans: [],
    error: result.data?.error || result.error || 'Failed to fetch plans',
  }
}

/**
 * Create a Stripe Checkout session for subscription.
 * Backend should create the session with subscription metadata:
 * - userId: app user id (from X-User-Id or request)
 * - plan: starter | hobby | artist | business
 * so the webhook can link the subscription to the user and set plan/credits.
 *
 * @param {string} userId - Current user id
 * @param {{ plan: string, interval: 'month' | 'year' }} options
 * @returns {{ success: boolean, url?: string, error?: string }}
 */
export const createCheckoutSession = async (userId, options) => {
  const { plan, interval } = options
  if (!userId || !plan) {
    return { success: false, error: 'User and plan are required.' }
  }
  const result = await apiRequest('/subscriptions/checkout', {
    method: 'POST',
    userId,
    body: {
      plan: plan.toLowerCase(),
      interval: interval || 'month',
      successUrl: `${window.location.origin}/profile?subscription=success`,
      cancelUrl: `${window.location.origin}/choose-plan`,
    },
  })
  if (result.success && result.data?.url) {
    return { success: true, url: result.data.url }
  }
  return {
    success: false,
    error: result.data?.error || result.error || 'Failed to create checkout session',
  }
}

/**
 * Cancel the current user's subscription at period end.
 * Backend should call Stripe to set cancel_at_period_end.
 *
 * @param {string} userId - Current user id
 * @returns {{ success: boolean, error?: string }}
 */
export const cancelSubscription = async (userId) => {
  if (!userId) {
    return { success: false, error: 'User is required.' }
  }
  const result = await apiRequest('/subscriptions/cancel', {
    method: 'POST',
    userId,
  })
  if (result.success) {
    return { success: true }
  }
  return {
    success: false,
    error: result.data?.error || result.error || 'Failed to cancel subscription',
  }
}
