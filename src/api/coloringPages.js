import { ColoringPage } from '../models/coloringPage'
import { apiRequest } from './apiClient'

/**
 * Generate one or more coloring pages (up to 6).
 * All generated pages can be assigned to the same folder via folderId.
 * For type 'photo', pass imageFile (File) to upload an image; the backend generates based on it.
 *
 * @param {object} params - { userId, prompt, title, type, style, quality, dimensions, folderId, numImages (1-6), imageFile?: File, wordArtStyle?: string }
 * @returns {{ success: boolean, data?: { coloringPages: ColoringPage[], creditsRemaining?: number }, error?: string }}
 */
export const generateColoringPage = async (params) => {
  const { userId, prompt, title, type, style, quality, dimensions, folderId, numImages = 1, imageFile, wordArtStyle } = params

  const isPhoto = type === 'photo'
  const hasPrompt = prompt != null && String(prompt).trim().length > 0
  if (!isPhoto && !hasPrompt) {
    return {
      success: false,
      error: 'Prompt is required',
    }
  }
  if (isPhoto && !imageFile) {
    return {
      success: false,
      error: 'Please upload a photo',
    }
  }

  const count = Math.min(6, Math.max(1, parseInt(numImages, 10) || 1))
  const qualityValue = quality || style || 'fast'

  let body
  if (imageFile) {
    body = new FormData()
    body.append('image', imageFile)
    body.append('prompt', hasPrompt ? String(prompt).trim() : '')
    body.append('type', type || 'photo')
    body.append('size', dimensions || '2:3')
    body.append('dimensions', dimensions || '2:3')
    body.append('quality', qualityValue)
    body.append('style', qualityValue)
    body.append('numImages', String(count))
    if (title) body.append('title', title)
    if (folderId) body.append('folderId', folderId)
  } else {
    body = {
      prompt: prompt.trim(),
      type: type || 'text',
      size: dimensions || '2:3',
      dimensions: dimensions || '2:3',
      quality: qualityValue,
      style: qualityValue,
      numImages: count,
    }
    if (title) body.title = title
    if (folderId) body.folderId = folderId
    if (wordArtStyle) body.wordArtStyle = wordArtStyle
  }

  const result = await apiRequest('/coloring-pages/generate', {
    method: 'POST',
    userId,
    body,
  })

  if (result.success) {
    const rawPages = result.data?.coloringPages ?? result.data?.pages ?? (result.data?.id ? [result.data] : [])
    const coloringPages = Array.isArray(rawPages)
      ? rawPages.map((p) => new ColoringPage(p))
      : [new ColoringPage(result.data)]
    return {
      success: true,
      data: {
        coloringPages,
        creditsRemaining: result.data?.creditsRemaining,
      },
      creditsRemaining: result.data?.creditsRemaining,
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
 * Move coloring page to folder
 */
export const moveColoringPageToFolder = async (pageId, userId, folderId) => {
  const result = await apiRequest(`/coloring-pages/${pageId}`, {
    method: 'PATCH',
    userId,
    body: { folderId: folderId || null },
  })

  if (result.success) {
    return {
      success: true,
      data: result.data ? new ColoringPage(result.data) : { id: pageId, folderId },
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
