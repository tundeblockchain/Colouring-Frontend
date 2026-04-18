import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserColoringPages,
  getPromptStylePresets,
  generateColoringPage,
  generateColoringBook,
  toggleFavorite,
  deleteColoringPage,
  moveColoringPageToFolder,
} from '../api/coloringPages'

export const usePromptStylePresets = () => {
  return useQuery({
    queryKey: ['promptStylePresets'],
    queryFn: async () => {
      const result = await getPromptStylePresets()
      if (result.success) {
        return result.data?.presets ?? []
      }
      return []
    },
    staleTime: 1000 * 60 * 30,
  })
}

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

export const useGenerateColoringBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params) => generateColoringBook(params),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['coloringPages', variables.userId])
      queryClient.invalidateQueries(['folders', variables.userId])
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
