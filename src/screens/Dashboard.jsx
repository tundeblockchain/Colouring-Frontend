import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
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
    image: '/text-prompts.png',
    path: '/create/text',
  },
  {
    id: 2,
    title: 'Word Art',
    description: 'Create coloring pages with words, names, and numbers!',
    image: '/word-art.png',
    path: '/create/word-art',
  },
  {
    id: 4,
    title: 'Photos',
    description: 'Turn your photos into coloring pages!',
    image: '/photos.png',
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
                <Box
                  sx={{
                    width: '100%',
                    height: 0,
                    paddingBottom: '66.67%', // 2/3 = 3:2 aspect ratio
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'action.hover',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                    }}
                  />
                </Box>
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
