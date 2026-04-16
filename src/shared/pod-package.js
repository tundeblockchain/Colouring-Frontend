/**
 * Lulu pod_package_id: the segment before the first "." is WWWWXHHHH - width x height in hundredths of an inch
 * (e.g. 0600X0900 -> 6.00 x 9.00 inches; 0900X0600 -> 9.00 x 6.00 inches).
 * Interior PDF pages must use this trim in MediaBox/CropBox (72 PDF points per inch).
 *
 * @see https://assets.lulu.com/media/specs/lulu-print-api-spec-sheet.xlsx
 */

/**
 * @param {string} podPackageId
 * @returns {{ widthHundredths: number, heightHundredths: number } | null}
 */
export function parseTrimFromPodPackageId(podPackageId) {
  if (podPackageId == null || typeof podPackageId !== 'string') return null
  const first = podPackageId.trim().split('.')[0]
  const m = first.match(/^(\d{1,4})[xX](\d{1,4})$/)
  if (!m) return null
  const widthHundredths = parseInt(m[1], 10)
  const heightHundredths = parseInt(m[2], 10)
  if (
    !Number.isFinite(widthHundredths) ||
    !Number.isFinite(heightHundredths) ||
    widthHundredths <= 0 ||
    heightHundredths <= 0
  ) {
    return null
  }
  return { widthHundredths, heightHundredths }
}

/**
 * @param {string} podPackageId
 * @returns {{ widthInches: number, heightInches: number } | null}
 */
export function trimSizeInchesFromPodPackageId(podPackageId) {
  const t = parseTrimFromPodPackageId(podPackageId)
  if (!t) return null
  return {
    widthInches: t.widthHundredths / 100,
    heightInches: t.heightHundredths / 100,
  }
}

/**
 * PDF user units: 72 pt per inch.
 * @param {string} podPackageId
 * @returns {{ width: number, height: number } | null}
 */
export function trimSizePointsFromPodPackageId(podPackageId) {
  const inch = trimSizeInchesFromPodPackageId(podPackageId)
  if (!inch) return null
  return {
    width: Math.round(inch.widthInches * 72 * 1000) / 1000,
    height: Math.round(inch.heightInches * 72 * 1000) / 1000,
  }
}
