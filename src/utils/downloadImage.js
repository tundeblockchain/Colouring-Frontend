import { downloadZip } from 'client-zip'
import { jsPDF } from 'jspdf'
import { trackDownload } from './analytics'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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
    console.error('Download failed:', err)
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

/**
 * Download multiple images as a single PDF (one image per page).
 * @param {Array<{ url: string, title: string, id?: string }>} items - Items with imageUrl, title, and optional id
 * @param {string} filename - Base filename for the PDF
 * @param {string} [userId] - User ID (for CORS-safe proxy)
 * @param {{ onProgress?: (percent: number) => void }} [options] - Optional progress callback (0-100)
 */
export const downloadImagesAsPdf = async (items, filename = 'coloring-pages', userId = null, options = {}) => {
  if (!items?.length) return
  const { onProgress } = options
  const baseName = (filename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  const total = items.length
  try {
    let pdf = null
    for (let i = 0; i < items.length; i++) {
      const { url, title, id } = items[i]
      const fetchUrl = id && userId
        ? `${API_BASE_URL}/coloring-pages/${id}/image`
        : url
      const headers = {}
      if (id && userId) {
        headers['X-User-Id'] = userId
        headers['Accept'] = 'image/png, image/jpeg'
      }
      const response = await fetch(fetchUrl, { headers: Object.keys(headers).length ? headers : undefined })
      const blob = await response.blob()
      const dataUrl = await blobToDataUrl(blob)
      const img = await loadImage(dataUrl)
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
      const percent = Math.round(((i + 1) / total) * 100)
      onProgress?.(percent)
    }
    if (pdf) {
      onProgress?.(100)
      pdf.save(`${baseName}.pdf`)
      trackDownload('pdf', items.length)
    }
  } catch (err) {
    console.error('Download PDF failed:', err)
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
    console.error('Download ZIP failed:', err)
    throw new Error(err.message || 'Failed to download ZIP')
  }
}
