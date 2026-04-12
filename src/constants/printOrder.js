/** Minimum finished coloring pages required to start a physical (Lulu) print order. */
export const MIN_PAGES_FOR_PHYSICAL_PRINT = 32

export function selectPagesReadyForPrint(pages) {
  if (!Array.isArray(pages)) return []
  return pages.filter((p) => {
    const url = p?.imageUrl || p?.thumbnailUrl
    if (!url || p?.status === 'failed') return false
    if (p?.status === 'processing') return false
    return true
  })
}
