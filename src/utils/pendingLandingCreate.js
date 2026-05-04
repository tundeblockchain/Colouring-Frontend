const STORAGE_KEY = 'colorcharm_pending_landing_create'
const MAX_PROMPT_LENGTH = 4000

/**
 * Persist prompt + defaults before auth so Create can prefill after sign-up / login.
 */
export function setPendingLandingCreate({ prompt, quality = 'fast', numImages = 1 } = {}) {
  const trimmed = typeof prompt === 'string' ? prompt.trim().slice(0, MAX_PROMPT_LENGTH) : ''
  try {
    if (!trimmed) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    const payload = {
      v: 1,
      prompt: trimmed,
      quality: quality === 'standard' ? 'standard' : 'fast',
      numImages: Math.min(10, Math.max(1, Number(numImages) || 1)),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Read and remove pending landing create payload (one-shot).
 * @returns {{ prompt: string, quality: string, numImages: number } | null}
 */
export function consumePendingLandingCreate() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)
    const data = JSON.parse(raw)
    if (!data || data.v !== 1) return null
    const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : ''
    if (!prompt) return null
    return {
      prompt,
      quality: data.quality === 'standard' ? 'standard' : 'fast',
      numImages: Math.min(10, Math.max(1, Number(data.numImages) || 1)),
    }
  } catch {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return null
  }
}
