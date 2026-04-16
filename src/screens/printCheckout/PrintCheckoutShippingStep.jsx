import { Box, Button, TextField, MenuItem, Typography, Alert, CircularProgress, Paper } from '@mui/material'

export function PrintCheckoutShippingStep({
  quoteError,
  onDismissQuoteError,
  quoteLoading,
  countryMenuOptions,
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
  accountEmail,
  bookOrientation,
  setBookOrientation,
  onBack,
  onNext,
}) {
  return (
    <Paper sx={{ p: 3, maxWidth: 520, width: '100%', mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Step 2 — Shipping & print options
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Used for the printer&apos;s cost estimate. Checkout will also collect shipping and payment.
      </Typography>

      {quoteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissQuoteError}>
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
      {accountEmail ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Printer and order updates use your sign-in email: <strong>{accountEmail}</strong>
        </Typography>
      ) : (
        <Typography variant="caption" color="error" display="block" sx={{ mb: 2 }}>
          Your account has no email on file. Add one to your profile or use an email sign-in before continuing.
        </Typography>
      )}

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Button onClick={onBack} color="inherit" disabled={quoteLoading}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={quoteLoading || !accountEmail?.trim()}
          startIcon={quoteLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {quoteLoading ? 'Getting quote…' : 'Next: payment'}
        </Button>
      </Box>
    </Paper>
  )
}
