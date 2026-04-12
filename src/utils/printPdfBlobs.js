import { jsPDF } from 'jspdf'
import { API_BASE_URL } from '../api/apiClient'

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    img.onerror = reject
    img.src = dataUrl
  })
}

function imageFormatFromBlob(blob) {
  const t = (blob.type || '').toLowerCase()
  if (t.includes('jpeg') || t.includes('jpg')) return 'JPEG'
  if (t.includes('webp')) return 'WEBP'
  return 'PNG'
}

async function fetchColoringImageBlob({ url, id, userId }) {
  const fetchUrl = id && userId ? `${API_BASE_URL}/coloring-pages/${id}/image` : url
  const headers = {}
  if (id && userId) {
    headers['X-User-Id'] = userId
    headers['Accept'] = 'image/png, image/jpeg'
  }
  const response = await fetch(fetchUrl, { headers: Object.keys(headers).length ? headers : undefined })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to load image (${response.status})`)
  }
  return response.blob()
}

/**
 * Build a multi-page PDF blob from coloring pages (same fetch rules as gallery downloads).
 * @param {Array<{ url?: string, id?: string, title?: string }>} items - in order
 * @param {string | null} userId
 * @param {{ onProgress?: (n: number) => void }} [options]
 * @returns {Promise<Blob>}
 */
function yieldToMain() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

async function fetchBlobsInParallelBatches(items, userId, batchSize = 8) {
  const blobs = []
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize)
    const part = await Promise.all(
      slice.map((item) => fetchColoringImageBlob({ url: item.url, id: item.id, userId })),
    )
    blobs.push(...part)
    await yieldToMain()
  }
  return blobs
}

export async function buildImagesPdfBlob(items, userId = null, options = {}) {
  if (!items?.length) {
    throw new Error('No images to include in the PDF')
  }
  const { onProgress } = options
  const total = items.length

  onProgress?.(0)
  const blobs = await fetchBlobsInParallelBatches(items, userId, 8)
  onProgress?.(15)

  let pdf = null
  for (let i = 0; i < items.length; i++) {
    const blob = blobs[i]
    const dataUrl = await blobToDataUrl(blob)
    const img = await loadImageSize(dataUrl)
    const fmt = imageFormatFromBlob(blob)
    if (!pdf) {
      pdf = new jsPDF({
        orientation: img.width >= img.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })
    } else {
      pdf.addPage()
    }
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgAspect = img.width / img.height
    const pageAspect = pageW / pageH
    let w
    let h
    if (imgAspect > pageAspect) {
      w = pageW
      h = pageW / imgAspect
    } else {
      h = pageH
      w = pageH * imgAspect
    }
    const x = (pageW - w) / 2
    const y = (pageH - h) / 2
    pdf.addImage(dataUrl, fmt, x, y, w, h)
    const pct = 15 + Math.round(((i + 1) / total) * 85)
    onProgress?.(pct)
    await yieldToMain()
  }
  onProgress?.(100)
  await yieldToMain()
  const out = pdf.output('blob')
  return out instanceof Blob ? out : new Blob([out], { type: 'application/pdf' })
}

/**
 * Cover = first image only; interior = remaining images (Lulu-style split).
 * @returns {{ coverBlob: Blob, interiorBlob: Blob, interiorPageCount: number }}
 */
export async function buildCoverAndInteriorPdfBlobs(orderedItems, userId = null, options = {}) {
  if (!orderedItems?.length) {
    throw new Error('No pages to print')
  }
  const coverItem = orderedItems[0]
  const interiorItems = orderedItems.slice(1)
  if (interiorItems.length < 2) {
    throw new Error(
      'Physical books need at least three pages: one cover and two interior pages. Add more pages to this book or folder.',
    )
  }
  const coverBlob = await buildImagesPdfBlob([coverItem], userId, options)
  const interiorBlob = await buildImagesPdfBlob(interiorItems, userId, options)
  return {
    coverBlob,
    interiorBlob,
    interiorPageCount: interiorItems.length,
  }
}
