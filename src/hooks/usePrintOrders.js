import { useQuery } from '@tanstack/react-query'
import { getCurrentUserIdToken } from '../api/auth'
import { getPrintOrder, listPrintOrders } from '../api/printOrders'

export const usePrintOrdersList = (userId) => {
  return useQuery({
    queryKey: ['printOrders', userId],
    queryFn: async () => {
      const token = await getCurrentUserIdToken()
      if (!token) throw new Error('Not signed in')
      const res = await listPrintOrders(token, userId)
      if (!res.success) throw new Error(res.error || 'Failed to load orders')
      return res.data?.orders ?? []
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
      if (!res.success) throw new Error(res.error || 'Failed to load order')
      return res.data?.order ?? res.data
    },
    enabled: !!userId && !!orderId,
  })
}
