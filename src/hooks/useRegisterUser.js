import { useMutation } from '@tanstack/react-query'
import { registerUser as registerUserAPI } from '../api/user'

/**
 * Hook to register a user in the backend after Firebase authentication
 */
export const useRegisterUser = () => {
  return useMutation({
    mutationFn: ({ userId, userData }) => registerUserAPI(userId, userData),
  })
}
