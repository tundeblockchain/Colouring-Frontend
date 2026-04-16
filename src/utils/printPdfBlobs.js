import { buildImagesPdfBlob } from './downloadImage'
import { trimSizePointsFromPodPackageId } from '../shared/pod-package'
import luluCoverLayouts from '../config/luluCoverLayouts.json'

export { buildImagesPdfBlob }

const POINTS_PER_INCH = 72

function toPositiveNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function getCoverLayoutForOrientation(bookOrientation) {
  const key = String(bookOrientation || 'portrait').toLowerCase() === 'landscape' ? 'landscape' : 'portrait'
  const raw = luluCoverLayouts?.[key]
  if (!raw || typeof raw !== 'object') return null
  const totalWidthIn = toPositiveNumber(raw.totalWidthIn)
  const totalHeightIn = toPositiveNumber(raw.totalHeightIn)
  const trimWidthIn = toPositiveNumber(raw.trimWidthIn)
  const trimHeightIn = toPositiveNumber(raw.trimHeightIn)
  const bleedIn = toPositiveNumber(raw.bleedIn)
  const spineWidthIn = toPositiveNumber(raw.spineWidthIn)
  if (!totalWidthIn || !totalHeightIn || !trimWidthIn || !trimHeightIn || !bleedIn || !spineWidthIn) return null
  return { totalWidthIn, totalHeightIn, trimWidthIn, trimHeightIn, bleedIn, spineWidthIn }
}

function buildFrontPanelPlacementRectPts(layoutIn, pageSizePts) {
  if (!layoutIn || !pageSizePts) return null
  const totalWidthPts = layoutIn.totalWidthIn * POINTS_PER_INCH
  const totalHeightPts = layoutIn.totalHeightIn * POINTS_PER_INCH
  if (totalWidthPts <= 0 || totalHeightPts <= 0) return null
  const scaleX = pageSizePts.width / totalWidthPts
  const scaleY = pageSizePts.height / totalHeightPts
  const xPts = (layoutIn.bleedIn + layoutIn.trimWidthIn + layoutIn.spineWidthIn) * POINTS_PER_INCH * scaleX
  const yPts = layoutIn.bleedIn * POINTS_PER_INCH * scaleY
  const widthPts = layoutIn.trimWidthIn * POINTS_PER_INCH * scaleX
  const heightPts = layoutIn.trimHeightIn * POINTS_PER_INCH * scaleY
  if (!(widthPts > 0 && heightPts > 0)) return null
  return { x: xPts, y: yPts, width: widthPts, height: heightPts }
}

function buildBackPanelPlacementRectPts(layoutIn, pageSizePts) {
  if (!layoutIn || !pageSizePts) return null
  const totalWidthPts = layoutIn.totalWidthIn * POINTS_PER_INCH
  const totalHeightPts = layoutIn.totalHeightIn * POINTS_PER_INCH
  if (totalWidthPts <= 0 || totalHeightPts <= 0) return null
  const scaleX = pageSizePts.width / totalWidthPts
  const scaleY = pageSizePts.height / totalHeightPts
  const xPts = layoutIn.bleedIn * POINTS_PER_INCH * scaleX
  const yPts = layoutIn.bleedIn * POINTS_PER_INCH * scaleY
  const widthPts = layoutIn.trimWidthIn * POINTS_PER_INCH * scaleX
  const heightPts = layoutIn.trimHeightIn * POINTS_PER_INCH * scaleY
  if (!(widthPts > 0 && heightPts > 0)) return null
  return { x: xPts, y: yPts, width: widthPts, height: heightPts }
}

/**
 * Cover = first image as front + last image as back; interior = middle images.
 * Forwards `onPreparingPage(current, total)` with 1-based indices across the full book (cover = page 1).
 *
 * **Interior** PDF page size is the Lulu trim decoded from `podPackageId` (see `parseTrimFromPodPackageId`).
 * **Cover** PDF defaults to the same trim; full wrap covers need Lulu cover dimensions (page count + binding) —
 * pass `coverPageSizePts` when your quote/API supplies them. Changing `podPackageId` or orientation requires new PDFs.
 *
 * @param {object} options
 * @param {string} options.podPackageId - Lulu SKU id with leading `WWWWXHHHH` trim segment.
 * @param {'portrait'|'landscape'} [options.bookOrientation]
 * @param {{ width: number, height: number }} [options.coverPageSizePts] - optional cover PDF page size in pt.
 * @returns {Promise<{ coverBlob: Blob, interiorBlob: Blob, interiorPageCount: number }>}
 */
export async function buildCoverAndInteriorPdfBlobs(orderedItems, userId = null, options = {}) {
  if (!orderedItems?.length) {
    throw new Error('No pages to print')
  }
  const { podPackageId, coverPageSizePts, bookOrientation, ...forwardOpts } = options
  if (podPackageId == null || typeof podPackageId !== 'string' || !podPackageId.trim()) {
    throw new Error('Print PDFs require a Lulu pod package id so interior pages match book trim.')
  }
  const trimPts = trimSizePointsFromPodPackageId(podPackageId.trim())
  if (!trimPts) {
    throw new Error(
      `Could not read book trim from pod package id "${podPackageId}". Expected a leading segment like 0600X0900 (width × height in hundredths of an inch) before the first dot.`,
    )
  }
  const coverPts =
    coverPageSizePts &&
    typeof coverPageSizePts.width === 'number' &&
    typeof coverPageSizePts.height === 'number' &&
    coverPageSizePts.width > 0 &&
    coverPageSizePts.height > 0
      ? coverPageSizePts
      : trimPts
  const coverLayout = getCoverLayoutForOrientation(bookOrientation)
  const coverFrontPanelRectPts = buildFrontPanelPlacementRectPts(coverLayout, coverPts)
  const coverBackPanelRectPts = buildBackPanelPlacementRectPts(coverLayout, coverPts)

  const coverFrontItem = orderedItems[0]
  const coverBackItem = orderedItems[orderedItems.length - 1]
  const interiorItems = orderedItems.slice(1, -1)
  if (interiorItems.length < 2) {
    throw new Error(
      'Physical books need at least four pages: front cover, back cover, and at least two interior pages. Add more pages to this book or folder.',
    )
  }
  const bookPageTotal = orderedItems.length
  const baseOpts = { ...forwardOpts, globalPageTotal: bookPageTotal }
  const coverBlob = await buildImagesPdfBlob([coverFrontItem, coverBackItem], userId, {
    ...baseOpts,
    globalPageStart: 1,
    pageSizePts: coverPts,
    ...(coverFrontPanelRectPts && coverBackPanelRectPts
      ? { imagePlacementRectsPts: [coverFrontPanelRectPts, coverBackPanelRectPts] }
      : {}),
    forceSinglePage: true,
  })
  const interiorBlob = await buildImagesPdfBlob(interiorItems, userId, {
    ...baseOpts,
    globalPageStart: 2,
    pageSizePts: trimPts,
  })
  return {
    coverBlob,
    interiorBlob,
    interiorPageCount: interiorItems.length,
  }
}
