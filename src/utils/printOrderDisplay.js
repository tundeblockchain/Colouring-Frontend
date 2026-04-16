/** Customer-facing order reference; falls back to internal `orderId` if missing. */
export function getPrintOrderDisplayOrderNumber(order) {
  if (!order || typeof order !== 'object') return ''
  const raw = order.displayOrderNumber ?? order.display_order_number
  if (raw != null && raw !== '') return typeof raw === 'string' ? raw : String(raw)
  if (order.orderId != null && order.orderId !== '') return String(order.orderId)
  return ''
}

/** Backend may use any of these for a human-readable failure reason. */
/** Lulu-style codes; keep in sync with `PRINT_SHIPPING_LEVELS` in `api/printOrders.js`. */
const PRINT_ORDER_SHIPPING_CODE_LABELS = {
  MAIL: 'Mail',
  PRIORITY_MAIL: 'Priority Mail',
  GROUND_HD: 'Ground (home)',
  GROUND_BUS: 'Ground (business)',
  GROUND: 'Ground',
  EXPEDITED: 'Expedited',
  EXPRESS: 'Express',
}

/**
 * Shipping method for display. Backend now returns `shippingLevel`.
 */
export function getPrintOrderShippingMethodLabel(order) {
  if (!order || typeof order !== 'object') return ''
  const raw = order.shippingLevel ?? order.shipping_level
  if (raw == null || raw === '') return ''
  const s = typeof raw === 'string' ? raw.trim() : String(raw)
  if (!s) return ''
  const codeKey = s.toUpperCase().replace(/\s+/g, '_')
  if (PRINT_ORDER_SHIPPING_CODE_LABELS[codeKey]) return PRINT_ORDER_SHIPPING_CODE_LABELS[codeKey]
  if (/^[A-Z0-9_-]+$/i.test(s) && s.includes('_')) {
    return s
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  return s
}

export function getPrintOrderErrorMessage(order) {
  if (!order || typeof order !== 'object') return ''
  const raw =
    order.lastError ??
    order.last_error ??
    order.error ??
    order.failureReason ??
    order.failure_reason ??
    order.errorMessage ??
    order.error_message ??
    order.luluStatusMessage ??
    order.lulu_status_message
  if (raw == null || raw === '') return ''
  return typeof raw === 'string' ? raw : String(raw)
}

export function isLikelyFailedPrintOrderStatus(status) {
  const s = (status || '').toLowerCase()
  return s.includes('fail') || s.includes('cancel') || s.includes('error')
}

/** Normalizes backend status strings for lookup (snake_case, lower). */
function normalizePrintOrderStatusKey(status) {
  if (status == null || status === '') return ''
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

/** Known API statuses -> short customer-facing labels (Chips, summaries). */
const PRINT_ORDER_STATUS_LABELS = {
  pending: 'Pending',
  pending_payment: 'Awaiting payment',
  awaiting_payment: 'Awaiting payment',
  payment_pending: 'Awaiting payment',
  checkout_created: 'Checkout started',
  paid: 'Paid',
  payment_received: 'Paid',
  pdf_uploading: 'Uploading files',
  pdf_uploaded: 'Files uploaded',
  lulu_submitted: 'Processing',
  submitted: 'Submitted',
  lulu_processing: 'Processing',
  processing: 'Processing',
  in_production: 'In production',
  production: 'In production',
  printing: 'Printing',
  shipped: 'Shipped',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  refunded: 'Refunded',
}

function humanizeUnknownPrintOrderStatus(status) {
  const s = String(status).trim()
  if (!s) return 'Unknown'
  return s
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Customer-facing label for `order.status` (and similar fields like last Lulu status codes).
 * Unknown values are title-cased from snake_case.
 */
export function getPrintOrderStatusLabel(status) {
  const key = normalizePrintOrderStatusKey(status)
  if (!key) return 'Unknown'
  if (PRINT_ORDER_STATUS_LABELS[key]) return PRINT_ORDER_STATUS_LABELS[key]
  return humanizeUnknownPrintOrderStatus(status)
}
