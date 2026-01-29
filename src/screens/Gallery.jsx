import { Box, Typography, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material'
import { Favorite, Download } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useColoringPages, useToggleFavorite } from '../hooks/useColoringPages'

export const Gallery = () => {
  const { user } = useAuth()
  const { data: coloringPages = [], isLoading } = useColoringPages(user?.uid)
  const toggleFavoriteMutation = useToggleFavorite()

  const handleToggleFavorite = async (pageId) => {
    if (!user?.uid) return
    await toggleFavoriteMutation.mutateAsync({
      pageId,
      userId: user.uid,
    })
  }

  const handleDownload = async (imageUrl, title) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title || 'coloring-page'}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
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
              <Card
                sx={{
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="300"
                  image={page.thumbnailUrl || page.imageUrl}
                  alt={page.title}
                  sx={{ objectFit: 'cover' }}
                />
                <IconButton
                  onClick={() => handleDownload(page.imageUrl || page.thumbnailUrl, page.title)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(6px)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                    },
                  }}
                >
                  <Download />
                </IconButton>
                <IconButton
                  onClick={() => handleToggleFavorite(page.id)}
                  disabled={toggleFavoriteMutation.isPending}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(6px)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                    },
                  }}
                >
                  <Favorite
                    sx={{
                      color: page.isFavorite ? 'primary.light' : 'white',
                    }}
                  />
                </IconButton>
                <CardContent>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {page.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </MainLayout>
  )
}
