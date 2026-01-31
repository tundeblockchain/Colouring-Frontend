import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
} from '@mui/material'
import { CreateNewFolder, Close } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useFolders, useCreateFolder } from '../hooks/useFolders'
import { useToast } from '../contexts/ToastContext'

export const Folders = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: folders = [], isLoading } = useFolders(user?.uid)
  const createFolderMutation = useCreateFolder()

  const [modalOpen, setModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')

  const handleOpenModal = () => {
    setFolderName('')
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setFolderName('')
  }

  const handleCreateFolder = async () => {
    if (!user?.uid || !folderName.trim()) return
    try {
      await createFolderMutation.mutateAsync({
        userId: user.uid,
        name: folderName.trim(),
      })
      showToast('Folder created')
      handleCloseModal()
    } catch {
      showToast('Failed to create folder', 'error')
    }
  }

  const pageLabel = (count) => (count === 1 ? '1 page' : `${count} pages`)

  if (isLoading) {
    return (
      <MainLayout>
        <Typography>Loading...</Typography>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Folders
        </Typography>
        <Button
          variant="contained"
          startIcon={<CreateNewFolder />}
          onClick={handleOpenModal}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          Create new folder
        </Button>
      </Box>

      {folders.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            No folders yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
            Create a folder to organize your coloring pages
          </Typography>
          <Button
            variant="contained"
            startIcon={<CreateNewFolder />}
            onClick={handleOpenModal}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Create new folder
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {folders.map((folder) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
              <Card
                onClick={() => navigate(`/folders/${folder.id}`)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#FCE4EC',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    backgroundColor: folder.color || '#F8BBD9',
                    backgroundImage: folder.thumbnailUrl
                      ? `url(${folder.thumbnailUrl})`
                      : 'none',
                    backgroundSize: 'cover',
                  }}
                >
                  {!folder.thumbnailUrl && (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CreateNewFolder sx={{ fontSize: 64, color: 'rgba(255,255,255,0.8)' }} />
                    </Box>
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#C2185B' }}>
                    {folder.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pageLabel(folder.coloringPageCount)}
                  </Typography>
                  {folder.isPinned && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', marginTop: 0.5 }}>
                      pinned folder
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Create new folder
          <IconButton aria-label="close" onClick={handleCloseModal} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder name"
            placeholder="e.g. dinosaurs"
            fullWidth
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || createFolderMutation.isPending}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  )
}
