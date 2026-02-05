import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  CircularProgress,
} from '@mui/material'
import {
  Check as CheckIcon,
  EditOutlined,
  ChatBubbleOutlined,
  AbcOutlined,
  CardGiftcardOutlined,
  CreditCardOutlined,
  Star as StarIcon,
} from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans'
import { useToast } from '../contexts/ToastContext'
import { createCheckoutSession } from '../api/subscriptions'

/** Format Stripe price (amount in cents) with currency */
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
    tagline: 'Get started creating coloring pages from text prompts.',
    credits: 250,
    priceMonthly: 9,
    priceAnnual: 90,
    moreFeatures: 2,
    popular: false,
  },
  {
    id: 'hobby',
    name: 'Hobby',
    tagline: 'Perfect for personal projects, relaxation and classroom use.',
    credits: 500,
    priceMonthly: 18,
    priceAnnual: 180,
    moreFeatures: 5,
    popular: false,
  },
  {
    id: 'artist',
    name: 'Artist',
    tagline: 'Best for those looking to sell their creations.',
    credits: 1000,
    priceMonthly: 35,
    priceAnnual: 350,
    moreFeatures: 7,
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For businesses that need higher limits.',
    credits: 5000,
    priceMonthly: 99,
    priceAnnual: 990,
    moreFeatures: 7,
    popular: false,
  },
]

const PLAN_PAGE_LIMIT = {
  starter: 100,
  hobby: 200,
  artist: 400,
  business: 2000,
}

const baseFeatures = [
  { text: 'Create coloring pages from text prompts', icon: ChatBubbleOutlined },
  { text: 'Create coloring pages with words, names, and numbers', icon: AbcOutlined },
  { text: 'Adjust color, contrast, and brightness', icon: EditOutlined },
]

export const ChoosePlan = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans()
  const apiPlans = plansData?.plans ?? []
  const { showToast } = useToast()
  const [interval, setInterval] = useState('month')
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const plans = useMemo(() => {
    if (apiPlans?.length) return apiPlans
    return FALLBACK_PLANS
  }, [apiPlans])

  const currentPlanId = userProfile?.plan === 'free' ? null : (userProfile?.plan || '').toLowerCase()

  const getPriceForPlan = (plan) => {
    const key = interval === 'year' ? 'year' : 'month'
    if (plan.prices?.[key]) {
      return { amount: plan.prices[key].amount, currency: plan.prices[key].currency || 'usd' }
    }
    const amountDollars = interval === 'year' ? plan.priceAnnual : plan.priceMonthly
    return { amount: (amountDollars ?? 0) * 100, currency: 'usd' }
  }

  const handleProceedToPayment = async () => {
    if (!selectedPlanId || !user?.uid) {
      showToast('Please select a plan.', 'error')
      return
    }
    setCheckoutLoading(true)
    const { success, url, error } = await createCheckoutSession(user.uid, {
      plan: selectedPlanId,
      interval,
    })
    setCheckoutLoading(false)
    if (success && url) {
      window.location.href = url
    } else {
      showToast(error || 'Could not start checkout.', 'error')
    }
  }

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box
          component={Link}
          to="/dashboard"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'primary.main',
            textDecoration: 'none',
            mb: 2,
            fontSize: '0.875rem',
            '&:hover': { textDecoration: 'underline', color: 'primary.light' },
          }}
        >
          ← Back to Dashboard
        </Box>

        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, marginBottom: 1 }}>
          Choose Your Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 4 }}>
          Select the subscription plan that best fits your coloring page creation needs. Upgrade anytime as you grow.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={600}>
                Choose a Subscription Plan
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Select the plan that best fits your needs.
            </Typography>
          </Box>
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
            <ToggleButton value="year">Annual</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id
            const isCurrent = currentPlanId === plan.id
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
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    position: 'relative',
                    boxShadow: isSelected ? 3 : 1,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.04)',
                      boxShadow: 6,
                    },
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
                        color: 'secondary.main',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      <StarIcon fontSize="small" /> Popular
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 3, '&:last-child': { paddingBottom: 3 } }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.tagline}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {plan.credits.toLocaleString()} credits/mo
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      (typically up to {pageLimit} coloring pages)
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      {formatPrice(priceInfo.amount, priceInfo.currency)}
                      {interval === 'year' ? '/yr' : '/mo'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      What&apos;s included:
                    </Typography>
                    <List dense disablePadding sx={{ mb: 2 }}>
                      <ListItem disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${plan.credits.toLocaleString()} credits per month (typically up to ${pageLimit} coloring pages)`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      {Array.isArray(plan.moreFeatures)
                        ? plan.moreFeatures.map((feature) => (
                            <ListItem key={feature} disablePadding sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={feature}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))
                        : (
                          <>
                            {baseFeatures.map((f) => (
                              <ListItem key={f.text} disablePadding sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={f.text}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                            <ListItem disablePadding sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <EditOutlined sx={{ color: 'warning.main', fontSize: 20 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary="Adjust color, contrast, and brightness"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                            <ListItem disablePadding sx={{ py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 32 }} />
                              <ListItemText
                                primary={`+ ${plan.moreFeatures ?? 0} more features`}
                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                              />
                            </ListItem>
                          </>
                        )}
                    </List>
                    <Button
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                      disabled={isCurrent}
                      startIcon={isSelected ? <CheckIcon /> : <CreditCardOutlined />}
                      sx={{
                        mt: 'auto',
                        ...(isSelected
                          ? {
                              backgroundColor: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.dark' },
                            }
                          : {
                              borderColor: 'divider',
                              color: 'text.primary',
                            }),
                      }}
                    >
                      {isCurrent ? 'Current plan' : isSelected ? 'Selected' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'action.hover',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Ready to subscribe? You&apos;ll be redirected to Stripe for secure payment.
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={!selectedPlanId || checkoutLoading}
            onClick={handleProceedToPayment}
            startIcon={<CreditCardOutlined />}
            sx={{
              backgroundColor: 'secondary.main',
              '&:hover': { backgroundColor: 'secondary.dark' },
            }}
          >
            {checkoutLoading ? 'Redirecting…' : 'Proceed to Payment'}
          </Button>
        </Box>

        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={600}>
                How Subscriptions Work
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Monthly Allowances
            </Typography>
            <List dense disablePadding>
              {[
                'Each plan includes a monthly allowance of coloring pages',
                'Allowances reset at the beginning of each billing cycle',
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
      </Box>
    </MainLayout>
  )
}
