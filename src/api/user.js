import { User } from '../models/user'
import { apiRequest } from './apiClient'

/**
 * Register a new user
 */
export const registerUser = async (userId, userData) => {
  const { email, displayName, avatarUrl, plan } = userData

  if (!email || !displayName) {
    return {
      success: false,
      error: 'Email and display name are required',
    }
  }

  const requestBody = {
    email,
    displayName,
  }

  if (avatarUrl) requestBody.avatarUrl = avatarUrl
  if (plan) requestBody.plan = plan

  const result = await apiRequest('/users/register', {
    method: 'POST',
    userId,
    body: requestBody,
  })

  if (result.success) {
    return {
      success: true,
      data: new User(result.data),
    }
  }

  return result
}

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  const result = await apiRequest(`/users/${userId}`, {
    method: 'GET',
    userId,
  })

  if (result.success) {
    return {
      success: true,
      data: new User(result.data),
    }
  }

  return result
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  const result = await apiRequest(`/users/${userId}`, {
    method: 'PATCH',
    userId,
    body: updates,
  })

  if (result.success) {
    return {
      success: true,
      data: new User(result.data),
    }
  }

  return result
}

/**
 * Deduct credits for generation
 */
export const deductCredits = async (userId, amount) => {
  if (!amount || amount <= 0) {
    return {
      success: false,
      error: 'Amount must be a positive number',
    }
  }

  const result = await apiRequest(`/users/${userId}/credits`, {
    method: 'POST',
    userId,
    body: { amount },
  })

  if (result.success) {
    return {
      success: true,
      creditsRemaining: result.data.creditsRemaining,
      creditsDeducted: result.data.creditsDeducted,
    }
  }

  return result
}
