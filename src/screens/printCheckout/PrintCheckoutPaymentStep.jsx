import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'
import { formatMinorUnitsAsCurrency } from './utils'
import { getShippingOptionDetailLines } from './luluShippingTransit'

export function PrintCheckoutPaymentStep({
  submitError,
  onDismissSubmitError,
  submitLoading,
  checkoutPrepMessage,
  bookLineSummary,
  quoteCurrency,
  shippingOptions,
  selectedShippingOptionId,
  onSelectShippingOptionId,
  onBack,
  onContinue,
}) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Step 3 — Checkout
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your print files will be uploaded securely, then you&apos;ll be redirected to checkout to pay and confirm
        delivery details.
      </Typography>
      {bookLineSummary && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Book line from your printer quote: <strong>{bookLineSummary}</strong> ({quoteCurrency}, excluding shipping).
          Shipping is selected in checkout and charged via Stripe shipping options.
        </Typography>
      )}
      <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
        Shipping method
      </Typography>
      {shippingOptions?.length ? (
        <RadioGroup
          value={selectedShippingOptionId}
          onChange={(e) => onSelectShippingOptionId(e.target.value)}
          sx={{ mb: 2 }}
        >
          {shippingOptions.map((option) => {
            const amountLabel = formatMinorUnitsAsCurrency(option?.currency || quoteCurrency, option?.amountCents || 0)
            const title = option?.label || option?.id || 'Shipping'
            const detailLines = getShippingOptionDetailLines(option)
            return (
              <FormControlLabel
                key={option?.id || title}
                value={option?.id || ''}
                control={<Radio />}
                sx={{ alignItems: 'flex-start', mb: 0.5 }}
                label={
                  <Box>
                    <Typography component="span" variant="body2">
                      {title} ({amountLabel})
                    </Typography>
                    {detailLines.map((line, i) => (
                      <Typography
                        key={`${option?.id || 'opt'}-${i}`}
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.25 }}
                      >
                        {line}
                      </Typography>
                    ))}
                  </Box>
                }
              />
            )
          })}
        </RadioGroup>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No shipping options are available yet. Please go back and refresh the quote.
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissSubmitError}>
          {submitError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={onContinue}
          disabled={submitLoading || !selectedShippingOptionId}
          startIcon={submitLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
          sx={{
            maxWidth: '100%',
            minHeight: 48,
            whiteSpace: 'normal',
            textAlign: 'left',
            py: 1,
          }}
        >
          {submitLoading ? checkoutPrepMessage || 'Please wait…' : 'Continue to checkout'}
        </Button>
        <Button variant="outlined" onClick={onBack} color="inherit" disabled={submitLoading}>
          Back
        </Button>
      </Box>
    </Paper>
  )
}
