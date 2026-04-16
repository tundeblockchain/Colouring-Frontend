/**
 * Convert Lulu cover dimensions to jsPDF page size (PDF points).
 * @param {{ width: number, height: number, unit?: string } | null | undefined} coverDimensions
 * @returns {{ width: number, height: number } | null}
 */
export function coverDimensionsToPageSizePts(coverDimensions) {
  if (!coverDimensions || typeof coverDimensions !== 'object') return null
  const w = Number(coverDimensions.width)
  const h = Number(coverDimensions.height)
  const unit = String(coverDimensions.unit || 'pt').toLowerCase()
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null

  if (unit === 'pt') {
    return { width: w, height: h }
  }
  if (unit === 'mm') {
    const mmToPt = 72 / 25.4
    return {
      width: Math.round(w * mmToPt * 1000) / 1000,
      height: Math.round(h * mmToPt * 1000) / 1000,
    }
  }
  if (unit === 'inch' || unit === 'in') {
    return {
      width: Math.round(w * 72 * 1000) / 1000,
      height: Math.round(h * 72 * 1000) / 1000,
    }
  }
  return null
}
