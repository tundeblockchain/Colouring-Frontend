import { downloadZip } from 'client-zip'
import { jsPDF } from 'jspdf'
import { trackDownload } from './analytics'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Print one or more coloring images (same fetch rules as downloadImage).
 * @param {Array<{ url: string, title?: string, id?: string }>} items
 * @param {string | null} [userId]
 */
export const printColoringPages = async (items, userId = null) => {
  if (!items?.length) return
  const blobs = []
  for (const item of items) {
    const { url, id } = item
    const fetchUrl = id && userId
      ? `${API_BASE_URL}/coloring-pages/${id}/image`
      : url
    const headers = {}
    if (id && userId) {
      headers['X-User-Id'] = userId
      headers['Accept'] = 'image/png, image/jpeg'
    }
    const response = await fetch(fetchUrl, { headers: Object.keys(headers).length ? headers : undefined })
    if (!response.ok) {
      throw new Error('Failed to load image for printing')
    }
    blobs.push(await response.blob())
  }
  const objectUrls = blobs.map((b) => URL.createObjectURL(b))
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) {
    objectUrls.forEach((u) => URL.revokeObjectURL(u))
    document.body.removeChild(iframe)
    throw new Error('Print is not available in this browser')
  }
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print</title><style>
    @page { margin: 8mm; size: auto; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      height: auto;
      min-height: 0;
    }
    /* Avoid flex + min-height:100vh in print — it often yields a blank first page and extra trailing pages. */
    .print-page {
      margin: 0;
      padding: 0;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-page:not(:last-child) {
      page-break-after: always;
      break-after: page;
    }
    .print-page img {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      max-height: 270mm;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  </style></head><body>`)
  objectUrls.forEach((u) => {
    doc.write(`<div class="print-page"><img src="${u}" alt="" /></div>`)
  })
  doc.write('</body></html>')
  doc.close()
  const images = [...doc.querySelectorAll('img')]
  if (images.length === 0) {
    objectUrls.forEach((u) => URL.revokeObjectURL(u))
    document.body.removeChild(iframe)
    throw new Error('No images to print')
  }
  let remaining = images.length
  const finish = () => {
    remaining -= 1
    if (remaining > 0) return
    const runPrint = () => {
      const w = iframe.contentWindow
      if (w) {
        w.focus()
        w.print()
      }
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(runPrint, 0))
    } else {
      setTimeout(runPrint, 0)
    }
    setTimeout(() => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u))
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 500)
  }
  images.forEach((img) => {
    if (img.complete) finish()
    else {
      img.onload = finish
      img.onerror = finish
    }
  })
}

/**
 * Download an image from a URL. Saves as PNG or PDF.
 * Uses /image endpoint when pageId and userId are provided.
 * @param {string} imageUrl - URL of the image
 * @param {string} title - Base filename (without extension)
 * @param {'png' | 'pdf'} format - Download format
 * @param {string} [pageId] - Coloring page ID (for /image endpoint)
 * @param {string} [userId] - User ID (for /image endpoint)
 */
export const downloadImage = async (imageUrl, title, format = 'png', pageId = null, userId = null) => {
  const baseName = (title || 'coloring-page').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const fetchUrl = pageId && userId
      ? `${API_BASE_URL}/coloring-pages/${pageId}/image`
      : imageUrl
    const headers = {}
    if (pageId && userId) {
      headers['X-User-Id'] = userId
      headers['Accept'] = 'image/png, image/jpeg'
    }
    const response = await fetch(fetchUrl, { headers: Object.keys(headers).length ? headers : undefined })
    const contentType = response.headers.get('Content-Type') || ''
    const blob = await response.blob()
    // Use response Content-Type so extension matches actual image format (fixes "unsupported format" when server returns JPEG)
    const isJpeg = contentType.includes('image/jpeg') || contentType.includes('image/jpg')
    const imageExt = isJpeg ? 'jpg' : 'png'
    const imageType = isJpeg ? 'image/jpeg' : 'image/png'
    const typedBlob = blob.type === imageType ? blob : new Blob([await blob.arrayBuffer()], { type: imageType })
    if (format === 'png') {
      const url = URL.createObjectURL(typedBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}.${imageExt}`
      link.click()
      trackDownload('image', 1)
      // Delay revoke so the browser can start the download before the URL is released
      setTimeout(() => URL.revokeObjectURL(url), 200)
      return
    }
    if (format === 'pdf') {
      const dataUrl = await blobToDataUrl(blob)
      const img = await loadImage(dataUrl)
      const pdf = new jsPDF({
        orientation: img.width >= img.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgAspect = img.width / img.height
      const pageAspect = pageW / pageH
      let w, h
      if (imgAspect > pageAspect) {
        w = pageW
        h = pageW / imgAspect
      } else {
        h = pageH
        w = pageH * imgAspect
      }
      const x = (pageW - w) / 2
      const y = (pageH - h) / 2
      pdf.addImage(dataUrl, 'PNG', x, y, w, h)
      pdf.save(`${baseName}.pdf`)
      trackDownload('pdf', 1)
    }
  } catch (err) {
    throw new Error(err.message || 'Failed to download image')
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImage(dataUrl) {
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

function getPrintImageCacheKey(item, userId) {
  const id = item?.id != null && String(item.id).trim() !== '' ? String(item.id).trim() : ''
  const url = item?.url != null && String(item.url).trim() !== '' ? String(item.url).trim() : ''
  if (!id && !url) return ''
  return `${userId || 'anon'}::${id || url}`
}

async function fetchPrintImageBlob(item, userId) {
  const { url, id } = item
  const fetchUrl = id && userId ? `${API_BASE_URL}/coloring-pages/${id}/image` : url
  const headers = {}
  if (id && userId) {
    headers['X-User-Id'] = userId
    headers['Accept'] = 'image/png, image/jpeg'
  }
  const response = await fetch(fetchUrl, { headers: Object.keys(headers).length ? headers : undefined })
  if (!response.ok) {
    throw new Error(`Failed to fetch print image (${response.status})`)
  }
  return response.blob()
}

async function getPrintImageBlobWithCache(item, userId, cacheMap, cacheTtlMs) {
  if (!cacheMap || typeof cacheMap.get !== 'function' || typeof cacheMap.set !== 'function') {
    return fetchPrintImageBlob(item, userId)
  }
  const key = getPrintImageCacheKey(item, userId)
  const now = Date.now()
  if (key) {
    const cached = cacheMap.get(key)
    if (
      cached &&
      cached.blob instanceof Blob &&
      Number.isFinite(cached.fetchedAt) &&
      now - cached.fetchedAt <= cacheTtlMs
    ) {
      return cached.blob
    }
  }
  const blob = await fetchPrintImageBlob(item, userId)
  if (key) {
    cacheMap.set(key, { blob, fetchedAt: now })
  }
  return blob
}

/**
 * Same fetch + jsPDF layout as "Download as PDF" (downloadImagesAsPdf): one /image request at a time,
 * then addImage(..., 'PNG', ...). Returns a PDF Blob (does not trigger a download).
 * @param {Array<{ url: string, title?: string, id?: string }>} items
 * @param {string | null} [userId]
 * @param {{
 *   onProgress?: (percent: number) => void
 *   onPreparingPage?: (currentPage: number, totalPages: number) => void
 *   globalPageStart?: number
 *   globalPageTotal?: number
 *   pageSizePts?: { width: number, height: number }
 *   imagePlacementRectPts?: { x: number, y: number, width: number, height: number }
 *   imagePlacementRectsPts?: Array<{ x: number, y: number, width: number, height: number }>
 *   forceSinglePage?: boolean
 *   imageBlobCache?: Map<string, { blob: Blob, fetchedAt: number }>
 *   imageBlobCacheTtlMs?: number
 * }} [options]
 * globalPageStart = 1-based index of the first item in this segment (for multi-part books: cover=1, interior=2).
 * When `pageSizePts` is set (Lulu trim in PDF points), every page uses that exact width × height (MediaBox), e.g. from `trimSizePointsFromPodPackageId()`. Otherwise defaults to A4.
 * @returns {Promise<Blob>}
 */
export async function buildImagesPdfBlob(items, userId = null, options = {}) {
  if (!items?.length) {
    throw new Error('No images to include in the PDF')
  }
  const {
    onProgress,
    onPreparingPage,
    globalPageStart = 1,
    globalPageTotal,
    pageSizePts,
    imagePlacementRectPts,
    imagePlacementRectsPts,
    forceSinglePage = false,
    imageBlobCache,
    imageBlobCacheTtlMs = 10 * 60 * 1000,
  } = options
  const total = items.length
  const labelTotal = globalPageTotal ?? total
  let pdf = null
  const fixedTrim =
    pageSizePts &&
    typeof pageSizePts.width === 'number' &&
    typeof pageSizePts.height === 'number' &&
    pageSizePts.width > 0 &&
    pageSizePts.height > 0
      ? { width: pageSizePts.width, height: pageSizePts.height }
      : null
  for (let i = 0; i < items.length; i++) {
    const currentPage = globalPageStart + i
    onPreparingPage?.(currentPage, labelTotal)
    const blob = await getPrintImageBlobWithCache(items[i], userId, imageBlobCache, imageBlobCacheTtlMs)
    const dataUrl = await blobToDataUrl(blob)
    const img = await loadImage(dataUrl)
    if (!pdf) {
      if (fixedTrim) {
        const w = fixedTrim.width
        const h = fixedTrim.height
        pdf = new jsPDF({
          unit: 'pt',
          format: [w, h],
          orientation: w >= h ? 'landscape' : 'portrait',
          compress: true,
        })
      } else {
        pdf = new jsPDF({
          orientation: img.width >= img.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        })
      }
    } else if (!forceSinglePage) {
      pdf.addPage()
    }
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const candidateRect = Array.isArray(imagePlacementRectsPts) ? imagePlacementRectsPts[i] : imagePlacementRectPts
    const placementRect =
      candidateRect &&
      Number.isFinite(candidateRect.x) &&
      Number.isFinite(candidateRect.y) &&
      Number.isFinite(candidateRect.width) &&
      Number.isFinite(candidateRect.height) &&
      candidateRect.width > 0 &&
      candidateRect.height > 0
        ? candidateRect
        : { x: 0, y: 0, width: pageW, height: pageH }
    const imgAspect = img.width / img.height
    const pageAspect = placementRect.width / placementRect.height
    let w
    let h
    if (imgAspect > pageAspect) {
      w = placementRect.width
      h = placementRect.width / imgAspect
    } else {
      h = placementRect.height
      w = placementRect.height * imgAspect
    }
    const x = placementRect.x + (placementRect.width - w) / 2
    const y = placementRect.y + (placementRect.height - h) / 2
    pdf.addImage(dataUrl, 'PNG', x, y, w, h)
    const percent = Math.round(((i + 1) / total) * 100)
    onProgress?.(percent)
  }
  if (pdf) {
    onProgress?.(100)
    const out = pdf.output('blob')
    return out instanceof Blob ? out : new Blob([out], { type: 'application/pdf' })
  }
  throw new Error('No images to include in the PDF')
}

/**
 * Download multiple images as a single PDF (one image per page).
 * @param {Array<{ url: string, title: string, id?: string }>} items - Items with imageUrl, title, and optional id
 * @param {string} filename - Base filename for the PDF
 * @param {string} [userId] - User ID (for CORS-safe proxy)
 * @param {{ onProgress?: (percent: number) => void }} [options] - Optional progress callback (0-100)
 */
export const downloadImagesAsPdf = async (items, filename = 'coloring-pages', userId = null, options = {}) => {
  if (!items?.length) return
  const baseName = (filename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const blob = await buildImagesPdfBlob(items, userId, options)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${baseName}.pdf`
    link.click()
    trackDownload('pdf', items.length)
    setTimeout(() => URL.revokeObjectURL(url), 200)
  } catch (err) {
    throw new Error(err.message || 'Failed to download PDF')
  }
}

/**
 * Download multiple images as a single ZIP file (one image per file).
 * Uses client-zip (streaming, no compression) for better Windows compatibility.
 * @param {Array<{ url: string, title: string, id?: string }>} items - Items with imageUrl, title, and optional id
 * @param {string} zipFilename - Base filename for the ZIP (without .zip)
 * @param {string} [userId] - User ID (for /image endpoint)
 * @param {{ onProgress?: (percent: number) => void }} [options] - Optional progress callback (0-100)
 */
export const downloadImagesAsZip = async (items, zipFilename = 'coloring-pages', userId = null, options = {}) => {
  if (!items?.length) return
  const { onProgress } = options
  const baseName = (zipFilename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  const total = items.length
  try {
    /** @type {Array<{ name: string, input: Blob }>} - for client-zip */
    const zipInputs = []
    for (let i = 0; i < items.length; i++) {
      const { url, id } = items[i]
      const fetchUrl = id && userId
        ? `${API_BASE_URL}/coloring-pages/${id}/image`
        : url
      const headers = {}
      if (id && userId) {
        headers['X-User-Id'] = userId
        headers['Accept'] = 'image/png, image/jpeg'
      }
      const response = await fetch(fetchUrl, { headers: Object.keys(headers).length ? headers : undefined })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to fetch image ${i + 1}: ${text || response.status}`)
      }
      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error(`Image ${i + 1} is empty`)
      }
      const contentType = response.headers.get('Content-Type') || ''
      const ext = contentType.includes('image/jpeg') || contentType.includes('image/jpg') ? 'jpg' : 'png'
      const fileName = `image-${i + 1}.${ext}`
      zipInputs.push({ name: fileName, input: blob })
      const percent = Math.round(((i + 1) / total) * 90)
      onProgress?.(percent)
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    const zipBlob = await downloadZip(zipInputs).blob()
    onProgress?.(100)
    if (!zipBlob || zipBlob.size === 0) {
      throw new Error('Failed to generate ZIP file')
    }
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${baseName}.zip`
    link.click()
    trackDownload('image', items.length)
    setTimeout(() => URL.revokeObjectURL(url), 200)
  } catch (err) {
    throw new Error(err.message || 'Failed to download ZIP')
  }
}
