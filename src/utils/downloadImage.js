import { jsPDF } from 'jspdf'
import { trackDownload } from './analytics'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Download an image from a URL. Saves as PNG or PDF.
 * Uses CORS-safe proxy when pageId and userId are provided.
 * @param {string} imageUrl - URL of the image
 * @param {string} title - Base filename (without extension)
 * @param {'png' | 'pdf'} format - Download format
 * @param {string} [pageId] - Coloring page ID (for CORS-safe proxy)
 * @param {string} [userId] - User ID (for CORS-safe proxy)
 */
export const downloadImage = async (imageUrl, title, format = 'png', pageId = null, userId = null) => {
  const baseName = (title || 'coloring-page').replace(/[<>:"/\\|?*]/g, '_')
  try {
    // Use CORS-safe proxy for PDF downloads or when pageId and userId are provided
    const useCorsProxy = (format === 'pdf' || pageId) && pageId && userId
    const fetchUrl = useCorsProxy
      ? `${API_BASE_URL}/coloring-pages/${pageId}/image`
      : imageUrl
    const fetchOptions = useCorsProxy
      ? { headers: { 'X-User-Id': userId } }
      : {}
    const response = await fetch(fetchUrl, fetchOptions)
    const blob = await response.blob()
    if (format === 'png') {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}.png`
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

/**
 * Download multiple images as a single PDF (one image per page).
 * @param {Array<{ url: string, title: string, id?: string }>} items - Items with imageUrl, title, and optional id
 * @param {string} filename - Base filename for the PDF
 * @param {string} [userId] - User ID (for CORS-safe proxy)
 */
export const downloadImagesAsPdf = async (items, filename = 'coloring-pages', userId = null) => {
  if (!items?.length) return
  const baseName = (filename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const { jsPDF } = await import('jspdf')
    let pdf = null
    for (let i = 0; i < items.length; i++) {
      const { url, title, id } = items[i]
      // Use CORS-safe proxy when id and userId are available
      const useCorsProxy = id && userId
      const fetchUrl = useCorsProxy ? `${API_BASE_URL}/coloring-pages/${id}/image` : url
      const fetchOptions = useCorsProxy ? { headers: { 'X-User-Id': userId } } : {}
      const response = await fetch(fetchUrl, fetchOptions)
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
    }
    if (pdf) {
      pdf.save(`${baseName}.pdf`)
      trackDownload('pdf', items.length)
    }
  } catch (err) {
    throw new Error(err.message || 'Failed to download PDF')
  }
}

/**
 * Download multiple images as a single ZIP file (one PNG per image).
 * @param {Array<{ url: string, title: string, id?: string }>} items - Items with imageUrl, title, and optional id
 * @param {string} zipFilename - Base filename for the ZIP (without .zip)
 * @param {string} [userId] - User ID (for CORS-safe proxy)
 */
export const downloadImagesAsZip = async (items, zipFilename = 'coloring-pages', userId = null) => {
  if (!items?.length) return
  const baseName = (zipFilename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const usedNames = new Set()
    for (let i = 0; i < items.length; i++) {
      const { url, title, id } = items[i]
      // Use CORS-safe proxy when id and userId are available
      const useCorsProxy = id && userId
      const fetchUrl = useCorsProxy ? `${API_BASE_URL}/coloring-pages/${id}/image` : url
      const fetchOptions = useCorsProxy ? { headers: { 'X-User-Id': userId } } : {}
      const response = await fetch(fetchUrl, fetchOptions)
      const blob = await response.blob()
      const base = (title || `coloring-page-${i + 1}`).replace(/[<>:"/\\|?*]/g, '_').replace(/\.png$/i, '')
      let fileName = `${base}.png`
      let n = 1
      while (usedNames.has(fileName)) {
        fileName = `${base}-${n}.png`
        n++
      }
      usedNames.add(fileName)
      zip.file(fileName, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
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
