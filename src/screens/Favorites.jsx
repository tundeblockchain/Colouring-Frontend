import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Grid,
} from '@mui/material'
import { Favorite } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { ColoringPageCard } from '../components/ColoringPageCard'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useColoringPages, useToggleFavorite } from '../hooks/useColoringPages'

export const Favorites = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const { showToast } = useToast()
  const { data: coloringPages = [], isLoading } = useColoringPages(user?.uid)
  const toggleFavoriteMutation = useToggleFavorite()
  const canDownloadPdf = ['hobby', 'artist', 'business'].includes((userProfile?.plan || '').toLowerCase())

  const favorites = useMemo(
    () => coloringPages.filter((page) => page.isFavorite),
    [coloringPages]
  )

  const handleToggleFavorite = async (pageId) => {
    if (!user?.uid) return
    try {
      const result = await toggleFavoriteMutation.mutateAsync({
        pageId,
        userId: user.uid,
      })
      console.log('toggleFavorite onSuccess', result.data.isFavorite)
      showToast(result.data.isFavorite ? 'Added to favourites' : 'Removed from favourites')
    } catch {
      showToast('Something went wrong', 'error')
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
        Favourites
      </Typography>

      {favorites.length === 0 ? (
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
          <Favorite
            sx={{
              fontSize: 120,
              color: 'primary.main',
              marginBottom: 3,
            }}
          />
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            No favourites yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 4 }}>
            Click the heart icon on any coloring page in the Gallery to add it here
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/gallery')}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Browse Coloring Pages
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((page) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={page.id}>
              <ColoringPageCard
                page={page}
                onToggleFavorite={handleToggleFavorite}
                isFavoritePending={toggleFavoriteMutation.isPending}
                canDownloadPdf={canDownloadPdf}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </MainLayout>
  )
}
