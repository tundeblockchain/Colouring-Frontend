import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { getSeoForPath, absoluteUrl, getDefaultOgImage } from '../utils/seo'

/**
 * Sets document head (title, meta description, canonical, Open Graph, Twitter Card)
 * based on the current pathname. Rendered once in App so every page gets SEO.
 */
export function SEO() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/$/, '') || '/'
  const { title, description, noIndex } = getSeoForPath(pathname)
  const canonical = absoluteUrl(path)
  const ogImage = getDefaultOgImage()

  const jsonLd =
    path === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Color Charm',
          description,
          url: canonical,
          applicationCategory: 'MultimediaApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }
      : null

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Color Charm" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
