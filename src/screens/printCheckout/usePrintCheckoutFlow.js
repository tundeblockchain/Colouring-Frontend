import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFolders } from '../../hooks/useFolders'
import { useFolderPageList } from '../../hooks/useFolderPageList'
import { getCurrentUserIdToken } from '../../api/auth'
import {
  getPrintCoverDimensions,
  getPrintQuote,
  createPrintCheckout,
  ensurePrintPdfKeys,
} from '../../api/printOrders'
import { getCountrySelectOptions } from '../../constants/isoCountries'
import { buildCoverAndInteriorPdfBlobs, buildImagesPdfBlob } from '../../utils/printPdfBlobs'
import { trimSizePointsFromPodPackageId } from '../../shared/pod-package'
import { MIN_PAGES_FOR_PHYSICAL_PRINT, selectPagesReadyForPrint } from '../../constants/printOrder'
import { coverDimensionsToPageSizePts } from '../../utils/printCoverDimensions'
import { MIN_RETAIL_CENTS, PRINT_CHECKOUT_QUANTITY } from './constants'
import {
  estimateBookRetailMinorUnitsFromQuote,
  extractLuluQuoteCurrency,
  formatMinorUnitsAsCurrency,
  buildLuluShippingAddressPayload,
  orderPagesByIds,
} from './utils'

const PRINT_IMAGE_BLOB_CACHE_TTL_MS = 10 * 60 * 1000

export function usePrintCheckoutFlow() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const userId = user?.uid

  const returnPath =
    location.state?.returnPath || (bookId ? `/folders/${encodeURIComponent(bookId)}` : '/folders')
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
  const printImageBlobCacheRef = useRef(new Map())

  useEffect(() => {
    return () => {
      if (optionalPdfObjectUrlRef.current) {
        URL.revokeObjectURL(optionalPdfObjectUrlRef.current)
        optionalPdfObjectUrlRef.current = null
      }
      printImageBlobCacheRef.current.clear()
    }
  }, [])

  useEffect(() => {
    printImageBlobCacheRef.current.clear()
  }, [bookId])

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

  const [bookOrientation, setBookOrientation] = useState('portrait')
  const [shippingOptions, setShippingOptions] = useState([])
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState('')
  /** Lulu quote currency (ISO 4217); retailAmountCents sent to API are minor units in this currency. */
  const [quoteCurrency, setQuoteCurrency] = useState('USD')
  /** Book line only, minor units of quoteCurrency (matches backend retailAmountCents). */
  const [retailAmountMinorUnits, setRetailAmountMinorUnits] = useState(null)

  useEffect(() => {
    setQuoteCurrency('USD')
    setRetailAmountMinorUnits(null)
    setShippingOptions([])
    setSelectedShippingOptionId('')
  }, [bookId])

  const resolvedPodPackageId = useMemo(() => {
    const raw =
      bookOrientation === 'landscape'
        ? defaultLandscape || defaultPortrait
        : defaultPortrait || defaultLandscape
    return (raw || '').trim()
  }, [bookOrientation, defaultPortrait, defaultLandscape])

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
      const trimPts = resolvedPodPackageId ? trimSizePointsFromPodPackageId(resolvedPodPackageId) : null
      const blob = await buildImagesPdfBlob(items, userId, {
        ...(trimPts ? { pageSizePts: trimPts } : {}),
        imageBlobCache: printImageBlobCacheRef.current,
        imageBlobCacheTtlMs: PRINT_IMAGE_BLOB_CACHE_TTL_MS,
      })
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
  }, [userId, readyPages, resolvedPodPackageId])

  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [checkoutPrepMessage, setCheckoutPrepMessage] = useState('')

  const resetQuoteSubmitErrors = useCallback(() => {
    setQuoteError('')
    setSubmitError('')
  }, [])

  const shippingStepValid = useCallback(
    () =>
      shippingName.trim() &&
      street1.trim() &&
      city.trim() &&
      postcode.trim() &&
      countryCode.trim() &&
      phone.trim(),
    [shippingName, street1, city, postcode, countryCode, phone],
  )

  const handleNextFromPreview = useCallback(() => {
    setActiveStep(1)
  }, [])

  const handleNextFromShipping = useCallback(async () => {
    resetQuoteSubmitErrors()
    if (!userId || !bookId || !canProceed) {
      setQuoteError('Missing session or book.')
      return
    }
    if (!shippingStepValid()) {
      setQuoteError('Please fill in name, street, city, postcode, country, and phone before continuing.')
      return
    }
    if (!user?.email?.trim()) {
      setQuoteError('Your account has no email address. Add one to your profile or sign in with an email provider to continue.')
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
    const interiorPageCount = readyPages.length - 2
    setQuoteLoading(true)
    try {
      const shippingAddress = buildLuluShippingAddressPayload({
        shippingName,
        street1,
        street2,
        city,
        postcode,
        countryCode,
        stateCode,
        phone,
        email: user.email,
      })
      const body = {
        podPackageId: resolvedPodPackageId,
        bookOrientation,
        pageCount: interiorPageCount,
        quantity: PRINT_CHECKOUT_QUANTITY,
        shippingAddress,
      }
      const res = await getPrintQuote(token, userId, body)
      if (!res.success) {
        setQuoteError(res.error || 'Quote failed')
        return
      }
      const quote = res.data?.quote ?? res.data
      const returnedShippingOptions = Array.isArray(res.data?.shippingOptions) ? res.data.shippingOptions : []
      if (!returnedShippingOptions.length) {
        setQuoteError('Quote did not include any shipping options for checkout.')
        return
      }
      setShippingOptions(returnedShippingOptions)
      const serverSelectedId = res.data?.selectedShippingOptionId
      const fallbackSelectedId = returnedShippingOptions[0]?.id
      setSelectedShippingOptionId(
        typeof serverSelectedId === 'string' && serverSelectedId.trim()
          ? serverSelectedId
          : (fallbackSelectedId ?? ''),
      )
      const est = estimateBookRetailMinorUnitsFromQuote(quote)
      if (est == null) {
        setQuoteError(
          'Quote did not include a recognizable book total (excluding shipping). Check total_cost_incl_tax and shipping_cost, or line_item_costs + fulfillment_cost.',
        )
        return
      }
      setQuoteCurrency(extractLuluQuoteCurrency(quote))
      setRetailAmountMinorUnits(Math.max(est, MIN_RETAIL_CENTS))
      setActiveStep(2)
    } catch (e) {
      setQuoteError(e.message || 'Quote failed')
    } finally {
      setQuoteLoading(false)
    }
  }, [
    resetQuoteSubmitErrors,
    userId,
    bookId,
    canProceed,
    shippingStepValid,
    resolvedPodPackageId,
    readyPages.length,
    bookOrientation,
    shippingName,
    street1,
    street2,
    city,
    postcode,
    countryCode,
    stateCode,
    phone,
    user,
  ])

  const handleStripeCheckout = useCallback(async () => {
    resetQuoteSubmitErrors()
    if (!userId || !bookId || !canProceed) return
    if (!shippingStepValid()) {
      setSubmitError('Please complete shipping details (same as used for your quote) before checkout.')
      return
    }
    if (!user?.email?.trim()) {
      setSubmitError('Your account has no email address. Add one to your profile or sign in with an email provider to continue.')
      return
    }
    if (!resolvedPodPackageId) {
      setSubmitError('Print product is not configured (missing Lulu pod package env vars).')
      return
    }
    if (retailAmountMinorUnits == null || retailAmountMinorUnits < MIN_RETAIL_CENTS) {
      setSubmitError(
        `Book line amount is missing or below the minimum (${formatMinorUnitsAsCurrency(quoteCurrency, MIN_RETAIL_CENTS)} in ${quoteCurrency}; excludes shipping).`,
      )
      return
    }
    if (!selectedShippingOptionId) {
      setSubmitError('Please choose a shipping method before continuing to checkout.')
      return
    }
    const token = await getCurrentUserIdToken()
    if (!token) {
      setSubmitError('Please sign in again.')
      return
    }
    setSubmitLoading(true)
    setCheckoutPrepMessage('Preparing checkout…')
    try {
      const items = readyPages.map((p) => ({
        url: p.imageUrl || p.thumbnailUrl,
        id: p.id,
        title: p.title,
      }))
      const interiorPageCountForCoverApi = readyPages.length - 2

      setCheckoutPrepMessage('Getting cover dimensions…')
      let coverPageSizePts = null
      const coverDimRes = await getPrintCoverDimensions(token, userId, {
        podPackageId: resolvedPodPackageId,
        bookOrientation,
        pageCount: interiorPageCountForCoverApi,
        unit: 'pt',
      })
      if (coverDimRes.success) {
        const cd =
          coverDimRes.data?.coverDimensions ?? coverDimRes.data?.data?.coverDimensions ?? null
        coverPageSizePts = coverDimensionsToPageSizePts(cd)
      }

      const { coverBlob, interiorBlob, interiorPageCount } = await buildCoverAndInteriorPdfBlobs(
        items,
        userId,
        {
          podPackageId: resolvedPodPackageId,
          bookOrientation,
          ...(coverPageSizePts ? { coverPageSizePts } : {}),
          imageBlobCache: printImageBlobCacheRef.current,
          imageBlobCacheTtlMs: PRINT_IMAGE_BLOB_CACHE_TTL_MS,
          onPreparingPage: (current, total) => {
            setCheckoutPrepMessage(`Assembling Pages (${current}/${total})…`)
          },
        },
      )

      setCheckoutPrepMessage('Uploading print files…')
      const { interiorPdfKey, coverPdfKey } = await ensurePrintPdfKeys(token, userId, bookId, {
        coverBlob,
        interiorBlob,
      })

      const shippingAddress = buildLuluShippingAddressPayload({
        shippingName,
        street1,
        street2,
        city,
        postcode,
        countryCode,
        stateCode,
        phone,
        email: user.email,
      })

      const origin = window.location.origin
      const cancelPath = returnPath.startsWith('/') ? returnPath : `/${returnPath}`
      const checkoutBody = {
        bookId,
        podPackageId: resolvedPodPackageId,
        bookOrientation,
        pageCount: interiorPageCount,
        interiorPdfKey,
        coverPdfKey,
        shippingOptionId: selectedShippingOptionId,
        // Legacy fallback for backends still expecting shippingLevel.
        shippingLevel: selectedShippingOptionId,
        quantity: PRINT_CHECKOUT_QUANTITY,
        shippingAddress,
        retailAmountCents: retailAmountMinorUnits,
        successUrl: `${origin}/print-orders?paid=1`,
        cancelUrl: `${origin}${cancelPath}`,
        lineItemTitle,
      }

      setCheckoutPrepMessage('Starting secure checkout…')
      const res = await createPrintCheckout(token, userId, checkoutBody)
      if (!res.success || !res.data?.url) {
        setSubmitError(res.error || 'Checkout could not be started')
        return
      }
      printImageBlobCacheRef.current.clear()
      window.location.href = res.data.url
    } catch (e) {
      setSubmitError(e.message || 'Checkout failed')
    } finally {
      setCheckoutPrepMessage('')
      setSubmitLoading(false)
    }
  }, [
    resetQuoteSubmitErrors,
    userId,
    bookId,
    canProceed,
    shippingStepValid,
    resolvedPodPackageId,
    retailAmountMinorUnits,
    quoteCurrency,
    readyPages,
    returnPath,
    lineItemTitle,
    bookOrientation,
    selectedShippingOptionId,
    shippingName,
    street1,
    street2,
    city,
    postcode,
    countryCode,
    stateCode,
    phone,
    user,
  ])

  const bookLineSummary = useMemo(() => {
    if (retailAmountMinorUnits == null) return null
    return formatMinorUnitsAsCurrency(quoteCurrency, retailAmountMinorUnits)
  }, [quoteCurrency, retailAmountMinorUnits])

  return {
    bookId,
    navigate,
    authLoading,
    user,
    userId,
    returnPath,
    folder,
    lineItemTitle,
    pagesLoading,
    readyPages,
    canProceed,
    countryMenuOptions,
    resolvedPodPackageId,
    activeStep,
    setActiveStep,
    optionalPdfLoading,
    optionalPdfError,
    setOptionalPdfError,
    handleDownloadOptionalPreviewPdf,
    handleNextFromPreview,
    shippingName,
    setShippingName,
    street1,
    setStreet1,
    street2,
    setStreet2,
    city,
    setCity,
    postcode,
    setPostcode,
    countryCode,
    setCountryCode,
    stateCode,
    setStateCode,
    phone,
    setPhone,
    bookOrientation,
    setBookOrientation,
    shippingOptions,
    selectedShippingOptionId,
    setSelectedShippingOptionId,
    quoteError,
    setQuoteError,
    quoteLoading,
    handleNextFromShipping,
    submitError,
    setSubmitError,
    submitLoading,
    checkoutPrepMessage,
    handleStripeCheckout,
    quoteCurrency,
    bookLineSummary,
  }
}
