import { ColoringPage } from '../models/coloringPage'
import { apiRequest } from './apiClient'

/**
 * Generate a coloring page
 */
export const generateColoringPage = async (params) => {
  const { userId, prompt, title, type, style, dimensions, folderId } = params

  if (!prompt || !prompt.trim()) {
    return {
      success: false,
      error: 'Prompt is required',
    }
  }

  const requestBody = {
    prompt: prompt.trim(),
  }

  if (title) requestBody.title = title
  if (type) requestBody.type = type
  if (style) requestBody.style = style
  if (dimensions) requestBody.dimensions = dimensions
  if (folderId) requestBody.folderId = folderId

  const result = await apiRequest('/coloring-pages/generate', {
    method: 'POST',
    userId,
    body: requestBody,
  })

  if (result.success) {
    return {
      success: true,
      data: new ColoringPage(result.data),
      creditsRemaining: result.data.creditsRemaining,
    }
  }

  return result
}

/**
 * Get user's coloring pages
 */
export const getUserColoringPages = async (userId, filters = {}) => {
  const queryParams = new URLSearchParams({ userId, ...filters }).toString()
  const endpoint = `/coloring-pages?${queryParams}`

  const result = await apiRequest(endpoint, {
    method: 'GET',
    userId,
  })

  if (result.success) {
    return {
      success: true,
      data: result.data.coloringPages?.map((page) => new ColoringPage(page)) || [],
      count: result.data.count || 0,
    }
  }

  return result
}

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (pageId, userId) => {
  const result = await apiRequest(`/coloring-pages/${pageId}/favorite`, {
    method: 'PATCH',
    userId,
  })

  if (result.success) {
    return {
      success: true,
      data: {
        id: result.data.id,
        isFavorite: result.data.isFavorite,
      },
    }
  }

  return result
}

/**
 * Delete coloring page
 */
export const deleteColoringPage = async (pageId, userId) => {
  const result = await apiRequest(`/coloring-pages/${pageId}`, {
    method: 'DELETE',
    userId,
  })

  return result
}
