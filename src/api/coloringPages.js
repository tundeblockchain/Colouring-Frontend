import { ColoringPage } from '../models/coloringPage'
import { apiRequest } from './apiClient'

/**
 * Get a presigned S3 upload URL for photo-based generation.
 * POST /api/coloring-pages/photo-upload-url
 *
 * @param {string} userId
 * @param {{ contentType?: string }} options - optional contentType e.g. "image/jpeg" or "image/png"
 * @returns {{ success: boolean, data?: { uploadUrl, bucket, key, contentType, expiresInSeconds }, error?: string }}
 */
export const getPhotoUploadUrl = async (userId, options = {}) => {
  const body = {}
  if (options.contentType) {
    body.contentType = options.contentType
  }
  const result = await apiRequest('/coloring-pages/photo-upload-url', {
    method: 'POST',
    userId,
    body: Object.keys(body).length ? body : undefined,
  })
  if (result.success && result.data) {
    return {
      success: true,
      data: {
        uploadUrl: result.data.uploadUrl,
        bucket: result.data.bucket,
        key: result.data.key,
        contentType: result.data.contentType || 'image/jpeg',
        expiresInSeconds: result.data.expiresInSeconds,
      },
    }
  }
  return {
    success: false,
    error: result.error || 'Failed to get upload URL',
    data: null,
  }
}

/**
 * Upload file to S3 using presigned URL. Do not add auth headers; Content-Type must match response.
 */
const uploadFileToPresignedUrl = async (uploadUrl, file, contentType) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Upload failed: ${response.status}`)
  }
}

/**
 * Generate one or more coloring pages (up to 6).
 * All generated pages can be assigned to the same folder via folderId.
 * For type 'photo': uploads image to S3 via presigned URL, then calls generate with S3 location (no file in generate request).
 *
 * @param {object} params - { userId, prompt, title, type, style, quality, dimensions, folderId, numImages (1-6), imageFile?: File, wordArtStyle?: string, titleForFrontCover?: string }
 * @returns {{ success: boolean, data?: { coloringPages: ColoringPage[], creditsRemaining?: number }, error?: string }}
 */
export const generateColoringPage = async (params) => {
  const { userId, prompt, title, type, style, quality, dimensions, folderId, numImages = 1, imageFile, wordArtStyle, titleForFrontCover } = params

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

  if (isPhoto && imageFile) {
    // Step 1: Get presigned upload URL
    const contentType = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const urlResult = await getPhotoUploadUrl(userId, { contentType })
    if (!urlResult.success || !urlResult.data) {
      return {
        success: false,
        error: urlResult.error || 'Failed to get upload URL',
      }
    }
    const { uploadUrl, bucket, key, contentType: resolvedContentType } = urlResult.data

    // Step 2: Upload file to S3 (no auth headers; Content-Type must match)
    try {
      await uploadFileToPresignedUrl(uploadUrl, imageFile, resolvedContentType)
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Upload failed',
      }
    }

    // Step 3: Call generate with S3 location (no image in body)
    body = {
      type: 'photo',
      photoS3Key: key,
      photoS3Bucket: bucket,
      dimensions: dimensions || '2:3',
      quality: qualityValue,
      numImages: count,
    }
    if (title) body.title = title
    if (folderId) body.folderId = folderId
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
    if (type === 'frontCover' && titleForFrontCover != null && String(titleForFrontCover).trim()) {
      body.titleForFrontCover = String(titleForFrontCover).trim()
    }
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
 * Get a single coloring page by ID (for polling async generation).
 * @returns {{ success: boolean, data?: ColoringPage, error?: string }}
 */
export const getColoringPage = async (userId, pageId) => {
  const result = await apiRequest(`/coloring-pages/${pageId}`, {
    method: 'GET',
    userId,
  })
  if (result.success && result.data) {
    const raw = result.data.coloringPage ?? result.data
    return {
      success: true,
      data: new ColoringPage(raw),
    }
  }
  return {
    success: false,
    error: result.error || 'Failed to fetch coloring page',
    data: null,
  }
}

/**
 * Poll a single coloring page until status is 'completed' or 'failed'.
 * @param {string} userId
 * @param {string} pageId
 * @param {{ intervalMs?: number, maxAttempts?: number }} options
 * @returns {Promise<ColoringPage>} resolves with completed page; rejects on failed or timeout
 */
export const pollColoringPageUntilComplete = async (userId, pageId, options = {}) => {
  const { intervalMs = 2000, maxAttempts = 60 } = options
  for (let i = 0; i < maxAttempts; i++) {
    const { success, data: page } = await getColoringPage(userId, pageId)
    if (!success || !page) {
      throw new Error('Failed to fetch page status')
    }
    if (page.status === 'completed') {
      return page
    }
    if (page.status === 'failed') {
      const err = new Error(page.errorMessage || 'Generation failed')
      err.page = page
      throw err
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Generation timed out')
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
