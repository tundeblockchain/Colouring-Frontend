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
    this.createdAt = data.createdAt || new Date().toISOString()
    this.plan = data.plan || 'free' // free, artist, premium
  }
}
