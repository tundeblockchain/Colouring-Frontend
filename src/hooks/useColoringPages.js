import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserColoringPages,
  generateColoringPage,
  toggleFavorite,
  deleteColoringPage,
  moveColoringPageToFolder,
} from '../api/coloringPages'

export const useColoringPages = (userId, filters = {}) => {
  return useQuery({
    queryKey: ['coloringPages', userId, filters],
    queryFn: async () => {
      const result = await getUserColoringPages(userId, filters)
      if (result.success) {
        return result.data || []
      }
      throw new Error(result.error || 'Failed to fetch coloring pages')
    },
    enabled: !!userId,
  })
}

export const useGenerateColoringPage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params) => generateColoringPage(params),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['coloringPages', variables.userId])
      queryClient.invalidateQueries(['user', variables.userId])
      return result
    },
  })
}

export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, userId }) => toggleFavorite(pageId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['coloringPages'])
    },
  })
}

export const useMoveToFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, userId, folderId }) =>
      moveColoringPageToFolder(pageId, userId, folderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['coloringPages'])
      queryClient.invalidateQueries(['folders', variables.userId])
    },
  })
}

export const useDeleteColoringPage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, userId }) => deleteColoringPage(pageId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['coloringPages'])
    },
  })
}
