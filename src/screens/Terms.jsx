import { Link } from 'react-router-dom'
import { Box, Container, Typography, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Check as CheckIcon } from '@mui/icons-material'

const ctaGradient = 'linear-gradient(90deg, #42A5F5 0%, #66BB6A 100%)'

export const Terms = () => (
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
              Color Charm
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button component={Link} to="/pricing" color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Pricing
            </Button>
            <Button component={Link} to="/login" color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Log in
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600, background: ctaGradient, '&:hover': { opacity: 0.9, background: ctaGradient } }}
            >
              Get started
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>

    <Container maxWidth="md" sx={{ pt: 10, pb: 6, px: 2 }}>
      <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
        Terms of Service
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
        Review these terms before using Color Charm. Your use of our platform constitutes acceptance of these conditions.
      </Typography>
      <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ mb: 6 }}>
        Last updated: February 6, 2025
      </Typography>

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          1. Agreement to Terms
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          When you use Color Charm (&quot;the Platform&quot;), you agree to abide by these Terms of Service. These terms apply to your use of our AI-based colouring page creation tools and related services.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          2. Platform Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Color Charm offers an AI-driven platform that creates custom colouring pages from your prompts. Our tools produce printable content suitable for personal and educational use.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          3. Accounts and Registration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Some features require an account. You agree to:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Keep your login details secure and confidential',
            'Take responsibility for all activity under your account',
            'Supply correct information when signing up',
            'Update your details if they change',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          4. Acceptable Use
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Use Color Charm only for lawful purposes and in line with these terms. You must not:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Create content that is unlawful, harmful, threatening, abusive, or offensive',
            'Produce content that violates intellectual property rights',
            'Use the platform commercially without proper authorization',
            'Attempt to reverse engineer, hack, or impair the platform',
            'Make excessive requests that could affect platform performance',
            'Share your account credentials with others',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          5. Content and Intellectual Property
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          5.1 Your Content
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You retain ownership of the prompts and descriptions you submit. By using the platform, you grant Color Charm a non-exclusive licence to use your content solely for generating the colouring pages you request.
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          5.2 Generated Output
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Colouring pages created by our AI are tailored to your prompts. You may use them for personal, educational, and non-commercial purposes. Commercial use is permitted only for users with an Artist or Business subscription.
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          5.3 Platform Ownership
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The Color Charm platform, including its AI models, algorithms, design, and branding, is protected by intellectual property laws and remains the exclusive property of Color Charm.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          6. Privacy and Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We take privacy seriously. For details on how we collect, use, and protect your data, please review our{' '}
          <Box component={Link} to="/privacy" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
            Privacy Policy
          </Box>
          .
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          7. Payments and Subscriptions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Certain features require payment. By subscribing, you agree to:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Pay all fees for your chosen plan',
            'Provide accurate billing information',
            'Authorise recurring payments where applicable',
            'Accept that fees are generally non-refundable, except where law requires otherwise',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          8. Service Changes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          We aim for high availability but cannot guarantee uninterrupted access. We may:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Modify or discontinue services with reasonable notice',
            'Perform maintenance that temporarily affects availability',
            'Update these terms when necessary',
            'Adjust pricing with 30 days notice for current subscribers',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          9. Disclaimers and Liability
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          9.1 Service Disclaimer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Color Charm is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the platform will meet your specific needs or that generated content will always meet your expectations.
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          9.2 Limitation of Liability
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          To the fullest extent permitted by law, Color Charm is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          10. Account Termination
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          We may suspend or close your account if you breach these terms. You may also close your account by contacting us. Upon termination:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Your access to the platform will end',
            'You remain liable for any unpaid fees',
            'We may remove your account data after a reasonable period',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          11. Governing Law
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These terms are governed by the laws of the United States. Disputes related to these terms or your use of Color Charm will be resolved through binding arbitration, where permitted by law.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          12. Updates to Terms
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We may revise these terms from time to time. Changes will be posted on this page and the &quot;Last updated&quot; date will be adjusted. Continued use of Color Charm after changes means you accept the updated terms.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          13. Contact Us
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          For questions about these terms, please contact us:
        </Typography>
        <List dense disablePadding sx={{ pl: 2 }}>
          <ListItem disablePadding sx={{ py: 0.25 }}>
            <ListItemText
              primary="Email: help@colorcharm.app"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem disablePadding sx={{ py: 0.25 }}>
            <ListItemText
              primary={
                <>
                  Website:{' '}
                  <Box component={Link} to="/" sx={{ color: 'primary.main', textDecoration: 'underline', display: 'inline' }}>
                    colorcharm.app
                  </Box>
                </>
              }
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Box>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Box component={Link} to="/" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to home
        </Box>
      </Box>
    </Container>
  </Box>
)
