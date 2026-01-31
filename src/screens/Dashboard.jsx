import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
} from '@mui/material'
import { MainLayout } from '../components/Layout/MainLayout'
import { FloatingActionButton } from '../components/FloatingActionButton'

const featureCards = [
  {
    id: 1,
    title: 'Text prompts',
    description: 'Create coloring pages with text prompts',
    image: 'https://via.placeholder.com/400x300/64B5F6/ffffff?text=Text+Prompts',
    path: '/create/text',
  },
  // Word Art and Drawings hidden for now
  {
    id: 4,
    title: 'Photos',
    description: 'Turn your photos into coloring pages!',
    image: 'https://via.placeholder.com/400x300/64B5F6/ffffff?text=Photos',
    path: '/create/photo',
  },
]

export const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, marginBottom: 2 }}>
          Create a coloring page
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 4 }}>
          Click the rainbow button in the left sidebar to create a coloring page, or check out the{' '}
          <Box
            component="span"
            onClick={() => navigate('/ideas')}
            sx={{
              color: 'primary.main',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Idea Gallery
          </Box>
          {' '}for inspiration!
        </Typography>

        <Grid container spacing={3}>
          {featureCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={card.image}
                  alt={card.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, marginBottom: 2 }}>
                    {card.description}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(card.path)}
                    sx={{
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    Try it now!
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <FloatingActionButton />
    </MainLayout>
  )
}
