import { useMemo } from 'react'
import { Box, Button, Typography, Alert, CircularProgress, Paper, Chip } from '@mui/material'

export function PrintCheckoutPreviewStep(props) {
  const {
    readyPages,
    optionalPdfError,
    onDismissOptionalPdfError,
    optionalPdfLoading,
    onDownloadOptionalPreviewPdf,
    onNext,
  } = props

  /** Slider: front and back first (easy to spot), then interior in book order. */
  const sliderItems = useMemo(() => {
    const pages = readyPages
    if (!pages?.length) return []
    if (pages.length === 1) {
      return [{ key: `front-${pages[0].id ?? '0'}`, page: pages[0], label: 'Front cover', isCover: true }]
    }
    const front = pages[0]
    const back = pages[pages.length - 1]
    const interior = pages.slice(1, -1)
    return [
      { key: `front-${front.id ?? '0'}`, page: front, label: 'Front cover', isCover: true },
      { key: `back-${back.id ?? 'end'}`, page: back, label: 'Back cover', isCover: true },
      ...interior.map((page, i) => ({
        key: `interior-${page.id ?? i}`,
        page,
        label: `Interior (print page ${i + 2})`,
        isCover: false,
      })),
    ]
  }, [readyPages])

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Step 1 — Preview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        In your printed book, page order is: front cover, then interior pages, then back cover. This slider shows{' '}
        <strong>front cover</strong> and <strong>back cover</strong> first so they are easy to find, then interior
        pages in print order. Scroll horizontally to review all {readyPages.length} pages.
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
        {sliderItems.map(({ key, page: p, label, isCover }) => {
          const src = p.imageUrl || p.thumbnailUrl
          return (
            <Box
              key={key}
              sx={{
                flex: '0 0 auto',
                width: { xs: 200, sm: 220 },
                scrollSnapAlign: 'start',
              }}
            >
              <Chip
                size="small"
                label={label}
                sx={{ mb: 0.75 }}
                color={isCover ? 'primary' : 'default'}
                variant={isCover ? 'filled' : 'outlined'}
              />
              <Box
                component="img"
                src={src}
                alt={p.title || label}
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
      {optionalPdfError ? (
        <Alert severity="error" sx={{ mt: 2 }} onClose={onDismissOptionalPdfError}>
          {optionalPdfError}
        </Alert>
      ) : null}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onDownloadOptionalPreviewPdf}
          disabled={optionalPdfLoading}
          startIcon={optionalPdfLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {optionalPdfLoading ? 'Building PDF…' : 'Download preview as PDF (optional)'}
        </Button>
        <Typography variant="caption" color="text.secondary">
          PDF generation can take a minute for large books; you can continue without it.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" onClick={onNext}>
          Next: shipping details
        </Button>
      </Box>
    </Paper>
  )
}
