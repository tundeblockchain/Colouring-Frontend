import { Link } from 'react-router-dom'
import { Box, Container, Typography, Button } from '@mui/material'
import { Home } from '@mui/icons-material'

const SITE_NAME = 'Color Charm'

export const NotFound = () => (
  <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        py: 1.5,
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            component={Link}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'text.primary' }}
          >
            <Box component="img" src="/ColorCharm-logo.png" alt="Color Charm" sx={{ height: 32, width: 32 }} />
            <Typography variant="h6" fontWeight={700}>
              {SITE_NAME}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button component={Link} to="/pricing" color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Pricing
            </Button>
            <Button component={Link} to="/login" color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Log in
            </Button>
            <Button component={Link} to="/register" variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Sign up
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>

    <Box
      sx={{
        pt: 16,
        pb: 6,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h1"
          fontWeight={700}
          textAlign="center"
          sx={{ fontSize: { xs: '4rem', sm: '6rem' }, lineHeight: 1, color: 'text.secondary', mb: 1 }}
        >
          404
        </Typography>
        <Typography variant="h5" fontWeight={600} textAlign="center" gutterBottom>
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          The page you’re looking for doesn’t exist or has been moved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            startIcon={<Home />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Go home
          </Button>
          <Button component={Link} to="/dashboard" variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  </Box>
)
