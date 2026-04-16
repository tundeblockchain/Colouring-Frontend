import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { usePrintOrderDetail } from '../hooks/usePrintOrders'
import { formatPrintOrderMoney } from '../utils/printOrderMoney'
import {
  getPrintOrderDisplayOrderNumber,
  getPrintOrderErrorMessage,
  getPrintOrderShippingMethodLabel,
  getPrintOrderStatusLabel,
  isLikelyFailedPrintOrderStatus,
} from '../utils/printOrderDisplay'
import { formatPrintOrderShippingAddress } from '../utils/printOrderShippingAddress'

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
            <Chip label={getPrintOrderStatusLabel(order.status)} color={statusColor(order.status)} />
            <Typography variant="body2" color="text.secondary">
              {getPrintOrderDisplayOrderNumber(order) || '—'}
            </Typography>
          </Box>
          {(() => {
            const errMsg = getPrintOrderErrorMessage(order)
            if (!errMsg || !isLikelyFailedPrintOrderStatus(order.status)) return null
            return (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" component="div" sx={{ mb: 0.5 }}>
                  This order did not complete
                </Typography>
                <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {errMsg}
                </Typography>
              </Alert>
            )
          })()}
          <Divider sx={{ mb: 2 }} />
          <Field label="Amount" value={formatPrintOrderMoney(order.amountTotal, order.currency)} />
          <Field label="Book / folder ID" value={order.bookId} />
          <Field label="Orientation" value={order.bookOrientation} />
          <Field label="Interior pages" value={order.pageCount} />
          <Field label="Shipping method" value={getPrintOrderShippingMethodLabel(order) || '—'} />
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
          {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Shipping address
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                }}
              >
                {formatPrintOrderShippingAddress(order.shippingAddress) || '—'}
              </Typography>
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
