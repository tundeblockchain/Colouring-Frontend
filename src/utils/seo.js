/**
 * SEO helpers: base URL and per-route meta (title, description).
 * Used by the SEO component to set document head per page.
 */

const SITE_NAME = 'Color Charm'
const DEFAULT_DESCRIPTION =
  'Create and print AI-generated colouring pages from text, photos, and word art. Free to try – perfect for kids, teachers, and crafters.'

export function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return import.meta.env.VITE_SITE_URL || 'https://colorcharm.app'
}

/**
 * Returns absolute URL for a path (for canonical and og:url).
 */
export function absoluteUrl(path) {
  const base = getBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/**
 * Default OG image (absolute). Use a path that works from your domain.
 */
export function getDefaultOgImage() {
  return absoluteUrl('/ColorCharm-logo.png')
}

/**
 * Get SEO config for a pathname. Handles static and dynamic routes.
 * @param {string} pathname - e.g. '/create/text', '/folders/abc'
 * @returns {{ title: string, description: string, noIndex?: boolean }}
 */
export function getSeoForPath(pathname) {
  const path = pathname.replace(/\/$/, '') || '/'
  const defaultMeta = { title: `${SITE_NAME} – AI Coloring Pages`, description: DEFAULT_DESCRIPTION }

  // Static routes
  const staticRoutes = {
    '/': {
      title: `${SITE_NAME} – AI Coloring Pages | Create & Print Free`,
      description: DEFAULT_DESCRIPTION,
    },
    '/login': {
      title: `Log in – ${SITE_NAME}`,
      description: `Log in to ${SITE_NAME} to create and save AI colouring pages.`,
      noIndex: true,
    },
    '/register': {
      title: `Sign up – ${SITE_NAME}`,
      description: `Create a free ${SITE_NAME} account to start making AI colouring pages.`,
      noIndex: true,
    },
    '/pricing': {
      title: `Pricing – ${SITE_NAME}`,
      description: `Plans and pricing for ${SITE_NAME}. Create colouring pages from text, photos, and word art.`,
    },
    '/terms': {
      title: `Terms of Service – ${SITE_NAME}`,
      description: `Terms of use for ${SITE_NAME} – AI colouring page generator.`,
    },
    '/privacy': {
      title: `Privacy Policy – ${SITE_NAME}`,
      description: `How ${SITE_NAME} collects and uses your data.`,
    },
    '/faq': {
      title: `FAQ – ${SITE_NAME}`,
      description: `Frequently asked questions about ${SITE_NAME} and creating colouring pages.`,
    },
    '/dashboard': {
      title: `Dashboard – ${SITE_NAME}`,
      description: `Your ${SITE_NAME} dashboard – start creating colouring pages.`,
      noIndex: true,
    },
    '/gallery': {
      title: `My Gallery – ${SITE_NAME}`,
      description: `Your saved colouring pages on ${SITE_NAME}.`,
      noIndex: true,
    },
    '/saved': {
      title: `Saved – ${SITE_NAME}`,
      description: `Your saved colouring pages.`,
      noIndex: true,
    },
    '/favorites': {
      title: `Favorites – ${SITE_NAME}`,
      description: `Your favorite colouring pages.`,
      noIndex: true,
    },
    '/profile': {
      title: `Profile & Billing – ${SITE_NAME}`,
      description: `Manage your ${SITE_NAME} account and subscription.`,
      noIndex: true,
    },
    '/settings': {
      title: `Settings – ${SITE_NAME}`,
      description: `Account settings for ${SITE_NAME}.`,
      noIndex: true,
    },
    '/folders': {
      title: `Folders – ${SITE_NAME}`,
      description: `Organize your colouring pages into folders.`,
      noIndex: true,
    },
    '/choose-plan': {
      title: `Choose a plan – ${SITE_NAME}`,
      description: `Select a subscription plan for ${SITE_NAME}.`,
      noIndex: true,
    },
    '/add-credits': {
      title: `Add credits – ${SITE_NAME}`,
      description: `Purchase one-time credits for ${SITE_NAME}.`,
      noIndex: true,
    },
  }

  if (staticRoutes[path]) return staticRoutes[path]

  // Create: /create/text, /create/word-art, /create/front-cover, /create/photo
  const createMatch = path.match(/^\/create\/(text|word-art|front-cover|photo|drawing)$/)
  if (createMatch) {
    const type = createMatch[1]
    const typeLabels = {
      text: 'Text prompt',
      'word-art': 'Word art',
      'front-cover': 'Front cover',
      photo: 'Photo',
      drawing: 'Drawing',
    }
    const label = typeLabels[type] || 'Create'
    return {
      title: `Create – ${label} – ${SITE_NAME}`,
      description: `Create a colouring page from ${label.toLowerCase()} on ${SITE_NAME}.`,
      noIndex: true,
    }
  }

  // Folder view: /folders/:folderId
  if (path.startsWith('/folders/')) {
    return {
      title: `Folder – ${SITE_NAME}`,
      description: `View folder of colouring pages on ${SITE_NAME}.`,
      noIndex: true,
    }
  }

  // 404
  if (path !== '/') {
    return {
      title: `Page not found – ${SITE_NAME}`,
      description: `The page you're looking for doesn't exist.`,
      noIndex: true,
    }
  }

  return defaultMeta
}

export { SITE_NAME, DEFAULT_DESCRIPTION }
