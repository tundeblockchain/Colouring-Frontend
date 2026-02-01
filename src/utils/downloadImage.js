import { jsPDF } from 'jspdf'

/**
 * Download an image from a URL. Saves as PNG or PDF.
 * @param {string} imageUrl - URL of the image
 * @param {string} title - Base filename (without extension)
 * @param {'png' | 'pdf'} format - Download format
 */
export const downloadImage = async (imageUrl, title, format = 'png') => {
  const baseName = (title || 'coloring-page').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    if (format === 'png') {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}.png`
      link.click()
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
    }
  } catch (err) {
    console.error('Download failed:', err)
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
 * @param {Array<{ url: string, title: string }>} items - Items with imageUrl and title
 * @param {string} filename - Base filename for the PDF
 */
export const downloadImagesAsPdf = async (items, filename = 'coloring-pages') => {
  if (!items?.length) return
  const baseName = (filename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const { jsPDF } = await import('jspdf')
    let pdf = null
    for (let i = 0; i < items.length; i++) {
      const { url, title } = items[i]
      const response = await fetch(url)
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
    }
  } catch (err) {
    console.error('Download PDF failed:', err)
  }
}

/**
 * Download multiple images as a single ZIP file (one PNG per image).
 * @param {Array<{ url: string, title: string }>} items - Items with imageUrl and title
 * @param {string} zipFilename - Base filename for the ZIP (without .zip)
 */
export const downloadImagesAsZip = async (items, zipFilename = 'coloring-pages') => {
  if (!items?.length) return
  const baseName = (zipFilename || 'coloring-pages').replace(/[<>:"/\\|?*]/g, '_')
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const usedNames = new Set()
    for (let i = 0; i < items.length; i++) {
      const { url, title } = items[i]
      const response = await fetch(url)
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
    setTimeout(() => URL.revokeObjectURL(url), 200)
  } catch (err) {
    console.error('Download ZIP failed:', err)
  }
}
