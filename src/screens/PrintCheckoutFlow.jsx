import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link as RouterLink, Navigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
} from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useFolders } from '../hooks/useFolders'
import { useFolderPageList } from '../hooks/useFolderPageList'
import { getCurrentUserIdToken } from '../api/auth'
import { getPrintQuote, createPrintCheckout, ensurePrintPdfKeysWithOrder } from '../api/printOrders'
import { getCountrySelectOptions } from '../constants/isoCountries'
import { buildCoverAndInteriorPdfBlobs, buildImagesPdfBlob } from '../utils/printPdfBlobs'
import { MIN_PAGES_FOR_PHYSICAL_PRINT, selectPagesReadyForPrint } from '../constants/printOrder'

const MIN_RETAIL_CENTS = 50

const CHECKOUT_SHIPPING_OPTIONS = [
  { value: 'MAIL', label: 'Mail' },
  { value: 'PRIORITY_MAIL', label: 'Priority Mail' },
  { value: 'EXPRESS', label: 'Express' },
]

const STEPS = ['Preview your book', 'Shipping & print options', 'Payment']

function estimateRetailCentsFromQuote(quote) {
  if (!quote || typeof quote !== 'object') return null
  const candidates = [
    quote.total_cost_incl_tax,
    quote.total_cost_including_tax,
    quote.total_cost,
    quote?.totals?.total_including_tax,
    quote?.total_cost_including_tax_and_shipping,
  ]
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    const n = typeof c === 'number' ? c : parseFloat(String(c).replace(/[^0-9.-]/g, ''))
    if (!Number.isFinite(n)) continue
    const cents = n > 1000 ? Math.round(n) : Math.round(n * 100)
    if (cents >= MIN_RETAIL_CENTS) return cents
  }
  return null
}

function dollarsToCents(d) {
  const n = parseFloat(String(d).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

function centsToDollarsString(cents) {
  return (cents / 100).toFixed(2)
}

/**
 * @param {Array} pages - must already be scoped to a single folder (same folderId)
 * @param {string[] | undefined} idOrder - preferred order from the UI; remaining folder pages append after
 */
function orderPagesByIds(pages, idOrder) {
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

export const PrintCheckoutFlow = () => {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const userId = user?.uid

  const returnPath =
    location.state?.returnPath ||
    (bookId ? `/folders/${encodeURIComponent(bookId)}` : '/folders')
  const orderedPageIdsFromNav = location.state?.orderedPageIds
  const lineItemTitleFromNav = location.state?.lineItemTitle || 'Custom coloring book (print)'

  const { data: folders = [] } = useFolders(userId)
  const { pagesInFolder, isLoading: pagesLoading } = useFolderPageList(userId, bookId)

  const folder = useMemo(() => folders.find((f) => f.id === bookId), [folders, bookId])
  const lineItemTitle = useMemo(() => {
    if (lineItemTitleFromNav && lineItemTitleFromNav !== 'Custom coloring book (print)') {
      return lineItemTitleFromNav
    }
    return folder?.name ? `${folder.name} (print)` : lineItemTitleFromNav
  }, [lineItemTitleFromNav, folder?.name])

  const orderedPages = useMemo(
    () => orderPagesByIds(pagesInFolder, orderedPageIdsFromNav),
    [pagesInFolder, orderedPageIdsFromNav],
  )

  const readyPages = useMemo(() => selectPagesReadyForPrint(orderedPages), [orderedPages])
  const canProceed = readyPages.length >= MIN_PAGES_FOR_PHYSICAL_PRINT

  const [activeStep, setActiveStep] = useState(0)

  const [optionalPdfLoading, setOptionalPdfLoading] = useState(false)
  const [optionalPdfError, setOptionalPdfError] = useState('')
  const optionalPdfObjectUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (optionalPdfObjectUrlRef.current) {
        URL.revokeObjectURL(optionalPdfObjectUrlRef.current)
        optionalPdfObjectUrlRef.current = null
      }
    }
  }, [])

  const handleDownloadOptionalPreviewPdf = useCallback(async () => {
    if (!userId || !readyPages.length) return
    setOptionalPdfError('')
    setOptionalPdfLoading(true)
    try {
      const items = readyPages.map((p) => ({
        url: p.imageUrl || p.thumbnailUrl,
        id: p.id,
        title: p.title,
      }))
      const blob = await buildImagesPdfBlob(items, userId)
      if (optionalPdfObjectUrlRef.current) {
        URL.revokeObjectURL(optionalPdfObjectUrlRef.current)
      }
      const url = URL.createObjectURL(blob)
      optionalPdfObjectUrlRef.current = url
      const a = document.createElement('a')
      a.href = url
      a.download = 'book-preview.pdf'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      setOptionalPdfError(e.message || 'Could not build preview PDF')
    } finally {
      setOptionalPdfLoading(false)
    }
  }, [userId, readyPages])

  const defaultPortrait = import.meta.env.VITE_LULU_POD_PACKAGE_PORTRAIT || ''
  const defaultLandscape = import.meta.env.VITE_LULU_POD_PACKAGE_LANDSCAPE || ''

  const countryMenuOptions = useMemo(() => getCountrySelectOptions(), [])

  const [shippingName, setShippingName] = useState('')
  const [street1, setStreet1] = useState('')
  const [street2, setStreet2] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [countryCode, setCountryCode] = useState('US')
  const [stateCode, setStateCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [bookOrientation, setBookOrientation] = useState('portrait')
  const [shippingLevel, setShippingLevel] = useState('MAIL')
  const [retailDollars, setRetailDollars] = useState('24.99')

  const resolvedPodPackageId = useMemo(() => {
    const raw =
      bookOrientation === 'landscape'
        ? defaultLandscape || defaultPortrait
        : defaultPortrait || defaultLandscape
    return (raw || '').trim()
  }, [bookOrientation, defaultPortrait, defaultLandscape])

  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const resetQuoteSubmitErrors = () => {
    setQuoteError('')
    setSubmitError('')
  }

  const shippingStepValid = () =>
    shippingName.trim() &&
    street1.trim() &&
    city.trim() &&
    postcode.trim() &&
    countryCode.trim() &&
    phone.trim()

  const handleNextFromPreview = () => {
    setActiveStep(1)
  }

  const handleNextFromShipping = async () => {
    resetQuoteSubmitErrors()
    if (!userId || !bookId || !canProceed) {
      setQuoteError('Missing session or book.')
      return
    }
    if (!shippingStepValid()) {
      setQuoteError('Please fill in name, street, city, postcode, country, and phone before continuing.')
      return
    }
    if (!resolvedPodPackageId) {
      setQuoteError(
        'Print product is not configured. Set VITE_LULU_POD_PACKAGE_PORTRAIT and VITE_LULU_POD_PACKAGE_LANDSCAPE in your environment.',
      )
      return
    }
    const token = await getCurrentUserIdToken()
    if (!token) {
      setQuoteError('Please sign in again.')
      return
    }
    const interiorPageCount = readyPages.length - 1
    setQuoteLoading(true)
    try {
      const body = {
        podPackageId: resolvedPodPackageId,
        bookOrientation,
        pageCount: interiorPageCount,
        quantity: 1,
        shippingOption: shippingLevel,
        shippingAddress: {
          name: shippingName.trim(),
          street1: street1.trim(),
          ...(street2.trim() ? { street2: street2.trim() } : {}),
          city: city.trim(),
          postcode: postcode.trim(),
          country_code: countryCode.trim().toUpperCase(),
          ...(stateCode.trim() ? { state_code: stateCode.trim().toUpperCase() } : {}),
          phone_number: phone.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
        },
      }
      const res = await getPrintQuote(token, userId, body)
      if (!res.success) {
        setQuoteError(res.error || 'Quote failed')
        return
      }
      const quote = res.data?.quote ?? res.data
      const est = estimateRetailCentsFromQuote(quote)
      if (est == null) {
        setQuoteError('Quote did not include a recognizable total (e.g. total_cost_incl_tax). Try again or contact support.')
        return
      }
      setRetailDollars(centsToDollarsString(Math.max(est, MIN_RETAIL_CENTS)))
      setActiveStep(2)
    } catch (e) {
      setQuoteError(e.message || 'Quote failed')
    } finally {
      setQuoteLoading(false)
    }
  }

  const handleStripeCheckout = async () => {
    resetQuoteSubmitErrors()
    if (!userId || !bookId || !canProceed) return
    if (!resolvedPodPackageId) {
      setSubmitError('Print product is not configured (missing Lulu pod package env vars).')
      return
    }
    const retailCents = dollarsToCents(retailDollars)
    if (retailCents == null || retailCents < MIN_RETAIL_CENTS) {
      setSubmitError(`Price must be at least $${(MIN_RETAIL_CENTS / 100).toFixed(2)} USD.`)
      return
    }
    const token = await getCurrentUserIdToken()
    if (!token) {
      setSubmitError('Please sign in again.')
      return
    }
    setSubmitLoading(true)
    try {
      const items = readyPages.map((p) => ({
        url: p.imageUrl || p.thumbnailUrl,
        id: p.id,
        title: p.title,
      }))
      const pageIdsInOrder = readyPages.map((p) => p.id).filter(Boolean)
      const { coverBlob, interiorBlob, interiorPageCount } = await buildCoverAndInteriorPdfBlobs(items, userId)

      const { interiorPdfKey, coverPdfKey } = await ensurePrintPdfKeysWithOrder(
        token,
        userId,
        bookId,
        pageIdsInOrder,
        { coverBlob, interiorBlob },
      )

      const origin = window.location.origin
      const cancelPath = returnPath.startsWith('/') ? returnPath : `/${returnPath}`
      const checkoutBody = {
        bookId,
        podPackageId: resolvedPodPackageId,
        bookOrientation,
        pageCount: interiorPageCount,
        interiorPdfKey,
        coverPdfKey,
        shippingLevel,
        retailAmountCents: retailCents,
        successUrl: `${origin}/print-orders?paid=1`,
        cancelUrl: `${origin}${cancelPath}`,
        lineItemTitle,
      }

      const res = await createPrintCheckout(token, userId, checkoutBody)
      if (!res.success || !res.data?.url) {
        setSubmitError(res.error || 'Checkout could not be started')
        return
      }
      window.location.href = res.data.url
    } catch (e) {
      setSubmitError(e.message || 'Checkout failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (authLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!bookId) {
    navigate('/folders', { replace: true })
    return null
  }

  return (
    <MainLayout>
      <Button
        component={RouterLink}
        to={returnPath}
        startIcon={<ArrowBack />}
        color="inherit"
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Order physical book
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {folder?.name ? `Book folder: ${folder.name}` : 'Review your book, then shipping and secure payment.'}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {pagesLoading && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading your pages…</Typography>
        </Box>
      )}

      {!pagesLoading && !canProceed && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Physical printing needs at least {MIN_PAGES_FOR_PHYSICAL_PRINT} finished pages (first page = cover). This
          folder has {readyPages.length} ready.{' '}
          <Button component={RouterLink} to={returnPath} size="small" sx={{ ml: 1 }}>
            Go back
          </Button>
        </Alert>
      )}

      {!pagesLoading && canProceed && activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Step 1 — Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pages appear in print order. The first image is the cover; the rest are the interior. Scroll horizontally to
            review all {readyPages.length} pages.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              overflowY: 'hidden',
              py: 1,
              px: 0.5,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'action.hover',
              maxHeight: 360,
            }}
          >
            {readyPages.map((p, index) => {
              const src = p.imageUrl || p.thumbnailUrl
              return (
                <Box
                  key={p.id || index}
                  sx={{
                    flex: '0 0 auto',
                    width: { xs: 200, sm: 220 },
                    scrollSnapAlign: 'start',
                  }}
                >
                  <Chip
                    size="small"
                    label={index === 0 ? 'Cover' : `Page ${index + 1}`}
                    sx={{ mb: 0.75 }}
                    color={index === 0 ? 'primary' : 'default'}
                    variant={index === 0 ? 'filled' : 'outlined'}
                  />
                  <Box
                    component="img"
                    src={src}
                    alt={p.title || `Page ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      display: 'block',
                      width: '100%',
                      maxHeight: 280,
                      objectFit: 'contain',
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  />
                </Box>
              )
            })}
          </Box>
          {optionalPdfError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setOptionalPdfError('')}>
              {optionalPdfError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadOptionalPreviewPdf}
              disabled={optionalPdfLoading}
              startIcon={
                optionalPdfLoading ? <CircularProgress size={18} color="inherit" /> : undefined
              }
            >
              {optionalPdfLoading ? 'Building PDF…' : 'Download preview as PDF (optional)'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              PDF generation can take a minute for large books; you can continue without it.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={handleNextFromPreview}>
              Next: shipping details
            </Button>
          </Box>
        </Paper>
      )}

      {!pagesLoading && canProceed && activeStep === 1 && (
        <Paper sx={{ p: 3, maxWidth: 520, width: '100%', mx: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Step 2 — Shipping & print options
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Used for the printer&apos;s cost estimate. Stripe Checkout will also collect shipping and payment.
          </Typography>

          {quoteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setQuoteError('')}>
              {quoteError}
            </Alert>
          )}

          <TextField
            label="Full name"
            fullWidth
            size="small"
            value={shippingName}
            onChange={(e) => setShippingName(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Street address"
            fullWidth
            size="small"
            value={street1}
            onChange={(e) => setStreet1(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Apt / suite (optional)"
            fullWidth
            size="small"
            value={street2}
            onChange={(e) => setStreet2(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            <TextField
              label="City"
              size="small"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              sx={{ flex: '1 1 140px', minWidth: 120 }}
            />
            <TextField
              label="Postcode"
              size="small"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              sx={{ flex: '1 1 100px', minWidth: 90 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5, alignItems: 'flex-start' }}>
            <TextField
              select
              label="Country"
              size="small"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              sx={{ flex: '1 1 200px', minWidth: 180 }}
              SelectProps={{
                MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
              }}
            >
              {countryMenuOptions.map(({ code, name }) => (
                <MenuItem key={code} value={code}>
                  {code} — {name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="State / region (optional)"
              size="small"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              sx={{ flex: '1 1 120px', minWidth: 100 }}
            />
          </Box>
          <TextField
            label="Phone"
            fullWidth
            size="small"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Email (optional)"
            fullWidth
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Book orientation"
            fullWidth
            size="small"
            value={bookOrientation}
            onChange={(e) => setBookOrientation(e.target.value)}
            sx={{ mb: 1.5 }}
          >
            <MenuItem value="portrait">Portrait</MenuItem>
            <MenuItem value="landscape">Landscape</MenuItem>
          </TextField>

          <TextField
            select
            label="Shipping speed"
            fullWidth
            size="small"
            value={shippingLevel}
            onChange={(e) => setShippingLevel(e.target.value)}
            sx={{ mb: 2 }}
          >
            {CHECKOUT_SHIPPING_OPTIONS.map(({ value, label }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Button onClick={() => setActiveStep(0)} color="inherit" disabled={quoteLoading}>
              Back
            </Button>
            <Button variant="contained" onClick={handleNextFromShipping} disabled={quoteLoading}>
              {quoteLoading ? <CircularProgress size={22} color="inherit" /> : 'Next: payment'}
            </Button>
          </Box>
        </Paper>
      )}

      {!pagesLoading && canProceed && activeStep === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Step 3 — Stripe Checkout
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your print files will be uploaded securely, then you&apos;ll be redirected to Stripe to pay and confirm
            delivery details.
          </Typography>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
              {submitError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Button onClick={() => setActiveStep(1)} color="inherit" disabled={submitLoading}>
              Back
            </Button>
            <Button variant="contained" size="large" onClick={handleStripeCheckout} disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue to Stripe Checkout'}
            </Button>
          </Box>
        </Paper>
      )}
    </MainLayout>
  )
}
