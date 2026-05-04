/**
 * Validates in-app return paths to avoid open redirects.
 */
export function getSafeInternalPath(raw) {
  if (raw == null || typeof raw !== 'string') return null
  let decoded = raw.trim()
  try {
    decoded = decodeURIComponent(decoded)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  if (decoded.includes('://') || decoded.includes('..')) return null
  return decoded
}

export function resolvePostAuthRedirect({ stateFrom, nextQuery }) {
  const fromNext = getSafeInternalPath(nextQuery)
  if (fromNext) return fromNext
  const fromState = getSafeInternalPath(stateFrom)
  if (fromState) return fromState
  return '/dashboard'
}
