import { Folder } from '../models/folder'
import { apiRequest } from './apiClient'

/**
 * Get user folders
 */
export const getUserFolders = async (userId) => {
  const queryParams = new URLSearchParams({ userId }).toString()
  const endpoint = `/folders?${queryParams}`

  const result = await apiRequest(endpoint, {
    method: 'GET',
    userId,
  })

  if (result.success) {
    return {
      success: true,
      data: result.data.folders?.map((folder) => new Folder(folder)) || [],
      count: result.data.count || 0,
    }
  }

  return result
}

/**
 * Get folder by id
 */
export const getFolder = async (userId, folderId) => {
  const result = await apiRequest(`/folders/${folderId}?userId=${userId}`, {
    method: 'GET',
    userId,
  })

  if (result.success) {
    return {
      success: true,
      data: new Folder(result.data),
    }
  }

  return result
}

/**
 * Update folder (rename)
 */
export const updateFolder = async (userId, folderId, folderData) => {
  const { name, color } = folderData || {}
  const requestBody = {}
  if (name !== undefined) requestBody.name = name.trim()
  if (color !== undefined) requestBody.color = color

  const result = await apiRequest(`/folders/${folderId}`, {
    method: 'PATCH',
    userId,
    body: requestBody,
  })

  if (result.success) {
    return {
      success: true,
      data: new Folder(result.data),
    }
  }

  return result
}

/**
 * Delete folder
 */
export const deleteFolder = async (userId, folderId) => {
  const result = await apiRequest(`/folders/${folderId}`, {
    method: 'DELETE',
    userId,
  })

  return result
}

/**
 * Set the order of coloring pages inside a folder.
 * PUT /api/folders/:folderId/page-order
 * @param {string} userId - Firebase user ID
 * @param {string} folderId - Folder ID
 * @param {string[]} pageIds - Array of coloring page IDs in desired order
 */
export const setFolderPageOrder = async (userId, folderId, pageIds) => {
  if (!folderId || !Array.isArray(pageIds)) {
    return { success: false, error: 'folderId and pageIds are required' }
  }
  const result = await apiRequest(`/folders/${folderId}/page-order`, {
    method: 'PUT',
    userId,
    body: { pageIds },
  })
  if (result.success && result.data) {
    return {
      success: true,
      data: result.data,
    }
  }
  return result
}

/**
 * Create folder
 */
export const createFolder = async (userId, folderData) => {
  const { name, color } = folderData

  if (!name || !name.trim()) {
    return {
      success: false,
      error: 'Folder name is required',
    }
  }

  const requestBody = {
    name: name.trim(),
  }

  if (color) requestBody.color = color

  const result = await apiRequest('/folders', {
    method: 'POST',
    userId,
    body: requestBody,
  })

  if (result.success) {
    return {
      success: true,
      data: new Folder(result.data),
    }
  }

  return result
}
