import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserProfile, updateUserProfile, deductCredits } from '../api/user'

export const useUser = (userId) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const result = await getUserProfile(userId)
      if (result.success) {
        return result.data
      }
      // If user not found (404), return null instead of throwing
      // This allows AuthHandler to detect new users
      if (result.status === 404) {
        return null
      }
      throw new Error(result.error || 'Failed to fetch user profile')
    },
    enabled: !!userId,
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not found)
      if (error?.message?.includes('404') || error?.status === 404) {
        return false
      }
      return failureCount < 2
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }) => updateUserProfile(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['user', variables.userId])
    },
  })
}

export const useDeductCredits = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, amount }) => deductCredits(userId, amount),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['user', variables.userId])
      return result
    },
  })
}
