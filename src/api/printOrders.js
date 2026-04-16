import { API_BASE_URL, getHeaders, handleResponse } from './apiClient'

/**
 * @param {string} idToken
 * @param {string} [userId] - sent as X-User-Id for legacy auth compatibility
 */
async function printApiRequest(endpoint, { method = 'GET', idToken, userId, body } = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const headers = {
    ...getHeaders(userId, {}, body),
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
  }
  const requestOptions = { method, headers }
  if (body !== undefined && body !== null) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  try {
    const response = await fetch(url, requestOptions)
    return await handleResponse(response)
  } catch (error) {
    if (error.status !== undefined) {
      return {
        success: false,
        error: error.message,
        status: error.status,
        data: error.data,
      }
    }
    return {
      success: false,
      error: error.message || 'Network error',
      status: 0,
      data: null,
    }
  }
}

function normalizePdfKeysPayload(raw) {
  const data = raw && typeof raw === 'object' && 'success' in raw && raw.data !== undefined ? raw.data : raw
  if (!data || typeof data !== 'object') return null
  const interiorPdfKey =
    data.interiorPdfKey ?? data.interior?.key ?? data.keys?.interiorPdfKey ?? data.keys?.interior
  const coverPdfKey = data.coverPdfKey ?? data.cover?.key ?? data.keys?.coverPdfKey ?? data.keys?.cover
  const interiorUploadUrl =
    data.interiorUploadUrl ?? data.interior?.uploadUrl ?? data.uploadUrls?.interior ?? data.interiorPutUrl
  const coverUploadUrl =
    data.coverUploadUrl ?? data.cover?.uploadUrl ?? data.uploadUrls?.cover ?? data.coverPutUrl
  const contentType =
    typeof data.contentType === 'string' && data.contentType.trim() ? data.contentType.trim() : 'application/pdf'
  return {
    interiorPdfKey,
    coverPdfKey,
    interiorUploadUrl,
    coverUploadUrl,
    contentType,
  }
}

/**
 * Presigned S3 PUT URLs for interior + cover PDFs (browser uploads directly to the print bucket).
 * POST /api/print-order/pdf-upload-url — body: { bookId }
 */
export async function requestPrintPdfUploadUrls(idToken, userId, bookId) {
  return printApiRequest('/print-order/pdf-upload-url', {
    method: 'POST',
    idToken,
    userId,
    body: { bookId },
  })
}

export async function putPdfToPresignedUrl(uploadUrl, blob, contentType = 'application/pdf') {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Upload failed (${res.status})`)
  }
}

/**
 * Resolve interior + cover S3 keys via presigned PUT (client uploads PDF blobs).
 */
export async function ensurePrintPdfKeys(idToken, userId, bookId, { coverBlob, interiorBlob }) {
  const urlsRes = await requestPrintPdfUploadUrls(idToken, userId, bookId)
  if (!urlsRes.success) {
    const hint =
      'Could not get print upload URLs. Expected POST /print-order/pdf-upload-url to return presigned PUT URLs.'
    const err = new Error(urlsRes.error || hint)
    err.status = urlsRes.status
    throw err
  }

  const n = normalizePdfKeysPayload(urlsRes)
  if (!n?.interiorPdfKey || !n?.coverPdfKey) {
    throw new Error('Print upload response missing interiorPdfKey or coverPdfKey')
  }
  if (n.interiorUploadUrl && n.coverUploadUrl) {
    const ct = n.contentType || 'application/pdf'
    await putPdfToPresignedUrl(n.interiorUploadUrl, interiorBlob, ct)
    await putPdfToPresignedUrl(n.coverUploadUrl, coverBlob, ct)
    return { interiorPdfKey: n.interiorPdfKey, coverPdfKey: n.coverPdfKey }
  }

  throw new Error(
    'Print PDF upload URLs were not returned. Expected interiorUploadUrl and coverUploadUrl alongside keys.',
  )
}

/**
 * Lulu cover dimensions for the single-page cover PDF (mirrors Lulu POST /cover-dimensions/).
 * POST /api/print-order/cover-dimensions
 * @param {object} body
 * @param {string} body.podPackageId
 * @param {string} body.bookOrientation
 * @param {number} body.pageCount - interior page count (>= 2)
 * @param {'pt'|'mm'|'inch'} [body.unit]
 */
export async function getPrintCoverDimensions(idToken, userId, body) {
  return printApiRequest('/print-order/cover-dimensions', {
    method: 'POST',
    idToken,
    userId,
    body,
  })
}

export async function getPrintQuote(idToken, userId, quoteBody) {
  return printApiRequest('/print-order/quote', {
    method: 'POST',
    idToken,
    userId,
    body: quoteBody,
  })
}

export async function createPrintCheckout(idToken, userId, checkoutBody) {
  return printApiRequest('/print-order/checkout', {
    method: 'POST',
    idToken,
    userId,
    body: checkoutBody,
  })
}

export async function listPrintOrders(idToken, userId, limit = 25) {
  const q = new URLSearchParams({ limit: String(Math.min(100, Math.max(1, limit))) })
  return printApiRequest(`/print-orders?${q}`, {
    method: 'GET',
    idToken,
    userId,
  })
}

export async function getPrintOrder(idToken, userId, orderId) {
  const enc = encodeURIComponent(orderId)
  return printApiRequest(`/print-orders/${enc}`, {
    method: 'GET',
    idToken,
    userId,
  })
}

export const PRINT_SHIPPING_LEVELS = [
  'MAIL',
  'PRIORITY_MAIL',
  'GROUND_HD',
  'GROUND_BUS',
  'GROUND',
  'EXPEDITED',
  'EXPRESS',
]
