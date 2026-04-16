import { MIN_RETAIL_CENTS } from './constants'

/** Lulu/OpenAPI-style decimal string or number in major units → minor units (cents, pence, etc., ×100 rounded). */
export function luluDecimalToMinorUnits(v) {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

/**
 * Book/product line only (excludes shipping). Backend charges shipping as a separate Stripe line item.
 * Prefers total_cost_incl_tax − shipping_cost.total_cost_incl_tax; falls back to line_item_costs + fulfillment_cost.
 */
/** Book line only in quote **currency** minor units (not shipping). */
export function estimateBookRetailMinorUnitsFromQuote(quote) {
  if (!quote || typeof quote !== 'object') return null

  const total = luluDecimalToMinorUnits(
    quote.total_cost_incl_tax ?? quote.total_cost_including_tax ?? quote.total_cost,
  )
  const shipping = luluDecimalToMinorUnits(quote.shipping_cost?.total_cost_incl_tax)
  if (total != null && shipping != null && total >= shipping) {
    const book = total - shipping
    if (book >= MIN_RETAIL_CENTS) return book
  }

  let sum = 0
  let nParts = 0
  if (Array.isArray(quote.line_item_costs)) {
    for (const row of quote.line_item_costs) {
      const c = luluDecimalToMinorUnits(row?.total_cost_incl_tax)
      if (c != null) {
        sum += c
        nParts += 1
      }
    }
  }
  const fulfillment = luluDecimalToMinorUnits(quote.fulfillment_cost?.total_cost_incl_tax)
  if (fulfillment != null) {
    sum += fulfillment
    nParts += 1
  }
  if (nParts > 0 && sum >= MIN_RETAIL_CENTS) return sum

  return null
}

/** ISO 4217 from Lulu quote (e.g. GBP, USD). */
export function extractLuluQuoteCurrency(quote) {
  if (!quote || typeof quote !== 'object') return 'USD'
  const raw = quote.currency ?? quote?.totals?.currency
  if (typeof raw === 'string' && /^[A-Z]{3}$/i.test(raw.trim())) return raw.trim().toUpperCase()
  return 'USD'
}

/** Format minor units as currency (e.g. 847 + GBP → £8.47). */
export function formatMinorUnitsAsCurrency(currency, minorUnits) {
  const code = (currency || 'USD').toUpperCase()
  const major = minorUnits / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(major)
  } catch {
    return `${major.toFixed(2)} ${code}`
  }
}

/**
 * Same shape as quote + checkout: Lulu shippingAddress (required fields on checkout).
 */
export function buildLuluShippingAddressPayload({
  shippingName,
  street1,
  street2,
  city,
  postcode,
  countryCode,
  stateCode,
  phone,
  email,
}) {
  return {
    name: shippingName.trim(),
    street1: street1.trim(),
    ...(street2.trim() ? { street2: street2.trim() } : {}),
    city: city.trim(),
    postcode: postcode.trim(),
    country_code: countryCode.trim().toUpperCase(),
    ...(stateCode.trim() ? { state_code: stateCode.trim().toUpperCase() } : {}),
    phone_number: phone.trim(),
    ...(email.trim() ? { email: email.trim() } : {}),
  }
}

export function dollarsToCents(d) {
  const n = parseFloat(String(d).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

export function centsToDollarsString(cents) {
  return (cents / 100).toFixed(2)
}

/**
 * @param {Array} pages - must already be scoped to a single folder (same folderId)
 * @param {string[] | undefined} idOrder - preferred order from the UI; remaining folder pages append after
 */
export function orderPagesByIds(pages, idOrder) {
  if (!pages?.length) return []
  if (!idOrder?.length) return [...pages]
  const byId = Object.fromEntries(pages.map((p) => [p.id, p]))
  const seen = new Set()
  const ordered = []
  for (const id of idOrder) {
    const p = byId[id]
    if (p) {
      ordered.push(p)
      seen.add(id)
    }
  }
  for (const p of pages) {
    if (p?.id && !seen.has(p.id)) ordered.push(p)
  }
  return ordered
}
