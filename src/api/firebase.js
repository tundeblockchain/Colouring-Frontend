import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics, setAnalyticsCollectionEnabled } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_GA_MEASUREMENT_ID && {
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  }),
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Firebase Analytics – initialized lazily; collection enabled only after consent
let firebaseAnalytics = null
let initAttempted = false

export function getFirebaseAnalytics() {
  if (firebaseAnalytics) return firebaseAnalytics
  if (typeof window === 'undefined' || !import.meta.env.VITE_GA_MEASUREMENT_ID) return null
  if (initAttempted) return null // Already tried and failed
  
  // Ensure DOM is ready (getAnalytics requires browser environment)
  if (document.readyState === 'loading') {
    // Wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      initAttempted = true
      try {
        firebaseAnalytics = getAnalytics(app)
        setAnalyticsCollectionEnabled(firebaseAnalytics, false)
      } catch {}
    })
    return null
  }
  
  initAttempted = true
  try {
    firebaseAnalytics = getAnalytics(app)
    setAnalyticsCollectionEnabled(firebaseAnalytics, false)
    return firebaseAnalytics
  } catch {
    return null
  }
}

export function setFirebaseAnalyticsEnabled(enabled) {
  const analytics = getFirebaseAnalytics()
  if (analytics) {
    try {
      setAnalyticsCollectionEnabled(analytics, enabled)
    } catch {}
  }
}

export default app
