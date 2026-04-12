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
  return {
    interiorPdfKey,
    coverPdfKey,
    interiorUploadUrl,
    coverUploadUrl,
  }
}

/**
 * Optional: server generates PDFs from folder page order. Not in the public guide — backend may implement.
 */
export async function prepareFolderPrintPdfs(idToken, userId, { bookId, pageIdsInOrder }) {
  return printApiRequest('/print-order/prepare-pdfs', {
    method: 'POST',
    idToken,
    userId,
    body: { bookId, pageIdsInOrder },
  })
}

/**
 * Optional: presigned PUT URLs for client-uploaded print PDFs. Not in the public guide — backend may implement.
 */
export async function requestPrintPdfUploadUrls(idToken, userId, bookId) {
  return printApiRequest('/print-order/pdf-upload-urls', {
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
      'Could not get print upload URLs. Implement POST /print-order/pdf-upload-urls (presigned PUT) ' +
      'or POST /print-order/prepare-pdfs so PDFs exist in the print bucket before checkout.'
    const err = new Error(urlsRes.error || hint)
    err.status = urlsRes.status
    throw err
  }

  const n = normalizePdfKeysPayload(urlsRes)
  if (!n?.interiorPdfKey || !n?.coverPdfKey) {
    throw new Error('Print upload response missing interiorPdfKey or coverPdfKey')
  }
  if (n.interiorUploadUrl && n.coverUploadUrl) {
    await putPdfToPresignedUrl(n.interiorUploadUrl, interiorBlob)
    await putPdfToPresignedUrl(n.coverUploadUrl, coverBlob)
    return { interiorPdfKey: n.interiorPdfKey, coverPdfKey: n.coverPdfKey }
  }

  throw new Error(
    'Print PDF upload URLs were not returned. Expected interiorUploadUrl and coverUploadUrl alongside keys.',
  )
}

/**
 * Try server-side prepare (page order), then fall back to presigned client upload.
 */
export async function ensurePrintPdfKeysWithOrder(
  idToken,
  userId,
  bookId,
  pageIdsInOrder,
  { coverBlob, interiorBlob },
) {
  if (pageIdsInOrder?.length >= 3) {
    const prep = await prepareFolderPrintPdfs(idToken, userId, { bookId, pageIdsInOrder })
    if (prep.success) {
      const n = normalizePdfKeysPayload(prep)
      if (n?.interiorPdfKey && n?.coverPdfKey && !n.interiorUploadUrl && !n.coverUploadUrl) {
        return { interiorPdfKey: n.interiorPdfKey, coverPdfKey: n.coverPdfKey }
      }
    }
  }
  return ensurePrintPdfKeys(idToken, userId, bookId, { coverBlob, interiorBlob })
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
