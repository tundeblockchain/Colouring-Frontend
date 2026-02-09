import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import { getCookieConsent, setCookieConsent, isAnalyticsEnabled } from '../utils/analytics'

/**
 * Cookie consent banner for analytics (GDPR / ePrivacy).
 * Shown until user accepts or rejects. Uses localStorage and gtag consent mode.
 */
export function CookieConsentBanner() {
  const [consent, setConsent] = useState(null)

  useEffect(() => {
    setConsent(getCookieConsent())
  }, [])

  const handleAccept = () => {
    setCookieConsent(true)
    setConsent('granted')
  }

  const handleReject = () => {
    setCookieConsent(false)
    setConsent('denied')
  }

  if (!isAnalyticsEnabled() || consent !== null) return null

  return (
    <Box
      component="aside"
      role="dialog"
      aria-label="Cookie consent"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        p: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 300px', maxWidth: 600 }}>
        We use cookies for analytics to improve your experience. By continuing you agree to our{' '}
        <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Privacy Policy
        </Link>
        .
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleReject}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleAccept}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Accept
        </Button>
      </Box>
    </Box>
  )
}
