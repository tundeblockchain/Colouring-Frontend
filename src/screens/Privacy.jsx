import { Link } from 'react-router-dom'
import { Box, Container, Typography, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Home as HomeIcon, Check as CheckIcon } from '@mui/icons-material'

const ctaGradient = 'linear-gradient(90deg, #42A5F5 0%, #66BB6A 100%)'

export const Privacy = () => (
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 4,
          color: 'text.secondary',
          fontSize: '0.875rem',
        }}
      >
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
          <HomeIcon sx={{ fontSize: 18 }} />
          <span>Home</span>
        </Box>
        <Typography component="span" sx={{ color: 'text.disabled' }}> &gt; </Typography>
        <Typography component="span" color="text.primary">Privacy Policy</Typography>
      </Box>

      <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
        Privacy Policy
      </Typography>
      <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ mb: 6 }}>
        Last updated: February 6, 2025
      </Typography>

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Color Charm is committed to protecting your privacy. This policy describes how we gather, use, and safeguard your personal information when you use our platform.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          Information We Collect
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          Account Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          When you create an account, we collect:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Your email address',
            'A securely stored password',
            'Profile photo (if you choose to add one)',
            'Subscription status and payment details via Stripe',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          Usage Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          We may gather data about how you interact with our platform, including:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Pages and features you access',
            'Colouring pages you create and save',
            'How you use different parts of the platform',
            'Payment and subscription history',
            'IP address and basic device information',
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
          Analytics and Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Color Charm may use the following tools:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Google Analytics for understanding how our platform is used',
            'Google Tag Manager for managing tracking scripts',
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
          Image Processing and AI
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          When you submit images or prompts for colouring page generation:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Images are held temporarily on secure servers only during processing',
            'Original uploads are removed automatically after generation completes',
            'We use OpenAI and Replicate APIs for AI processing; each provider has its own data usage policy',
            'OpenAI and Replicate do not train their models on your images',
            'Providers may retain content for up to 30 days for abuse prevention, then delete it',
            'Your images and colouring pages stay private to your account and are not shared publicly',
            'We do not share your original images or generated pages with third parties',
            'You may request deletion of your content at any time by contacting us',
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
          How Your Data is Used
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          Essential Operations
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Managing your account',
            'Processing payments and subscriptions',
            'Storing your colouring pages',
            'Sending important service updates',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          Service Improvement
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Analysing usage patterns to improve the platform',
            'Identifying and fixing issues',
            'Enhancing features and performance',
            'Optimising how we present our service',
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
          Data Sharing
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          Third-Party Services
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          We share only the data necessary to operate our platform with:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Amazon Web Services (AWS) for hosting and storage',
            'Google Firebase for authentication',
            'Google Analytics for usage insights',
            'Stripe for payment processing',
          ].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>
          Legal Requirements
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          We may disclose information when:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Required by applicable law',
            'Necessary to protect our rights or safety',
            'Part of a merger, acquisition, or sale of assets',
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
          Your Rights
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          You have the right to:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Request access to your personal data',
            'Correct or update your information',
            'Request deletion of your account',
            'Opt out of promotional emails',
            'Export your colouring pages',
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
          Security Measures
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Encryption of data in transit and at rest',
            'Secure hosting on AWS infrastructure',
            'Regular security updates and patches',
            'Restricted access to personal data',
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
          Cookies
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Color Charm uses cookies for:
        </Typography>
        <List dense disablePadding sx={{ mb: 2, pl: 2 }}>
          {[
            'Keeping you signed in',
            'Storing your preferences',
            'Analytics to improve the platform',
            'Supporting advertising and marketing where applicable',
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
          Children&apos;s Privacy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Color Charm is intended for users aged 13 and over. Users under 13 should have parental or guardian consent before using the platform.
        </Typography>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          Contact Us
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          For questions about this Privacy Policy or how we handle your data, contact us at:{' '}
          <Box
            component="a"
            href="mailto:help@colorcharm.app"
            sx={{ color: 'primary.main', textDecoration: 'underline' }}
          >
            help@colorcharm.app
          </Box>
        </Typography>
      </Box>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Box component={Link} to="/" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to home
        </Box>
      </Box>
    </Container>
  </Box>
)
