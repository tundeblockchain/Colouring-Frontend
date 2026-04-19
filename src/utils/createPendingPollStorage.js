import { ColoringPage } from '../models/coloringPage'

const KEY_PREFIX = 'colouring-create-pending:'
const VERSION = 1
/** Slightly longer than client poll timeout so stale drafts are dropped */
const MAX_AGE_MS = 17 * 60 * 1000

function storageKey(userId) {
  return `${KEY_PREFIX}${userId}`
}

function pageToPlain(p) {
  return { ...p }
}

/**
 * @param {string} userId
 * @param {import('../models/coloringPage').ColoringPage[]} pages
 * @param {{ bookFolderId?: string | null }} [extras]
 */
export function persistPendingCreatePoll(userId, pages, extras = {}) {
  if (!userId || !pages?.length) return
  try {
    const bookFolderId =
      extras.bookFolderId ??
      pages.find((p) => p.folderId)?.folderId ??
      null
    sessionStorage.setItem(
      storageKey(userId),
      JSON.stringify({
        v: VERSION,
        savedAt: Date.now(),
        pages: pages.map((p) => pageToPlain(p)),
        bookFolderId,
      })
    )
  } catch {
    // quota / private mode
  }
}

export function clearPendingCreatePoll(userId) {
  if (!userId) return
  try {
    sessionStorage.removeItem(storageKey(userId))
  } catch {
    // ignore
  }
}

/**
 * @param {import('../models/coloringPage').ColoringPage[]} pages
 */
export function anyPagePendingPoll(pages) {
  if (!Array.isArray(pages)) return false
  return pages.some((p) => {
    if (!p?.id) return false
    return p.status !== 'completed' && p.status !== 'failed'
  })
}

/**
 * @returns {{ pages: ColoringPage[], bookFolderId: string | null } | null}
 */
export function readPendingCreatePoll(userId) {
  if (!userId) return null
  try {
    const raw = sessionStorage.getItem(storageKey(userId))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.v !== VERSION || !Array.isArray(data.pages) || !data.pages.length) {
      return null
    }
    if (Date.now() - (data.savedAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(storageKey(userId))
      return null
    }
    return {
      pages: data.pages.map((row) => new ColoringPage(row)),
      bookFolderId: data.bookFolderId || null,
    }
  } catch {
    return null
  }
}
