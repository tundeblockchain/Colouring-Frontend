import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useRegisterUser } from '../hooks/useRegisterUser'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Component that handles automatic user registration in the backend
 * after Firebase authentication
 */
export const AuthHandler = () => {
  const { user } = useAuth()
  const { data: userProfile, isLoading: userLoading, error: userError } = useUser(user?.uid)
  const registerUserMutation = useRegisterUser()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Only register if user is authenticated and not already registered
    // Check if user exists but profile is null (404) or if there's an error indicating user doesn't exist
    if (
      user &&
      !userLoading &&
      !userProfile &&
      (userError?.status === 404 || !userError) &&
      !registerUserMutation.isPending
    ) {
      // User doesn't exist in backend, register them
      const userData = {
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        avatarUrl: user.photoURL || null,
        plan: 'free',
      }

      registerUserMutation.mutate(
        {
          userId: user.uid,
          userData,
        },
        {
          onSuccess: () => {
            // Invalidate user query to refetch the newly registered user
            queryClient.invalidateQueries(['user', user.uid])
          },
          onError: (error) => {
            // If user already exists (409), that's okay - just refetch
            if (error.status === 409 || error.data?.error?.includes('already exists')) {
              queryClient.invalidateQueries(['user', user.uid])
            } else {
              console.error('Failed to register user:', error)
            }
          },
        }
      )
    }
  }, [user, userLoading, userProfile, userError, registerUserMutation, queryClient])

  return null // This component doesn't render anything
}
