import { ColoringPage } from '../models/coloringPage'
import { apiRequest } from './apiClient'

/**
 * List prompt style presets (no auth).
 * GET /api/prompt-style-presets
 * @returns {{ success: boolean, data?: { presets: Array<{ id: string, name: string, sortOrder?: number }> }, error?: string }}
 */
export const getPromptStylePresets = async () => {
  const result = await apiRequest('/prompt-style-presets', {
    method: 'GET',
  })
  if (result.success) {
    return {
      success: true,
      data: {
        presets: Array.isArray(result.data?.presets) ? result.data.presets : [],
      },
    }
  }
  return {
    success: false,
    error: result.error || 'Failed to load style presets',
    data: { presets: [] },
  }
}

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
 * Generate one or more coloring pages (up to 10).
 * All generated pages can be assigned to the same folder via folderId.
 * For type 'photo': uploads image to S3 via presigned URL, then calls generate with S3 location (no file in generate request).
 *
 * @param {object} params - { userId, prompt, title, type, style, quality, dimensions, folderId, numImages (1-10), imageFile?: File, wordArtStyle?: string, titleForFrontCover?: string }
 * @returns {{ success: boolean, data?: { coloringPages: ColoringPage[], creditsRemaining?: number }, error?: string }}
 */
export const generateColoringPage = async (params) => {
  const {
    userId,
    prompt,
    title,
    type,
    style,
    quality,
    dimensions,
    folderId,
    numImages = 1,
    imageFile,
    wordArtStyle,
    titleForFrontCover,
    promptStyleId,
  } = params

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

  const count = Math.min(10, Math.max(1, parseInt(numImages, 10) || 1))
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
    const trimmedStyle = promptStyleId != null ? String(promptStyleId).trim() : ''
    if (trimmedStyle) {
      body.promptStyleId = trimmedStyle
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
 * Generate a full coloring book in one request.
 * Backend endpoint: POST /coloring-pages/generate-book
 *
 * The backend is responsible for:
 * - Expanding the base prompt into multiple, varied prompts
 * - Creating a folder (using the provided title as the folder name)
 * - Generating one coloring page per prompt and assigning them to the folder
 * - Charging credits based on total number of generated pages
 *
 * @param {object} params - { userId, title, prompt, quality, dimensions, numPages }
 * @returns {{ success: boolean, data?: { coloringPages: ColoringPage[], folder?: object, creditsRemaining?: number }, error?: string }}
 */
export const generateColoringBook = async (params) => {
  const { userId, title, prompt, quality, dimensions, numPages, promptStyleId } = params

  if (!userId) {
    return { success: false, error: 'User is required' }
  }
  if (!title || !String(title).trim()) {
    return { success: false, error: 'Book title is required' }
  }
  if (!prompt || !String(prompt).trim()) {
    return { success: false, error: 'Prompt is required' }
  }

  const count = Math.min(50, Math.max(1, parseInt(numPages ?? params.numImages ?? 1, 10) || 1))
  const qualityValue = quality || 'fast'
  const size = dimensions || '2:3'

  const body = {
    title: String(title).trim(),
    basePrompt: String(prompt).trim(),
    numPages: count,
    quality: qualityValue,
    dimensions: size,
  }
  const trimmedBookStyle = promptStyleId != null ? String(promptStyleId).trim() : ''
  if (trimmedBookStyle) {
    body.promptStyleId = trimmedBookStyle
  }

  const result = await apiRequest('/coloring-pages/generate-book', {
    method: 'POST',
    userId,
    body,
  })

  if (result.success) {
    const rawPages = result.data?.coloringPages ?? result.data?.pages ?? []
    const coloringPages = Array.isArray(rawPages)
      ? rawPages.map((p) => new ColoringPage(p))
      : []
    return {
      success: true,
      data: {
        coloringPages,
        folder: result.data?.folder ?? result.data?.bookFolder ?? null,
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
 * Load status for many coloring page IDs in one request (max 50 per call; longer lists are chunked).
 * POST /api/coloring-pages/batch-status
 *
 * @param {string} userId
 * @param {string[]} ids
 * @returns {{ success: boolean, data?: { pages: ColoringPage[], missingIds: string[] }, error?: string }}
 */
export const getColoringPagesBatchStatus = async (userId, ids) => {
  const unique = [...new Set((ids || []).filter(Boolean))]
  if (!unique.length) {
    return {
      success: false,
      error: 'No page ids provided',
      data: null,
    }
  }

  const allRawPages = []
  const allMissingIds = []

  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50)
    const result = await apiRequest('/coloring-pages/batch-status', {
      method: 'POST',
      userId,
      body: { ids: chunk },
    })
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch batch status',
        status: result.status,
        data: null,
      }
    }
    const pages = result.data?.pages ?? []
    const missingIds = result.data?.missingIds ?? []
    allRawPages.push(...pages)
    allMissingIds.push(...missingIds)
  }

  return {
    success: true,
    data: {
      pages: allRawPages.map((raw) => new ColoringPage(raw)),
      missingIds: allMissingIds,
    },
  }
}

/**
 * Poll batch status until every page is completed or failed, or until timeout.
 * Uses POST /coloring-pages/batch-status instead of GET per id (avoids throttling).
 *
 * @param {string} userId
 * @param {ColoringPage[]} initialPages - pages from generate (must include id); order preserved in result
 * @param {{ intervalMs?: number, maxAttempts?: number, onUpdate?: (pages: ColoringPage[]) => void, onDone?: () => void, signal?: AbortSignal }} options
 * @returns {Promise<ColoringPage[]>} same order as initialPages
 */
export const pollColoringPagesBatch = async (userId, initialPages, options = {}) => {
  /** Default ~15m window: 180 attempts × 5s between polls */
  const { intervalMs = 5000, maxAttempts = 180, onUpdate, onDone, signal } = options
  const idOrder = initialPages.map((p) => p.id).filter(Boolean)
  if (!idOrder.length) {
    return []
  }

  /** @type {Map<string, ColoringPage>} */
  const byId = new Map(
    initialPages.filter((p) => p.id).map((p) => [p.id, new ColoringPage(p)])
  )

  const emit = () => {
    if (signal?.aborted) return
    const ordered = idOrder.map((id) => byId.get(id)).filter(Boolean)
    onUpdate?.(ordered)
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      return idOrder.map((id) => byId.get(id)).filter(Boolean)
    }
    const result = await getColoringPagesBatchStatus(userId, idOrder)
    if (result.success && result.data) {
      for (const page of result.data.pages) {
        if (page?.id) {
          byId.set(page.id, page)
        }
      }
      emit()

      const allTerminal = idOrder.every((id) => {
        const p = byId.get(id)
        return p && (p.status === 'completed' || p.status === 'failed')
      })
      if (allTerminal) {
        if (!signal?.aborted) {
          onDone?.()
        }
        return idOrder.map((id) => byId.get(id)).filter(Boolean)
      }
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }

  for (const id of idOrder) {
    const p = byId.get(id)
    if (p && p.status !== 'completed' && p.status !== 'failed') {
      byId.set(
        id,
        new ColoringPage({
          ...Object.assign({}, p),
          status: 'failed',
          errorMessage: 'Generation timed out',
        })
      )
    }
  }
  emit()
  if (!signal?.aborted) {
    onDone?.()
  }
  return idOrder.map((id) => byId.get(id)).filter(Boolean)
}

/**
 * Poll a single coloring page until status is 'completed' or 'failed'.
 * @param {string} userId
 * @param {string} pageId
 * @param {{ intervalMs?: number, maxAttempts?: number }} options — defaults match batch poll (~15m, 5s interval)
 * @returns {Promise<ColoringPage>} resolves with completed page; rejects on failed or timeout
 */
export const pollColoringPageUntilComplete = async (userId, pageId, options = {}) => {
  const rows = await pollColoringPagesBatch(
    userId,
    [new ColoringPage({ id: pageId, status: 'processing' })],
    options
  )
  const page = rows[0]
  if (!page) {
    throw new Error('Failed to fetch page status')
  }
  if (page.status === 'failed') {
    const err = new Error(page.errorMessage || 'Generation failed')
    err.page = page
    throw err
  }
  return page
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
