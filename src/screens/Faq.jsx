import { Link } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { faqItems } from '../content/faq'

const SITE_NAME = 'Color Charm'

export const Faq = () => (
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

    <Box sx={{ pt: 10, pb: 6, px: 2 }}>
      <Container maxWidth="sm">
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
          Frequently asked questions
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Everything you need to know about {SITE_NAME} and creating amazing colouring pages.
        </Typography>
        {faqItems.map((item, idx) => (
          <Accordion
            key={idx}
            sx={{
              '&:before': { display: 'none' },
              borderRadius: 2,
              mb: 1,
              overflow: 'hidden',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
              sx={{ '& .MuiAccordionSummary-content': { py: 1.5 } }}
            >
              <Typography fontWeight={500}>{item.q}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  </Box>
)
