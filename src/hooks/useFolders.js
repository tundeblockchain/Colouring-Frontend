import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserFolders, createFolder, updateFolder, deleteFolder } from '../api/folders'

export const useFolders = (userId) => {
  return useQuery({
    queryKey: ['folders', userId],
    queryFn: async () => {
      const result = await getUserFolders(userId)
      if (result.success) {
        return result.data || []
      }
      throw new Error(result.error || 'Failed to fetch folders')
    },
    enabled: !!userId,
  })
}

export const useCreateFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, name, color }) => createFolder(userId, { name, color }),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['folders', variables.userId])
      return result
    },
  })
}

export const useUpdateFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, folderId, name, color }) => updateFolder(userId, folderId, { name, color }),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['folders', variables.userId])
      queryClient.invalidateQueries(['coloringPages', variables.userId])
      return result
    },
  })
}

export const useDeleteFolder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, folderId }) => deleteFolder(userId, folderId),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['folders', variables.userId])
      queryClient.invalidateQueries(['coloringPages', variables.userId])
      return result
    },
  })
}
