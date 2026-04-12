import { useMemo } from 'react'
import { useColoringPages } from './useColoringPages'

/**
 * Folder screen and print checkout use the same pipeline:
 * - Request coloring pages with `folderId` (so the API can narrow results if it supports it).
 * - Always filter client-side to `page.folderId === folderId` in case the API returns extra pages.
 */
export const useFolderPageList = (userId, folderId) => {
  const { data: fromApi = [], isLoading, isError, error } = useColoringPages(userId, {
    folderId: folderId || undefined,
  })

  const pagesInFolder = useMemo(() => {
    if (!folderId) return fromApi
    return fromApi.filter((p) => p.folderId === folderId)
  }, [fromApi, folderId])

  return { pagesInFolder, isLoading, isError, error }
}
