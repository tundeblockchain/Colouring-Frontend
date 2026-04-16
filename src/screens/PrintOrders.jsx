import { useEffect } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material'
import { ArrowBack, Refresh } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { usePrintOrdersList } from '../hooks/usePrintOrders'
import { useToast } from '../contexts/ToastContext'
import { formatPrintOrderMoney } from '../utils/printOrderMoney'
import {
  getPrintOrderDisplayOrderNumber,
  getPrintOrderErrorMessage,
  getPrintOrderShippingMethodLabel,
  getPrintOrderStatusLabel,
} from '../utils/printOrderDisplay'

function statusColor(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('fail') || s.includes('cancel')) return 'error'
  if (s.includes('ship') || s.includes('deliver')) return 'success'
  if (s.includes('paid') || s.includes('production') || s.includes('lulu')) return 'info'
  if (s.includes('pending')) return 'warning'
  return 'default'
}

export const PrintOrders = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: orders = [], isLoading, isFetching, isError, error, refetch } = usePrintOrdersList(user?.uid)
  const paidFlag = searchParams.get('paid')

  useEffect(() => {
    if (paidFlag !== '1' || !user?.uid) return
    showToast('Payment received. Your order status will update as printing progresses.')
    queryClient.invalidateQueries({ queryKey: ['printOrders', user.uid] })
    const next = new URLSearchParams(searchParams)
    next.delete('paid')
    setSearchParams(next, { replace: true })
  }, [paidFlag, user?.uid, showToast, queryClient, setSearchParams, searchParams])

  return (
    <MainLayout>
      <Button
        component={RouterLink}
        to="/dashboard"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
        color="inherit"
      >
        Back
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Print orders
        </Typography>
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={() => refetch()}
          disabled={!user?.uid || isFetching}
        >
          {isFetching && !isLoading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Orders placed through Stripe for physical books. Open an order for tracking and fulfillment details.
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Typography color="error">{error?.message || 'Could not load orders'}</Typography>
      )}
      {!isLoading && !isError && orders.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">You have no print orders yet.</Typography>
          <Button component={RouterLink} to="/create/book" variant="contained" sx={{ mt: 2 }}>
            Create a book
          </Button>
        </Paper>
      )}
      {!isLoading && !isError && orders.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Shipping</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((row) => (
                <TableRow key={row.orderId} hover>
                  <TableCell>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>{getPrintOrderDisplayOrderNumber(row) || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getPrintOrderStatusLabel(row.status)}
                      color={statusColor(row.status)}
                    />
                    {(() => {
                      const err = getPrintOrderErrorMessage(row)
                      if (!err) return null
                      const short = err.length > 100 ? `${err.slice(0, 100)}…` : err
                      return (
                        <Typography
                          variant="caption"
                          color="error"
                          component="div"
                          title={err}
                          sx={{ mt: 0.5, maxWidth: 280, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                          {short}
                        </Typography>
                      )
                    })()}
                  </TableCell>
                  <TableCell align="right">{formatPrintOrderMoney(row.amountTotal, row.currency)}</TableCell>
                  <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getPrintOrderShippingMethodLabel(row) || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button component={RouterLink} to={`/print-orders/${encodeURIComponent(row.orderId)}`} size="small">
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </MainLayout>
  )
}
