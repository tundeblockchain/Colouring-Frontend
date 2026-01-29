/**
 * API Client utility for making authenticated requests
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Get headers for API requests
 */
export const getHeaders = (userId, additionalHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }

  if (userId) {
    headers['X-User-Id'] = userId
  }

  return headers
}

/**
 * Handle API response and errors
 */
export const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type')
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    if (!response.ok) {
      throw new Error(text || `HTTP error! status: ${response.status}`)
    }
    return { success: true, data: text }
  }

  let data
  try {
    data = await response.json()
  } catch (e) {
    // If response is not JSON, return text or empty object
    data = {}
  }

  if (!response.ok) {
    const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = data
    throw error
  }

  return { success: true, data }
}

/**
 * Make an API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { userId, method = 'GET', body, headers: customHeaders = {} } = options

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  const requestOptions = {
    method,
    headers: getHeaders(userId, customHeaders),
  }

  if (body) {
    requestOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, requestOptions)
    return await handleResponse(response)
  } catch (error) {
    // If error was thrown from handleResponse, it already has status and data
    if (error.status !== undefined) {
      return {
        success: false,
        error: error.message,
        status: error.status,
        data: error.data,
      }
    }
    // Network or other errors
    return {
      success: false,
      error: error.message || 'Network error',
      status: 0,
      data: null,
    }
  }
}

export { API_BASE_URL }
