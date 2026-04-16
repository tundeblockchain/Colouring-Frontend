/**
 * Turn stored print-order shipping (Lulu checkout shape or common variants) into plain lines.
 */
export function formatPrintOrderShippingAddress(raw) {
  if (!raw || typeof raw !== 'object') return ''

  const get = (...keys) => {
    for (const k of keys) {
      const v = raw[k]
      if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
  }

  const name = get('name', 'recipient_name', 'full_name')
  const line1 = get('street1', 'street_1', 'line1', 'address_line1', 'addressLine1')
  const line2 = get('street2', 'street_2', 'line2', 'address_line2', 'addressLine2')
  const city = get('city', 'town')
  const state = get('state_code', 'state', 'region', 'province')
  const postcode = get('postcode', 'postal_code', 'zip', 'zipCode', 'postalCode')
  const country = get('country_code', 'country')
  const phone = get('phone_number', 'phone')
  const email = get('email')

  let locality = ''
  if (city && state && postcode) locality = `${city}, ${state} ${postcode}`
  else if (city && state) locality = `${city}, ${state}`
  else if (city && postcode) locality = `${city} ${postcode}`
  else locality = [city, state, postcode].filter(Boolean).join(' ')

  const lines = []
  if (name) lines.push(name)
  if (line1) lines.push(line1)
  if (line2) lines.push(line2)
  if (locality) lines.push(locality)
  if (country) lines.push(country)
  if (phone) lines.push(phone)
  if (email) lines.push(email)

  if (lines.length > 0) return lines.join('\n')

  const entries = Object.entries(raw).filter(([, v]) => v != null && String(v).trim() !== '')
  if (entries.length === 0) return ''
  return entries
    .map(([k, v]) => `${String(k).replace(/_/g, ' ')}: ${String(v).trim()}`)
    .join('\n')
}
