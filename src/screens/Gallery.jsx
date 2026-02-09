import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Typography, Grid, Chip } from '@mui/material'
import { Folder as FolderIcon } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { ColoringPageCard } from '../components/ColoringPageCard'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useColoringPages, useToggleFavorite, useMoveToFolder } from '../hooks/useColoringPages'
import { useFolders } from '../hooks/useFolders'

const DRAG_TYPE = 'application/x-coloring-page-id'

export const Gallery = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const { showToast } = useToast()
  const { data: coloringPages = [], isLoading } = useColoringPages(user?.uid)
  const { data: folders = [] } = useFolders(user?.uid)
  const canDownloadPdf = ['hobby', 'artist', 'business'].includes((userProfile?.plan || '').toLowerCase())
  const toggleFavoriteMutation = useToggleFavorite()
  const moveToFolderMutation = useMoveToFolder()
  const [searchParams] = useSearchParams()
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase()

  const filteredPages = useMemo(() => {
    if (!searchQuery) return coloringPages
    return coloringPages.filter(
      (page) =>
        page.title?.toLowerCase().includes(searchQuery) ||
        page.prompt?.toLowerCase().includes(searchQuery)
    )
  }, [coloringPages, searchQuery])

  const [dragOverFolderId, setDragOverFolderId] = useState(null)

  const handleToggleFavorite = async (pageId) => {
    if (!user?.uid) return
    try {
      const result = await toggleFavoriteMutation.mutateAsync({
        pageId,
        userId: user.uid,
      })
      showToast(result.data.isFavorite ? 'Added to favourites' : 'Removed from favourites')
    } catch {
      showToast('Something went wrong', 'error')
    }
  }

  const handleFolderDragOver = (e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  }

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null)
  }

  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault()
    setDragOverFolderId(null)
    const pageId = e.dataTransfer.getData(DRAG_TYPE)
    if (!pageId || !user?.uid) return
    try {
      await moveToFolderMutation.mutateAsync({
        pageId,
        userId: user.uid,
        folderId: folderId || null,
      })
      if (folderId) {
        const folder = folders.find((f) => f.id === folderId)
        showToast(`Added to "${folder?.name || 'folder'}"`)
      } else {
        showToast('Removed from folder')
      }
    } catch {
      showToast('Failed to move to folder', 'error')
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <Typography>Loading...</Typography>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, marginBottom: 3 }}>
        Gallery
      </Typography>

      {folders.length > 0 && (
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 1 }}>
            Drag images onto a folder to add them
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Chip
              label="Uncategorized"
              onClick={() => {}}
              onDragOver={(e) => handleFolderDragOver(e, '')}
              onDragLeave={handleFolderDragLeave}
              onDrop={(e) => handleFolderDrop(e, null)}
              sx={(theme) => ({
                backgroundColor:
                  dragOverFolderId === ''
                    ? 'primary.light'
                    : theme.palette.mode === 'dark'
                      ? theme.palette.grey[700]
                      : theme.palette.grey[200],
                color: theme.palette.text.primary,
                border: dragOverFolderId === '' ? '2px dashed primary.main' : '2px dashed transparent',
                cursor: 'default',
                '& .MuiChip-icon': { color: 'inherit' },
                '&:hover': {
                  backgroundColor:
                    dragOverFolderId === ''
                      ? 'primary.light'
                      : theme.palette.mode === 'dark'
                        ? theme.palette.grey[600]
                        : theme.palette.grey[300],
                },
              })}
            />
            {folders.map((folder) => (
              <Chip
                key={folder.id}
                icon={<FolderIcon />}
                label={`${folder.name} (${folder.coloringPageCount || 0})`}
                onClick={() => navigate(`/folders/${folder.id}`)}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
                sx={(theme) => ({
                  backgroundColor:
                    dragOverFolderId === folder.id
                      ? 'primary.light'
                      : theme.palette.mode === 'dark'
                        ? theme.palette.grey[700]
                        : theme.palette.grey[200],
                  color: theme.palette.text.primary,
                  border: dragOverFolderId === folder.id ? '2px dashed primary.main' : '2px dashed transparent',
                  cursor: 'pointer',
                  '& .MuiChip-icon': { color: 'inherit' },
                  '&:hover': {
                    backgroundColor:
                      dragOverFolderId === folder.id
                        ? 'primary.light'
                        : theme.palette.mode === 'dark'
                          ? theme.palette.grey[600]
                          : theme.palette.grey[300],
                  },
                })}
              />
            ))}
          </Box>
        </Box>
      )}

      {coloringPages.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            No coloring pages yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your first coloring page to get started!
          </Typography>
        </Box>
      ) : filteredPages.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            No results for &quot;{searchParams.get('q')}&quot;
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different search or clear the search to see all images.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredPages.map((page) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={page.id}>
              <ColoringPageCard
                page={page}
                onToggleFavorite={handleToggleFavorite}
                isFavoritePending={toggleFavoriteMutation.isPending}
                draggable={folders.length > 0}
                canDownloadPdf={canDownloadPdf}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </MainLayout>
  )
}
