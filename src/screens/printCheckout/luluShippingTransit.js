/**
 * Display copy for quote `shippingOptions` entries (Lulu shipping-options + cost calculation).
 * When present, `minTransitDays` / `maxTransitDays` follow Lulu **total** days (production + transit), not transit-only.
 */

const LULU_SHIPPING_TRANSIT_FALLBACK = {
  MAIL: 'Often 5–12+ total days to delivery (slowest; varies by region)',
  PRIORITY_MAIL: 'Often 3–6 total days to delivery',
  GROUND_HD: 'Ground to residence — often 3–8 total days to delivery',
  GROUND_BUS: 'Ground to business — often 3–8 total days to delivery',
  GROUND: 'Courier ground (US) — often 3–8 total days to delivery',
  EXPEDITED: 'Expedited — often ~2 business days in transit after production',
  EXPRESS: 'Express — overnight / next business day transit where available',
}

function parseFiniteInt(v) {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseInt(String(v).trim(), 10)
  return Number.isFinite(n) ? n : null
}

function parseFiniteNumber(v) {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).trim())
  return Number.isFinite(n) ? n : null
}

function formatDeliveryDateRange(minDeliveryDate, maxDeliveryDate) {
  const minRaw = minDeliveryDate
  const maxRaw = maxDeliveryDate
  if (!minRaw && !maxRaw) return ''
  try {
    const min = minRaw ? new Date(minRaw) : null
    const max = maxRaw ? new Date(maxRaw) : null
    if (min && Number.isNaN(+min)) return ''
    if (max && Number.isNaN(+max)) return ''
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    if (min && max && +min === +max) {
      return `Delivery approx. ${fmt.format(min)}`
    }
    if (min && max) {
      return `Delivery approx. ${fmt.format(min)} – ${fmt.format(max)}`
    }
    if (min) return `Delivery from approx. ${fmt.format(min)}`
    if (max) return `Delivery by approx. ${fmt.format(max)}`
  } catch {
    return ''
  }
  return ''
}

/**
 * Single-line summary (backward compatible). Prefer {@link getShippingOptionDetailLines} for full API fields.
 * @param {Record<string, unknown>} option
 * @returns {string}
 */
export function getLuluShippingTransitDescription(option) {
  const lines = getShippingOptionDetailLines(option)
  return lines.join(' ')
}

/**
 * @param {Record<string, unknown>} option - One entry from quote `shippingOptions`
 * @returns {string[]} Non-empty lines for subtitles (total-days estimate, optional dates, etc.)
 */
export function getShippingOptionDetailLines(option) {
  if (!option || typeof option !== 'object') return []

  const direct =
    typeof option.transitDescription === 'string' && option.transitDescription.trim()
      ? option.transitDescription.trim()
      : typeof option.shippingDays === 'string' && option.shippingDays.trim()
        ? option.shippingDays.trim()
        : typeof option.transitLabel === 'string' && option.transitLabel.trim()
          ? option.transitLabel.trim()
          : ''
  if (direct) {
    return [direct + appendTraceableSuffix(option)]
  }

  const minTotal = parseFiniteInt(
    option.minTransitDays ?? option.transitDaysMin ?? option.minBusinessDays ?? option.min_days,
  )
  const maxTotal = parseFiniteInt(
    option.maxTransitDays ?? option.transitDaysMax ?? option.maxBusinessDays ?? option.max_days,
  )
  const transitTimeDays = parseFiniteNumber(option.transitTimeDays)

  let primary = ''
  if (minTotal != null && maxTotal != null && maxTotal >= minTotal) {
    primary =
      minTotal === maxTotal
        ? `About ${minTotal} days to delivery total (est.)`
        : `About ${minTotal}–${maxTotal} days to delivery total (est.)`
  } else if (minTotal != null) {
    primary = `About ${minTotal}+ days to delivery total (est.)`
  } else if (maxTotal != null) {
    primary = `Up to ~${maxTotal} days to delivery total (est.)`
  } else if (transitTimeDays != null) {
    primary = `About ${transitTimeDays} days in transit (est.)`
  } else {
    const id = typeof option.id === 'string' ? option.id.trim().toUpperCase() : ''
    if (id && LULU_SHIPPING_TRANSIT_FALLBACK[id]) {
      primary = LULU_SHIPPING_TRANSIT_FALLBACK[id]
    } else {
      primary = 'Delivery time varies by destination (estimates only)'
    }
  }

  if (transitTimeDays != null && minTotal != null) {
    const same =
      maxTotal != null && minTotal === maxTotal && Math.round(transitTimeDays) === minTotal
    if (!same) {
      const tt = Number.isInteger(transitTimeDays) ? String(transitTimeDays) : transitTimeDays.toFixed(1).replace(/\.0$/, '')
      primary += ` · ~${tt} days in transit`
    }
  }

  primary += appendTraceableSuffix(option)

  const lines = []
  if (primary.trim()) lines.push(primary.trim())

  const dateLine = formatDeliveryDateRange(option.minDeliveryDate, option.maxDeliveryDate)
  if (dateLine) lines.push(dateLine)

  const dispatchLine = formatDispatchDateRange(option.minDispatchDate, option.maxDispatchDate)
  if (dispatchLine) lines.push(dispatchLine)

  return lines
}

function appendTraceableSuffix(option) {
  if (option.traceable === true) return ' · Tracking available'
  return ''
}

function formatDispatchDateRange(minDispatchDate, maxDispatchDate) {
  const minRaw = minDispatchDate
  const maxRaw = maxDispatchDate
  if (!minRaw && !maxRaw) return ''
  try {
    const min = minRaw ? new Date(minRaw) : null
    const max = maxRaw ? new Date(maxRaw) : null
    if (min && Number.isNaN(+min)) return ''
    if (max && Number.isNaN(+max)) return ''
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    if (min && max && +min === +max) {
      return `Ships approx. ${fmt.format(min)}`
    }
    if (min && max) {
      return `Ships approx. ${fmt.format(min)} – ${fmt.format(max)}`
    }
    if (min) return `Ships from approx. ${fmt.format(min)}`
    if (max) return `Ships by approx. ${fmt.format(max)}`
  } catch {
    return ''
  }
  return ''
}
