/**
 * User model
 */
export class User {
  constructor(data) {
    this.id = data.id || ''
    this.email = data.email || ''
    this.displayName = data.displayName || ''
    this.avatarUrl = data.avatarUrl || null
    this.credits = data.credits || 0 // credits remaining (from backend)
    this.creditsAllowance = data.creditsAllowance ?? data.credits_allowance ?? null // plan credit allowance from API
    this.planCredits = data.planCredits ?? null // deprecated: use creditsAllowance
    this.creditsUsedTotal = data.creditsUsedTotal ?? data.credits_used_total ?? null // total credits used from API
    this.creditsUsed = data.creditsUsed ?? null // deprecated: use creditsUsedTotal
    this.purchasedCredits = data.purchasedCredits ?? 0 // one-time purchased credits
    this.rolloverCredits = data.rolloverCredits ?? 0 // unused credits rolled over
    this.createdAt = data.createdAt || new Date().toISOString()
    this.plan = data.plan || 'free' // free, starter, hobby, artist, business
    this.subscriptionStatus = data.subscriptionStatus ?? null // active, canceled, past_due, trialing, etc.
    this.stripeSubscriptionId = data.stripeSubscriptionId ?? data.stripe_subscription_id ?? null
    this.currentPeriodEnd = data.currentPeriodEnd ?? null // ISO date when current period ends
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd ?? false
  }
}
