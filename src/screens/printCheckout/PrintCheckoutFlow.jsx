import { Link as RouterLink, Navigate } from 'react-router-dom'
import { Box, Button, Typography, Alert, CircularProgress, Stepper, Step, StepLabel } from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { MainLayout } from '../../components/Layout/MainLayout'
import { MIN_PAGES_FOR_PHYSICAL_PRINT } from '../../constants/printOrder'
import { STEPS } from './constants'
import { usePrintCheckoutFlow } from './usePrintCheckoutFlow'
import { PrintCheckoutPreviewStep } from './PrintCheckoutPreviewStep'
import { PrintCheckoutShippingStep } from './PrintCheckoutShippingStep'
import { PrintCheckoutPaymentStep } from './PrintCheckoutPaymentStep'

export function PrintCheckoutFlow() {
  const flow = usePrintCheckoutFlow()
  const {
    bookId,
    navigate,
    authLoading,
    user,
    returnPath,
    folder,
    pagesLoading,
    readyPages,
    canProceed,
    countryMenuOptions,
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
  } = flow

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
      <Button component={RouterLink} to={returnPath} startIcon={<ArrowBack />} color="inherit" sx={{ mb: 2 }}>
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
          Physical printing needs at least {MIN_PAGES_FOR_PHYSICAL_PRINT} finished pages (first = front cover, last =
          back cover). This folder has {readyPages.length} ready.{' '}
          <Button component={RouterLink} to={returnPath} size="small" sx={{ ml: 1 }}>
            Go back
          </Button>
        </Alert>
      )}

      {!pagesLoading && canProceed && activeStep === 0 && (
        <PrintCheckoutPreviewStep
          readyPages={readyPages}
          optionalPdfError={optionalPdfError}
          onDismissOptionalPdfError={() => setOptionalPdfError('')}
          optionalPdfLoading={optionalPdfLoading}
          onDownloadOptionalPreviewPdf={handleDownloadOptionalPreviewPdf}
          onNext={handleNextFromPreview}
        />
      )}

      {!pagesLoading && canProceed && activeStep === 1 && (
        <PrintCheckoutShippingStep
          quoteError={quoteError}
          onDismissQuoteError={() => setQuoteError('')}
          quoteLoading={quoteLoading}
          countryMenuOptions={countryMenuOptions}
          shippingName={shippingName}
          setShippingName={setShippingName}
          street1={street1}
          setStreet1={setStreet1}
          street2={street2}
          setStreet2={setStreet2}
          city={city}
          setCity={setCity}
          postcode={postcode}
          setPostcode={setPostcode}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          stateCode={stateCode}
          setStateCode={setStateCode}
          phone={phone}
          setPhone={setPhone}
          accountEmail={user?.email ?? ''}
          bookOrientation={bookOrientation}
          setBookOrientation={setBookOrientation}
          onBack={() => setActiveStep(0)}
          onNext={handleNextFromShipping}
        />
      )}

      {!pagesLoading && canProceed && activeStep === 2 && (
        <PrintCheckoutPaymentStep
          submitError={submitError}
          onDismissSubmitError={() => setSubmitError('')}
          submitLoading={submitLoading}
          checkoutPrepMessage={checkoutPrepMessage}
          bookLineSummary={bookLineSummary}
          quoteCurrency={quoteCurrency}
          shippingOptions={shippingOptions}
          selectedShippingOptionId={selectedShippingOptionId}
          onSelectShippingOptionId={setSelectedShippingOptionId}
          onBack={() => setActiveStep(1)}
          onContinue={handleStripeCheckout}
        />
      )}
    </MainLayout>
  )
}
