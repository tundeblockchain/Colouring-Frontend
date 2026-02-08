import { apiRequest } from './apiClient'

/**
 * Fetch subscription plans and credit packs with prices from Stripe (via backend).
 * Backend should return plans and creditPacks with Stripe price data (amount in cents, currency).
 *
 * Response shape:
 * - plans: [ { id, name, tagline, credits, moreFeatures, popular, prices: { month, year } } ]
 * - creditPacks: [ { id: 'starter'|'creator'|'pro', name?, description?, credits, price: { amount, currency }, originalPrice? } ]
 */
export const getSubscriptionPlans = async () => {
  const result = await apiRequest('/subscriptions/plans', { method: 'GET' })
  if (result.success && result.data) {
    const rawPacks = result.data.creditPacks ?? result.data.credit_packs
    return {
      success: true,
      plans: Array.isArray(result.data.plans) ? result.data.plans : [],
      creditPacks: Array.isArray(rawPacks) ? rawPacks : [],
    }
  }
  return {
    success: false,
    plans: [],
    creditPacks: [],
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
 * Create a Stripe Checkout session for a one-time credit pack purchase.
 * Backend should create a one-time payment session and add credits on success.
 *
 * @param {string} userId - Current user id
 * @param {{ packId: string }} options - packId: starter | creator | pro
 * @returns {{ success: boolean, url?: string, error?: string }}
 */
export const createCreditPackCheckout = async (userId, options) => {
  const { packId } = options
  if (!userId || !packId) {
    return { success: false, error: 'User and pack are required.' }
  }
  const result = await apiRequest('/subscriptions/credit-pack-checkout', {
    method: 'POST',
    userId,
    body: {
      packId: packId.toLowerCase(),
      successUrl: `${window.location.origin}/profile?credits=success`,
      cancelUrl: `${window.location.origin}/add-credits`,
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
 * Change plan for a user with an active subscription (prorated charge on saved payment method).
 * Use when subscriptionStatus is 'active' or 'trialing' and stripeSubscriptionId exists.
 *
 * @param {string} userId - Current user id
 * @param {{ plan: string, interval: 'month' | 'year' }} options
 * @returns {{ success: boolean, error?: string, status?: number, data?: object }}
 */
export const changePlan = async (userId, options) => {
  const { plan, interval } = options
  if (!userId || !plan) {
    return { success: false, error: 'User and plan are required.' }
  }
  const result = await apiRequest('/subscriptions/change-plan', {
    method: 'POST',
    userId,
    body: {
      plan: plan.toLowerCase(),
      interval: interval || 'month',
    },
  })
  if (result.success) {
    return { success: true }
  }
  return {
    success: false,
    error: result.data?.error || result.error || 'Change plan failed',
    status: result.status,
    data: result.data,
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
