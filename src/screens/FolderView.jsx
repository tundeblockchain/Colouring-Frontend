import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
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
} from '@mui/material'
import { ArrowBack, Download, Edit, Delete, Close } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { ColoringPageCard } from '../components/ColoringPageCard'
import { useAuth } from '../hooks/useAuth'
import { useFolders, useUpdateFolder, useDeleteFolder } from '../hooks/useFolders'
import { useColoringPages, useToggleFavorite } from '../hooks/useColoringPages'
import { useToast } from '../contexts/ToastContext'
import { downloadImage } from '../utils/downloadImage'

export const FolderView = () => {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const { data: folders = [], isLoading: foldersLoading } = useFolders(user?.uid)
  const { data: allPages = [], isLoading: pagesLoading } = useColoringPages(user?.uid, {
    folderId: folderId || undefined,
  })
  const pagesInFolder = folderId
    ? allPages.filter((p) => p.folderId === folderId)
    : allPages
  const updateFolderMutation = useUpdateFolder()
  const deleteFolderMutation = useDeleteFolder()
  const toggleFavoriteMutation = useToggleFavorite()

  const folder = folders.find((f) => f.id === folderId)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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

  const handleDownloadAll = async () => {
    if (pagesInFolder.length === 0) return
    for (let i = 0; i < pagesInFolder.length; i++) {
      const page = pagesInFolder[i]
      await downloadImage(page.imageUrl || page.thumbnailUrl, page.title)
    }
    showToast(`Downloaded ${pagesInFolder.length} page(s)`)
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

  const isEmpty = pagesInFolder.length === 0

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
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownloadAll}
              disabled={isEmpty}
              sx={{
                backgroundColor: isEmpty ? 'action.disabledBackground' : 'primary.main',
                color: isEmpty ? 'action.disabled' : 'primary.contrastText',
                '&:hover': isEmpty ? {} : { backgroundColor: 'primary.dark' },
              }}
            >
              Download all ({pagesInFolder.length})
            </Button>
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
          <CardContent>
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
        <Grid container spacing={3}>
          {pagesInFolder.map((page) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={page.id}>
              <ColoringPageCard
                page={page}
                onToggleFavorite={handleToggleFavorite}
                isFavoritePending={toggleFavoriteMutation.isPending}
              />
            </Grid>
          ))}
        </Grid>
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
