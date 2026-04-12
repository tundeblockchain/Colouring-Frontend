import { buildImagesPdfBlob } from './downloadImage'

export { buildImagesPdfBlob }

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
