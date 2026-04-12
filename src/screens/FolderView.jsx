import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Menu,
  MenuItem,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  TextField,
  CircularProgress,
  LinearProgress,
  Pagination,
  Tooltip,
} from '@mui/material'
import {
  ArrowBack,
  Download,
  Edit,
  Delete,
  Close,
  KeyboardArrowUp,
  KeyboardArrowDown,
  LocalShipping,
} from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { ColoringPageCard } from '../components/ColoringPageCard'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useFolders, useUpdateFolder, useDeleteFolder, useSetFolderPageOrder } from '../hooks/useFolders'
import { useToggleFavorite, useMoveToFolder } from '../hooks/useColoringPages'
import { useFolderPageList } from '../hooks/useFolderPageList'
import { useToast } from '../contexts/ToastContext'
import { downloadImage, downloadImagesAsPdf, downloadImagesAsZip } from '../utils/downloadImage'
import { MIN_PAGES_FOR_PHYSICAL_PRINT, selectPagesReadyForPrint } from '../constants/printOrder'

const DRAG_TYPE = 'application/x-coloring-page-id'
const FOLDER_PAGE_SIZE = 50

export const FolderView = () => {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const { showToast } = useToast()
  const canDownloadPdf = ['hobby', 'artist', 'business'].includes((userProfile?.plan || '').toLowerCase())

  const { data: folders = [], isLoading: foldersLoading } = useFolders(user?.uid)
  const { pagesInFolder, isLoading: pagesLoading } = useFolderPageList(user?.uid, folderId)
  const updateFolderMutation = useUpdateFolder()
  const deleteFolderMutation = useDeleteFolder()
  const setFolderPageOrderMutation = useSetFolderPageOrder()
  const toggleFavoriteMutation = useToggleFavorite()
  const moveToFolderMutation = useMoveToFolder()

  const folder = folders.find((f) => f.id === folderId)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [orderedPages, setOrderedPages] = useState([])
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [dragOverZone, setDragOverZone] = useState(null) // 'prev' | 'next' | null
  const [isMovingAcrossPages, setIsMovingAcrossPages] = useState(false)
  const [page, setPage] = useState(1)

  const isEmpty = pagesInFolder.length === 0

  useEffect(() => {
    if (pagesInFolder.length === 0) {
      setOrderedPages([])
      return
    }
    setOrderedPages((prev) => {
      const byId = Object.fromEntries(pagesInFolder.map((p) => [p.id, p]))
      const prevIds = prev.map((p) => p.id).filter((id) => byId[id])
      const newIds = pagesInFolder.map((p) => p.id).filter((id) => !prevIds.includes(id))
      const orderedIds = [...prevIds, ...newIds]
      return orderedIds.map((id) => byId[id]).filter(Boolean)
    })
  }, [folderId, pagesInFolder])

  const handleReorder = useCallback(
    async (draggedId, toIndex) => {
      const prevOrder = orderedPages.slice()
      const fromIndex = prevOrder.findIndex((p) => p.id === draggedId)
      if (fromIndex === -1 || fromIndex === toIndex) return
      const next = prevOrder.slice()
      const [removed] = next.splice(fromIndex, 1)
      const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
      next.splice(insertIndex, 0, removed)
      setOrderedPages(next)
      if (!user?.uid || !folderId) return
      try {
        await setFolderPageOrderMutation.mutateAsync({
          userId: user.uid,
          folderId,
          pageIds: next.map((p) => p.id),
        })
      } catch (err) {
        showToast('Failed to save order', 'error')
        setOrderedPages(prevOrder)
        throw err
      }
    },
    [orderedPages, user?.uid, folderId, setFolderPageOrderMutation, showToast]
  )

  const handleRemoveFromFolder = useCallback(
    async (pageId) => {
      if (!user?.uid) return
      const prevOrder = orderedPages.slice()
      setOrderedPages((prev) => prev.filter((p) => p.id !== pageId))
      try {
        await moveToFolderMutation.mutateAsync({
          pageId,
          userId: user.uid,
          folderId: null,
        })
        showToast('Removed from folder')
      } catch {
        setOrderedPages(prevOrder)
        showToast('Failed to remove from folder', 'error')
      }
    },
    [orderedPages, user?.uid, moveToFolderMutation, showToast]
  )

  const folderPageCount = Math.max(1, Math.ceil(orderedPages.length / FOLDER_PAGE_SIZE))
  const paginatedPages = useMemo(() => {
    const start = (page - 1) * FOLDER_PAGE_SIZE
    return orderedPages.slice(start, start + FOLDER_PAGE_SIZE)
  }, [orderedPages, page])

  useEffect(() => {
    if (page > folderPageCount) setPage(1)
  }, [page, folderPageCount])

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

  const handleBack = () => {
    navigate('/gallery')
  }

  const handleDownloadMenuOpen = (e) => setDownloadMenuAnchor(e.currentTarget)
  const handleDownloadMenuClose = () => setDownloadMenuAnchor(null)

  const handleDownloadAllAsPng = async () => {
    handleDownloadMenuClose()
    if (orderedPages.length === 0) return
    setDownloadLoading(true)
    setDownloadProgress(0)
    try {
      const items = orderedPages.map((p) => ({
        url: p.imageUrl || p.thumbnailUrl,
        title: p.title,
        id: p.id,
      }))
      await downloadImagesAsZip(items, folder?.name || 'coloring-pages', user?.uid, {
        onProgress: (percent) => setDownloadProgress(percent),
      })
      showToast(`Downloaded ${orderedPages.length} page(s) as ZIP`)
    } catch (error) {
      showToast(error.message || 'Failed to download images as ZIP', 'error')
    } finally {
      setDownloadLoading(false)
      setDownloadProgress(null)
    }
  }

  const handleDownloadAllAsPdf = async () => {
    handleDownloadMenuClose()
    if (orderedPages.length === 0) return
    if (!canDownloadPdf) {
      showToast('Download as PDF is available on Hobby, Artist and Business plans. Upgrade to unlock this feature.', 'info')
      return
    }
    setDownloadLoading(true)
    setDownloadProgress(0)
    try {
      const items = orderedPages.map((p) => ({
        url: p.imageUrl || p.thumbnailUrl,
        title: p.title,
        id: p.id,
      }))
      await downloadImagesAsPdf(items, folder?.name || 'coloring-pages', user?.uid, {
        onProgress: (percent) => setDownloadProgress(percent),
      })
      showToast(`Downloaded ${orderedPages.length} page(s) as PDF`)
    } catch (error) {
      showToast(error.message || 'Failed to download images as PDF', 'error')
    } finally {
      setDownloadLoading(false)
      setDownloadProgress(null)
    }
  }

  const handleOpenRename = () => {
    setRenameValue(folder?.name || '')
    setRenameOpen(true)
  }

  const handleCloseRename = () => {
    setRenameOpen(false)
    setRenameValue('')
  }

  const handleRename = async () => {
    if (!user?.uid || !folderId || !renameValue.trim()) return
    try {
      await updateFolderMutation.mutateAsync({
        userId: user.uid,
        folderId,
        name: renameValue.trim(),
      })
      showToast('Folder renamed')
      handleCloseRename()
    } catch {
      showToast('Failed to rename folder', 'error')
    }
  }

  const handleOpenDeleteConfirm = () => setDeleteConfirmOpen(true)
  const handleCloseDeleteConfirm = () => setDeleteConfirmOpen(false)

  const handleDelete = async () => {
    if (!user?.uid || !folderId) return
    try {
      await deleteFolderMutation.mutateAsync({ userId: user.uid, folderId })
      showToast('Folder deleted')
      handleCloseDeleteConfirm()
      navigate('/folders')
    } catch {
      showToast('Failed to delete folder', 'error')
    }
  }

  const printReadyPages = useMemo(() => selectPagesReadyForPrint(orderedPages), [orderedPages])
  const printReadyCount = printReadyPages.length
  const canOrderPhysicalPrint =
    !isEmpty && canDownloadPdf && printReadyCount >= MIN_PAGES_FOR_PHYSICAL_PRINT
  const orderPhysicalPrintTooltip = useMemo(() => {
    if (isEmpty || !canDownloadPdf) return ''
    if (printReadyCount >= MIN_PAGES_FOR_PHYSICAL_PRINT) return ''
    return `Physical printing needs at least ${MIN_PAGES_FOR_PHYSICAL_PRINT} finished pages in this folder (${printReadyCount} ready).`
  }, [isEmpty, canDownloadPdf, printReadyCount])

  const isLoading = foldersLoading
  const notFound = !isLoading && !folder

  if (notFound) {
    navigate('/folders', { replace: true })
    return null
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
      <Box sx={{ marginBottom: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={handleBack}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            marginBottom: 1,
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <ArrowBack fontSize="small" />
          Back to all coloring pages
        </Link>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {folder?.name}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Button
                variant="contained"
                startIcon={downloadLoading ? <CircularProgress size={20} color="inherit" /> : <Download />}
                onClick={handleDownloadMenuOpen}
                disabled={isEmpty || downloadLoading}
                sx={{
                  backgroundColor: isEmpty ? 'action.disabledBackground' : 'primary.main',
                  color: isEmpty ? 'action.disabled' : 'primary.contrastText',
                  '&:hover': isEmpty ? {} : { backgroundColor: 'primary.dark' },
                }}
              >
                {downloadLoading
                  ? `Downloading... ${downloadProgress != null ? `${downloadProgress}%` : ''}`
                  : `Download all (${orderedPages.length})`}
              </Button>
              {downloadLoading && downloadProgress != null && (
                <LinearProgress
                  variant="determinate"
                  value={downloadProgress}
                  sx={{ width: '100%', minWidth: 140, borderRadius: 1 }}
                />
              )}
            </Box>
            <Menu
              anchorEl={downloadMenuAnchor}
              open={Boolean(downloadMenuAnchor)}
              onClose={handleDownloadMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={handleDownloadAllAsPng}>Download all as PNG (ZIP)</MenuItem>
              <MenuItem
                onClick={handleDownloadAllAsPdf}
                disabled={!canDownloadPdf}
                sx={!canDownloadPdf ? { opacity: 0.7 } : {}}
              >
                Download all as PDF{!canDownloadPdf ? ' (Upgrade required)' : ''}
              </MenuItem>
            </Menu>
            <Tooltip
              title={orderPhysicalPrintTooltip}
              placement="top"
              arrow
              disableHoverListener={!orderPhysicalPrintTooltip}
              disableFocusListener={!orderPhysicalPrintTooltip}
              disableTouchListener={!orderPhysicalPrintTooltip}
            >
              <span>
                <Button
                  variant="outlined"
                  startIcon={<LocalShipping />}
                  disabled={!canOrderPhysicalPrint}
                  onClick={() =>
                    navigate(`/print-checkout/${encodeURIComponent(folderId)}`, {
                      state: {
                        returnPath: `/folders/${encodeURIComponent(folderId)}`,
                        orderedPageIds: orderedPages.map((p) => p.id).filter(Boolean),
                        lineItemTitle: folder?.name ? `${folder.name} (print)` : 'Folder (print)',
                      },
                    })
                  }
                  sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                >
                  Order physical copy
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleOpenRename}
              sx={{ borderColor: 'text.primary', color: 'text.primary' }}
            >
              Rename folder
            </Button>
            <Button
              variant="contained"
              startIcon={<Delete />}
              onClick={handleOpenDeleteConfirm}
              sx={{
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' },
              }}
            >
              Delete folder
            </Button>
          </Box>
        </Box>
      </Box>

      {pagesLoading ? (
        <Typography>Loading pages...</Typography>
      ) : isEmpty ? (
        <Card
          sx={{
            padding: 6,
            textAlign: 'center',
            backgroundColor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              this folder is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
              move pages here from your dashboard, or create new ones.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            >
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {isMovingAcrossPages && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                zIndex: 10,
                borderRadius: 2,
              }}
            >
              <CircularProgress size={48} />
              <Typography variant="body1" color="text.secondary">
                Moving image…
              </Typography>
            </Box>
          )}
          {folderPageCount > 1 && page > 1 && (
            <Box
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'move'
                setDragOverIndex(null)
                setDragOverZone('prev')
              }}
              onDragLeave={(e) => {
                e.stopPropagation()
                setDragOverZone(null)
              }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOverZone(null)
                const draggedId = e.dataTransfer.getData(DRAG_TYPE)
                if (draggedId) {
                  setIsMovingAcrossPages(true)
                  try {
                    const toIndex = (page - 1) * FOLDER_PAGE_SIZE - 1
                    await handleReorder(draggedId, toIndex)
                    showToast('Moved to previous page')
                    setPage(page - 1)
                  } catch {
                    // handleReorder already shows error toast
                  } finally {
                    setIsMovingAcrossPages(false)
                  }
                }
              }}
              sx={{
                py: 1.5,
                px: 2,
                mb: 2,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: dragOverZone === 'prev' ? 'primary.main' : 'divider',
                bgcolor: dragOverZone === 'prev' ? 'action.hover' : 'action.selected',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
            >
              <KeyboardArrowUp />
              <Typography variant="body2" color="text.secondary">
                Move to previous page
              </Typography>
            </Box>
          )}
          <Grid container spacing={3}>
            {paginatedPages.map((card, index) => {
              const globalIndex = (page - 1) * FOLDER_PAGE_SIZE + index
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
                  <Box
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverIndex(globalIndex)
                      setDragOverZone(null)
                    }}
                    onDragLeave={(e) => {
                      e.stopPropagation()
                      setDragOverIndex(null)
                      setDragOverZone(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOverIndex(null)
                      setDragOverZone(null)
                      const draggedId = e.dataTransfer.getData(DRAG_TYPE)
                      if (draggedId) handleReorder(draggedId, globalIndex)
                    }}
                    sx={{
                      outline: dragOverIndex === globalIndex ? '3px dashed' : 'none',
                      outlineColor: 'primary.main',
                      outlineOffset: dragOverIndex === globalIndex ? 4 : 0,
                      borderRadius: 2,
                      transition: 'outline 0.15s ease, outline-offset 0.15s ease, background-color 0.15s ease',
                      backgroundColor: dragOverIndex === globalIndex ? 'action.hover' : 'transparent',
                    }}
                  >
                    <ColoringPageCard
                      page={card}
                      onToggleFavorite={handleToggleFavorite}
                      isFavoritePending={toggleFavoriteMutation.isPending}
                      canDownloadPdf={canDownloadPdf}
                      userId={user?.uid}
                      draggable
                      onRemoveFromFolder={handleRemoveFromFolder}
                    />
                  </Box>
                </Grid>
              )
            })}
          </Grid>
          {folderPageCount > 1 && page < folderPageCount && (
            <Box
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'move'
                setDragOverIndex(null)
                setDragOverZone('next')
              }}
              onDragLeave={(e) => {
                e.stopPropagation()
                setDragOverZone(null)
              }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOverZone(null)
                const draggedId = e.dataTransfer.getData(DRAG_TYPE)
                if (draggedId) {
                  setIsMovingAcrossPages(true)
                  try {
                    const toIndex = page * FOLDER_PAGE_SIZE
                    await handleReorder(draggedId, toIndex)
                    showToast('Moved to next page')
                    setPage(page + 1)
                  } catch {
                    // handleReorder already shows error toast
                  } finally {
                    setIsMovingAcrossPages(false)
                  }
                }
              }}
              sx={{
                py: 1.5,
                px: 2,
                mt: 3,
                mb: 1,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: dragOverZone === 'next' ? 'primary.main' : 'divider',
                bgcolor: dragOverZone === 'next' ? 'action.hover' : 'action.selected',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Move to next page
              </Typography>
              <KeyboardArrowDown />
            </Box>
          )}
          {folderPageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={folderPageCount}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Box>
      )}

      <Dialog open={renameOpen} onClose={handleCloseRename} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Rename folder
          <IconButton aria-label="close" onClick={handleCloseRename} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder name"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleCloseRename}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRename}
            disabled={!renameValue.trim() || updateFolderMutation.isPending}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Delete folder?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will delete the folder &quot;{folder?.name}&quot;. Pages inside will not be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteFolderMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </MainLayout>
  )
}
