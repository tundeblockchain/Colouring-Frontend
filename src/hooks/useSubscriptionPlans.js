import { useQuery } from '@tanstack/react-query'
import { getSubscriptionPlans } from '../api/subscriptions'

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { success, plans, creditPacks } = await getSubscriptionPlans()
      return success
        ? { plans: plans || [], creditPacks: creditPacks || [] }
        : { plans: [], creditPacks: [] }
    },
    staleTime: 5 * 60 * 1000,
  })
}
