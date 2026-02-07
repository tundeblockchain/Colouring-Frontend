/**
 * Google Analytics (GA4) integration for tracking user behaviour, ads and marketing.
 * Uses gtag.js; measurement ID from VITE_GA_MEASUREMENT_ID.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

/**
 * Load the gtag script and initialize GA4.
 * Safe to call multiple times; only runs if MEASUREMENT_ID is set.
 */
export function initAnalytics() {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  function gtag(...args) {
    window.dataLayer.push(args)
  }
  window.gtag = gtag

  gtag('js', new Date())

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  script.onload = () => {
    gtag('config', MEASUREMENT_ID, {
      send_page_view: false, // we send page_view ourselves on route change
      anonymize_ip: true,
    })
  }
}

/**
 * Send a page view. Call on every route change (SPA).
 * @param {string} path - Path (e.g. /dashboard, /pricing)
 * @param {string} [title] - Optional page title
 */
export function pageview(path, title) {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
  })
}

/**
 * Send a custom event. Use for conversions and marketing.
 * @param {string} name - Event name (e.g. 'sign_up', 'login', 'purchase')
 * @param {Record<string, unknown>} [params] - Event parameters
 */
export function event(name, params = {}) {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}

// --- Marketing / conversion helpers (recommended event names for GA4 & Google Ads) ---

/** User signed up (e.g. register). method: 'email', 'google', etc. */
export function trackSignUp(method = 'email') {
  event('sign_up', { method })
}

/** User logged in. method: 'email', 'google', etc. */
export function trackLogin(method = 'email') {
  event('login', { method })
}

/** User viewed a specific item (e.g. coloring page). */
export function trackViewItem(itemId, itemName, value, currency = 'USD') {
  event('view_item', {
    currency,
    value,
    items: [{ item_id: itemId, item_name: itemName }],
  })
}

/** User started checkout (e.g. choose plan, add credits). */
export function trackBeginCheckout(value, currency = 'USD', items = []) {
  event('begin_checkout', { currency, value, items })
}

/** Purchase completed. */
export function trackPurchase(transactionId, value, currency = 'USD', items = []) {
  event('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items: items.length ? items : undefined,
  })
}

/** User selected content (e.g. CTA click). Good for engagement. */
export function trackSelectContent(contentType, itemId) {
  event('select_content', { content_type: contentType, item_id: itemId })
}

/** Outbound link click (e.g. external link). */
export function trackClick(url, linkText) {
  event('click', { outbound_link: url, link_text: linkText })
}

/** User created a coloring page. type: 'text' | 'wordArt' | 'photo'. */
export function trackCreationType(type) {
  event('create_coloring_page', { creation_type: type })
}

/** User viewed the pricing screen. */
export function trackViewPricing() {
  event('view_pricing', {})
}

/** User viewed the choose-plan screen. */
export function trackViewChoosePlan() {
  event('view_choose_plan', {})
}

/** User viewed the add-credits screen. */
export function trackViewAddCredits() {
  event('view_add_credits', {})
}

/** User downloaded a coloring page. format: 'pdf' | 'image' (png/zip), count: number of pages. */
export function trackDownload(format, count = 1) {
  event('download_coloring_page', { download_format: format, page_count: count })
}

/** Check if analytics is enabled (measurement ID set). */
export function isAnalyticsEnabled() {
  return Boolean(MEASUREMENT_ID)
}
