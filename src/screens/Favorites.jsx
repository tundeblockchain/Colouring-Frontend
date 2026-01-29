import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
} from '@mui/material'
import { Favorite } from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'

export const Favorites = () => {
  const navigate = useNavigate()

  return (
    <MainLayout>
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
          No favorites yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 4 }}>
          Click the heart icon on any coloring page to add it to your favorites
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
    </MainLayout>
  )
}
