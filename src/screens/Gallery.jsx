import { Box, Typography, Grid } from '@mui/material'
import { MainLayout } from '../components/Layout/MainLayout'
import { ColoringPageCard } from '../components/ColoringPageCard'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useColoringPages, useToggleFavorite } from '../hooks/useColoringPages'

export const Gallery = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data: coloringPages = [], isLoading } = useColoringPages(user?.uid)
  const toggleFavoriteMutation = useToggleFavorite()

  const handleToggleFavorite = async (pageId) => {
    if (!user?.uid) return
    try {
      const result = await toggleFavoriteMutation.mutateAsync({
        pageId,
        userId: user.uid,
      })
      console.log('toggleFavorite onSuccess', result)
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
        Gallery
      </Typography>

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
      ) : (
        <Grid container spacing={3}>
          {coloringPages.map((page) => (
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
    </MainLayout>
  )
}
