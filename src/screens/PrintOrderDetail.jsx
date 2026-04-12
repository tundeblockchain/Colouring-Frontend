import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { usePrintOrderDetail } from '../hooks/usePrintOrders'

function formatMoney(amount, currency) {
  const c = (currency || 'usd').toLowerCase()
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(c === 'usd' ? n / 100 : n)
  } catch {
    return `${n} ${currency || ''}`
  }
}

function statusColor(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('fail') || s.includes('cancel')) return 'error'
  if (s.includes('ship') || s.includes('deliver')) return 'success'
  if (s.includes('paid') || s.includes('production') || s.includes('lulu')) return 'info'
  if (s.includes('pending')) return 'warning'
  return 'default'
}

function Field({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value == null || value === '' ? '—' : String(value)}
      </Typography>
    </Box>
  )
}

export const PrintOrderDetail = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const { data: order, isLoading, isError, error } = usePrintOrderDetail(user?.uid, orderId)

  return (
    <MainLayout>
      <Button component={RouterLink} to="/print-orders" startIcon={<ArrowBack />} sx={{ mb: 2 }} color="inherit">
        All print orders
      </Button>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
        Order details
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Typography color="error">{error?.message || 'Could not load this order'}</Typography>
      )}
      {!isLoading && !isError && order && (
        <Paper sx={{ p: 3, maxWidth: 720 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={order.status || 'unknown'} color={statusColor(order.status)} />
            <Typography variant="body2" color="text.secondary">
              {order.orderId}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Field label="Amount" value={formatMoney(order.amountTotal, order.currency)} />
          <Field label="Book / folder ID" value={order.bookId} />
          <Field label="Orientation" value={order.bookOrientation} />
          <Field label="Interior pages" value={order.pageCount} />
          <Field label="Shipping level" value={order.shippingLevel} />
          <Field label="Pod package" value={order.podPackageId} />
          <Field
            label="Created"
            value={
              order.createdAt
                ? new Date(order.createdAt).toLocaleString(undefined, {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })
                : '—'
            }
          />
          <Field
            label="Updated"
            value={
              order.updatedAt
                ? new Date(order.updatedAt).toLocaleString(undefined, {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })
                : '—'
            }
          />
          <Field label="Lulu print job ID" value={order.luluPrintJobId ?? '—'} />
          <Field label="Last Lulu status" value={order.lastLuluStatus} />
          <Field label="Stripe session" value={order.stripeCheckoutSessionId} />
          <Field label="Stripe payment intent" value={order.stripePaymentIntentId} />
          {order.lastError && <Field label="Last error" value={order.lastError} />}
          {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Shipping address
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  fontSize: 12,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(order.shippingAddress, null, 2)}
              </Box>
            </Box>
          )}
          {order.tracking && Object.keys(order.tracking).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tracking
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  fontSize: 12,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(order.tracking, null, 2)}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </MainLayout>
  )
}
