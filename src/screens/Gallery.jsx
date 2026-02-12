import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  LinearProgress,
} from '@mui/material'
import { Folder as FolderIcon, Close, DriveFileMove } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { ColoringPageCard } from '../components/ColoringPageCard'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useColoringPages, useToggleFavorite, useMoveToFolder } from '../hooks/useColoringPages'
import { useFolders } from '../hooks/useFolders'

const DRAG_TYPE = 'application/x-coloring-page-id'
const DRAG_TYPE_IDS = 'application/x-coloring-page-ids'

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
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [moveMenuAnchor, setMoveMenuAnchor] = useState(null)

  const handleSelectPage = useCallback((pageId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) next.delete(pageId)
      else next.add(pageId)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

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

  const movePagesToFolder = async (pageIds, folderId) => {
    if (pageIds.length === 0 || !user?.uid) return
    setMoveMenuAnchor(null)
    try {
      for (const pageId of pageIds) {
        await moveToFolderMutation.mutateAsync({
          pageId,
          userId: user.uid,
          folderId: folderId || null,
        })
      }
      setSelectedIds(new Set())
      if (folderId) {
        const folder = folders.find((f) => f.id === folderId)
        showToast(
          pageIds.length > 1
            ? `${pageIds.length} pages added to "${folder?.name || 'folder'}"`
            : `Added to "${folder?.name || 'folder'}"`
        )
      } else {
        showToast(
          pageIds.length > 1 ? `${pageIds.length} pages removed from folder` : 'Removed from folder'
        )
      }
    } catch {
      showToast('Failed to move to folder', 'error')
    }
  }

  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault()
    setDragOverFolderId(null)
    let pageIds = []
    const idsData = e.dataTransfer.getData(DRAG_TYPE_IDS)
    const singleId = e.dataTransfer.getData(DRAG_TYPE)
    if (idsData) {
      try {
        pageIds = JSON.parse(idsData)
      } catch {
        pageIds = []
      }
    }
    if (pageIds.length === 0 && singleId) pageIds = [singleId]
    await movePagesToFolder(pageIds, folderId)
  }

  const handleMoveToFolderClick = (folderId) => {
    const pageIds = Array.from(selectedIds)
    movePagesToFolder(pageIds, folderId)
  }

  const handleCardDragStart = (e, page) => {
    const ids = selectedIds.has(page.id)
      ? Array.from(selectedIds)
      : [page.id]
    e.dataTransfer.setData(DRAG_TYPE_IDS, JSON.stringify(ids))
    e.dataTransfer.effectAllowed = 'move'
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
      {moveToFolderMutation.isPending && (
        <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1301 }} />
      )}
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, marginBottom: 3 }}>
        Gallery
      </Typography>

      {folders.length > 0 && (
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 1 }}>
            Select images, then drag them onto a folder to add them
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
              disabled={moveToFolderMutation.isPending}
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
                disabled={moveToFolderMutation.isPending}
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
        <>
          {selectedIds.size > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                marginBottom: 2,
                padding: 1.5,
                backgroundColor: 'action.selected',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {moveToFolderMutation.isPending ? 'Adding to folder...' : `${selectedIds.size} selected`}
              </Typography>
              {folders.length > 0 && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={moveToFolderMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DriveFileMove />}
                    onClick={(e) => setMoveMenuAnchor(e.currentTarget)}
                    disabled={moveToFolderMutation.isPending}
                  >
                    Add to folder
                  </Button>
                  <Menu
                    anchorEl={moveMenuAnchor}
                    open={Boolean(moveMenuAnchor)}
                    onClose={() => setMoveMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  >
                    <MenuItem onClick={() => handleMoveToFolderClick(null)}>
                      <ListItemIcon>
                        <FolderIcon fontSize="small" />
                      </ListItemIcon>
                      Uncategorized
                    </MenuItem>
                    {folders.map((folder) => (
                      <MenuItem key={folder.id} onClick={() => handleMoveToFolderClick(folder.id)}>
                        <ListItemIcon>
                          <FolderIcon fontSize="small" />
                        </ListItemIcon>
                        {folder.name}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
              <Button
                size="small"
                startIcon={<Close />}
                onClick={clearSelection}
                disabled={moveToFolderMutation.isPending}
              >
                Clear
              </Button>
            </Box>
          )}
          <Grid container spacing={3}>
            {filteredPages.map((page) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={page.id}>
                <ColoringPageCard
                  page={page}
                  onToggleFavorite={handleToggleFavorite}
                  isFavoritePending={toggleFavoriteMutation.isPending}
                  draggable={folders.length > 0 && !moveToFolderMutation.isPending}
                  canDownloadPdf={canDownloadPdf}
                  selectable={folders.length > 0}
                  selected={selectedIds.has(page.id)}
                  onSelect={() => handleSelectPage(page.id)}
                  onDragStart={
                    folders.length > 0 && !moveToFolderMutation.isPending
                      ? (ev) => handleCardDragStart(ev, page)
                      : undefined
                  }
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </MainLayout>
  )
}
