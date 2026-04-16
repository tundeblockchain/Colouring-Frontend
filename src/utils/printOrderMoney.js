/**
 * Format stored totals (e.g. amountTotal) as currency: API uses minor units (USD cents, GBP pence, etc.).
 */
export function formatPrintOrderMoney(amount, currency) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  const code =
    typeof currency === 'string' && /^[A-Z]{3}$/i.test(currency.trim())
      ? currency.trim().toUpperCase()
      : 'USD'
  const major = n / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(major)
  } catch {
    return `${major.toFixed(2)} ${code}`
  }
}
