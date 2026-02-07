import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { trackViewPricing } from '../utils/analytics'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Check as CheckIcon,
  EditOutlined,
  ChatBubbleOutlined,
  AbcOutlined,
  CardGiftcardOutlined,
  Palette,
  Star as StarIcon,
} from '@mui/icons-material'
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans'
import { useAuth } from '../hooks/useAuth'

// Track pricing page views for analytics
const useTrackPricingView = () => {
  useEffect(() => {
    trackViewPricing()
  }, [])
}

const formatPrice = (amountInCents, currency = 'usd') => {
  const value = amountInCents / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(value)
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`
  }
}

const FALLBACK_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get started creating colouring pages from text prompts.',
    credits: 250,
    prices: { month: { amount: 900, currency: 'usd' }, year: { amount: 9000, currency: 'usd' } },
    priceMonthly: 9,
    priceAnnual: 90,
    moreFeatures: ['Create from text, photos & word art', 'Download & print'],
    popular: false,
  },
  {
    id: 'hobby',
    name: 'Hobby',
    tagline: 'Perfect for personal projects, relaxation and classroom use.',
    credits: 500,
    prices: { month: { amount: 1800, currency: 'usd' }, year: { amount: 18000, currency: 'usd' } },
    priceMonthly: 18,
    priceAnnual: 180,
    moreFeatures: ['Everything in Starter', 'Higher limits', 'All creation methods'],
    popular: false,
  },
  {
    id: 'artist',
    name: 'Artist',
    tagline: 'Best for those looking to sell their creations.',
    credits: 1000,
    prices: { month: { amount: 3500, currency: 'usd' }, year: { amount: 35000, currency: 'usd' } },
    priceMonthly: 35,
    priceAnnual: 350,
    moreFeatures: ['Everything in Hobby', 'Commercial use', 'Sell your colouring pages'],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For businesses that need higher limits.',
    credits: 5000,
    prices: { month: { amount: 9900, currency: 'usd' }, year: { amount: 99000, currency: 'usd' } },
    priceMonthly: 99,
    priceAnnual: 990,
    moreFeatures: ['Everything in Artist', 'High volume', 'Priority support'],
    popular: false,
  },
]

// Normalize API plan shape (prices may be month/year with amount in cents)
const normalizePlan = (plan) => {
  if (!plan) return plan
  if (plan.prices?.month || plan.prices?.year) return plan
  return {
    ...plan,
    prices: {
      month: plan.priceMonthly != null ? { amount: plan.priceMonthly * 100, currency: 'usd' } : undefined,
      year: plan.priceAnnual != null ? { amount: plan.priceAnnual * 100, currency: 'usd' } : undefined,
    },
  }
}

const PLAN_PAGE_LIMIT = {
  starter: 100,
  hobby: 200,
  artist: 400,
  business: 2000,
}

const baseFeatures = [
  { text: 'Create colouring pages from text prompts', icon: ChatBubbleOutlined },
  { text: 'Create colouring pages with words, names, and numbers', icon: AbcOutlined },
  { text: 'Adjust colour, contrast, and brightness', icon: EditOutlined },
]

export const Pricing = () => {
  useTrackPricingView()
  const { user } = useAuth()
  const [interval, setInterval] = useState('month')
  const { data: plansData, isLoading: plansLoading, isError: plansError } = useSubscriptionPlans()
  const apiPlans = plansData?.plans ?? []

  const plans = useMemo(() => {
    if (apiPlans?.length) return apiPlans.map(normalizePlan)
    return FALLBACK_PLANS
  }, [apiPlans])

  const getPriceForPlan = (plan) => {
    const key = interval === 'year' ? 'year' : 'month'
    if (plan.prices?.[key]) {
      return { amount: plan.prices[key].amount, currency: plan.prices[key].currency || 'usd' }
    }
    const amountDollars = interval === 'year' ? plan.priceAnnual : plan.priceMonthly
    return { amount: (amountDollars ?? 0) * 100, currency: 'usd' }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Minimal header */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          py: 1.5,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                color: 'text.primary',
              }}
            >
              <Palette sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                Color Charm
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button component={Link} to="/login" color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                Log in
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Get started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" color="primary.main" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
            Pricing
          </Typography>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Choose the plan that&apos;s right for you
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
            Whether you&apos;re printing colouring sheets to keep the kids busy or running a business with high-volume needs, we&apos;ve got a plan for you.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={interval}
              exclusive
              onChange={(_, v) => v != null && setInterval(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { backgroundColor: 'primary.dark' },
                  },
                },
              }}
            >
              <ToggleButton value="month">Monthly</ToggleButton>
              <ToggleButton value="year">Yearly — save more</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {plansError && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'center' }}>
            Showing default pricing. Plans may vary by region.
          </Alert>
        )}

        {plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan) => {
              const priceInfo = getPriceForPlan(plan)
              const pageLimit = PLAN_PAGE_LIMIT[plan.id] ?? 100

              return (
                <Grid item xs={12} sm={6} md={3} key={plan.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: 2,
                      borderColor: plan.popular ? 'primary.main' : 'transparent',
                      position: 'relative',
                      boxShadow: plan.popular ? 4 : 1,
                    }}
                  >
                    {plan.popular && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'primary.main',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        <StarIcon fontSize="small" /> Popular
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1, pt: 2, pb: 3, '&:last-child': { paddingBottom: 3 } }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {plan.tagline}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {plan.credits?.toLocaleString() ?? 0} credits/month
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        (typically up to {pageLimit} colouring pages)
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                        {formatPrice(priceInfo.amount, priceInfo.currency)}
                        <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                          {' '}
                          /{interval === 'year' ? 'year' : 'month'}
                        </Typography>
                      </Typography>
                      {interval === 'month' && (plan.prices?.year ?? plan.priceAnnual != null) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          or{' '}
                          {plan.prices?.year
                            ? formatPrice(plan.prices.year.amount, plan.prices.year.currency)
                            : `$${plan.priceAnnual}`}{' '}
                          /year (save more)
                        </Typography>
                      )}
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        What&apos;s included:
                      </Typography>
                      <List dense disablePadding sx={{ mb: 2 }}>
                        <ListItem disablePadding sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${(plan.credits ?? 0).toLocaleString()} credits per month (typically up to ${pageLimit} pages)`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        {Array.isArray(plan.moreFeatures)
                          ? plan.moreFeatures.map((feature) => (
                              <ListItem key={feature} disablePadding sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }} />
                              </ListItem>
                            ))
                          : baseFeatures.map((f) => (
                              <ListItem key={f.text} disablePadding sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={f.text} primaryTypographyProps={{ variant: 'body2' }} />
                              </ListItem>
                            ))}
                        {!Array.isArray(plan.moreFeatures) && (
                          <ListItem disablePadding sx={{ py: 0.25 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <EditOutlined sx={{ color: 'warning.main', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary="Adjust colour, contrast, and brightness"
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        )}
                      </List>
                      <Button
                        fullWidth
                        variant={plan.popular ? 'contained' : 'outlined'}
                        component={Link}
                        to={user ? '/choose-plan' : '/register'}
                        state={user ? undefined : { from: '/choose-plan' }}
                        sx={{
                          mt: 'auto',
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {user ? 'Choose plan' : 'Get started'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        <Card sx={{ boxShadow: 1, mt: 4 }}>
          <CardContent sx={{ pt: 2, pb: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={600}>
                How subscriptions work
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Monthly allowances
            </Typography>
            <List dense disablePadding sx={{ maxWidth: 480, mx: 'auto', textAlign: 'left' }}>
              {[
                'Each plan includes a monthly allowance of colouring page generations',
                'Allowances reset at the start of each billing cycle',
                'Failed generations don\'t count against your allowance',
                'Bonus credits are included for experimenting and retries',
              ].map((text) => (
                <ListItem key={text} disablePadding sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {user && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={Link} to="/dashboard" sx={{ textTransform: 'none', fontWeight: 600 }}>
              ← Back to Dashboard
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  )
}
