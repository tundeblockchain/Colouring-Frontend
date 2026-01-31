/**
 * User model
 */
export class User {
  constructor(data) {
    this.id = data.id || ''
    this.email = data.email || ''
    this.displayName = data.displayName || ''
    this.avatarUrl = data.avatarUrl || null
    this.credits = data.credits || 0
    this.planCredits = data.planCredits ?? null // monthly allowance for plan
    this.creditsUsed = data.creditsUsed ?? null
    this.createdAt = data.createdAt || new Date().toISOString()
    this.plan = data.plan || 'free' // free, starter, hobby, artist, business
    this.subscriptionStatus = data.subscriptionStatus ?? null // active, canceled, past_due, etc.
    this.currentPeriodEnd = data.currentPeriodEnd ?? null // ISO date when current period ends
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd ?? false
  }
}
