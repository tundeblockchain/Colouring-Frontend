import { useQuery } from '@tanstack/react-query'
import { getCurrentUserIdToken } from '../api/auth'
import { getPrintOrder, listPrintOrders } from '../api/printOrders'

function normalizePrintOrder(rawOrder) {
  if (!rawOrder || typeof rawOrder !== 'object') return rawOrder
  return {
    ...rawOrder,
    tracking:
      rawOrder.tracking && typeof rawOrder.tracking === 'object'
        ? {
            trackingUrls: rawOrder.tracking.trackingUrls,
            carrierName: rawOrder.tracking.carrierName,
            trackingId: rawOrder.tracking.trackingId,
          }
        : null,
  }
}

export const usePrintOrdersList = (userId) => {
  return useQuery({
    queryKey: ['printOrders', userId],
    queryFn: async () => {
      const token = await getCurrentUserIdToken()
      if (!token) throw new Error('Not signed in')
      const res = await listPrintOrders(token, userId)
      console.log('[PrintOrders] listPrintOrders response:', res)
      console.log('[PrintOrders] listPrintOrders orders payload:', res?.data?.orders ?? res?.data)
      if (!res.success) throw new Error(res.error || 'Failed to load orders')
      const orders = res.data?.orders ?? []
      return Array.isArray(orders) ? orders.map(normalizePrintOrder) : []
    },
    enabled: !!userId,
  })
}

export const usePrintOrderDetail = (userId, orderId) => {
  return useQuery({
    queryKey: ['printOrder', userId, orderId],
    queryFn: async () => {
      const token = await getCurrentUserIdToken()
      if (!token) throw new Error('Not signed in')
      const res = await getPrintOrder(token, userId, orderId)
      console.log('[PrintOrders] getPrintOrder response:', res)
      console.log('[PrintOrders] getPrintOrder order payload:', res?.data?.order ?? res?.data)
      if (!res.success) throw new Error(res.error || 'Failed to load order')
      return normalizePrintOrder(res.data?.order ?? res.data)
    },
    enabled: !!userId && !!orderId,
  })
}
