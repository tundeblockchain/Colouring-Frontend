import { useQuery } from '@tanstack/react-query'
import { getSubscriptionPlans } from '../api/subscriptions'

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { success, plans } = await getSubscriptionPlans()
      return success ? plans : []
    },
    staleTime: 5 * 60 * 1000,
  })
}
