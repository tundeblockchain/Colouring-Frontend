import { apiRequest } from './apiClient'

/**
 * Ask the backend to improve a prompt for better coloring page generation.
 *
 * @param {string} userId - Current user id (sent as X-User-Id)
 * @param {{ prompt: string }} params
 * @returns {{ success: boolean, data?: { improvedPrompt: string }, error?: string }}
 */
export const improvePrompt = async (userId, { prompt }) => {
  if (!userId || !prompt || !String(prompt).trim()) {
    return { success: false, error: 'Prompt is required' }
  }
  const result = await apiRequest('/prompts/improve', {
    method: 'POST',
    userId,
    body: { prompt: String(prompt).trim() },
  })
  if (result.success && result.data) {
    const improvedPrompt = result.data.improvedPrompt ?? result.data.prompt ?? ''
    return {
      success: true,
      data: { improvedPrompt },
    }
  }
  return {
    success: false,
    error: result.error || 'Failed to improve prompt',
  }
}
