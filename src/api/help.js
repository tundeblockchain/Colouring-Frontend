import { apiRequest } from './apiClient'

/**
 * Send a help/support email to the team.
 * @param {string} userId - Current user ID (for auth and backend to look up email)
 * @param {{ subject: string, message: string }} payload - subject and message
 * @returns {Promise<{ success: boolean, error?: string, status?: number }>}
 */
export const sendHelpEmail = async (userId, { subject, message }) => {
  if (!subject?.trim() || !message?.trim()) {
    return { success: false, error: 'Subject and message are required.' }
  }
  return apiRequest('/help', {
    method: 'POST',
    userId,
    body: { subject: subject.trim(), message: message.trim() },
  })
}
