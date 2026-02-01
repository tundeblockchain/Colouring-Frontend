import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  CircularProgress,
} from '@mui/material'
import {
  Check as CheckIcon,
  CardGiftcardOutlined,
  CreditCardOutlined,
  Star as StarIcon,
  Bolt as BoltIcon,
  Inventory2Outlined,
  Link as LinkIcon,
} from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans'
import { useToast } from '../contexts/ToastContext'
import { createCreditPackCheckout } from '../api/subscriptions'

const CREDIT_PACK_IDS = ['starter', 'creator', 'pro']

const PACK_DISPLAY_DEFAULTS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for occasional creators',
    credits: 500,
    price: 2500,
    originalPrice: 3000,
    savings: 500,
    costPerCredit: 5.0,
    expirationMonths: 6,
    badge: null,
    badgeIcon: null,
    badgeColor: null,
  },
  creator: {
    id: 'creator',
    name: 'Creator Pack',
    description: 'Most popular choice for regular creators',
    credits: 1000,
    price: 4500,
    originalPrice: 6000,
    savings: 1500,
    costPerCredit: 4.5,
    expirationMonths: 6,
    badge: 'Most Popular',
    badgeIcon: StarIcon,
    badgeColor: 'secondary.main',
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    description: 'Best value for professional creators',
    credits: 2000,
    price: 8000,
    originalPrice: 12000,
    savings: 4000,
    costPerCredit: 4.0,
    expirationMonths: 6,
    badge: 'Best Value',
    badgeIcon: BoltIcon,
    badgeColor: 'success.main',
  },
}

const formatPrice = (amountInCents, currency = 'usd') => {
  const value = amountInCents / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(value)
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`
  }
}

/** Build display pack from API pack + defaults; price amount in smallest currency unit (e.g. cents) */
function mergePack(apiPack, defaults) {
  if (!defaults) return null
  const priceAmount = apiPack?.price?.amount ?? defaults.price
  const credits = apiPack?.credits ?? defaults.credits
  const currency = (apiPack?.price?.currency || 'usd').toLowerCase()
  const originalPrice = apiPack?.originalPrice ?? defaults.originalPrice
  const savings = (originalPrice ?? priceAmount) - priceAmount
  const costPerCredit = credits > 0 ? Math.round((priceAmount / credits) * 10) / 10 : defaults.costPerCredit
  const description = apiPack?.description ?? apiPack?.tagline ?? defaults.description
  return {
    id: apiPack?.id ?? defaults.id,
    name: apiPack?.name ?? defaults.name,
    description,
    credits,
    price: priceAmount,
    currency,
    originalPrice: originalPrice ?? defaults.originalPrice,
    savings: savings > 0 ? savings : defaults.savings,
    costPerCredit,
    expirationMonths: apiPack?.expirationMonths ?? defaults.expirationMonths,
    badge: defaults.badge,
    badgeIcon: defaults.badgeIcon,
    badgeColor: defaults.badgeColor,
  }
}

export const AddOneTimeCredits = () => {
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const { data: plansData, isLoading: packsLoading } = useSubscriptionPlans()
  const { showToast } = useToast()
  const [selectedPackId, setSelectedPackId] = useState('starter')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const creditPacksFromApi = plansData?.creditPacks ?? []
  const creditPacks = useMemo(() => {
    const byId = Object.fromEntries((creditPacksFromApi || []).map((p) => [p.id, p]))
    return CREDIT_PACK_IDS.map((id) => mergePack(byId[id], PACK_DISPLAY_DEFAULTS[id])).filter(Boolean)
  }, [creditPacksFromApi])

  const creditsTotal = userProfile?.credits ?? 0
  const planCredits = userProfile?.planCredits ?? 0
  const purchasedCredits = userProfile?.purchasedCredits ?? 0
  const rolloverCredits = userProfile?.rolloverCredits ?? 0

  const handleProceedToPayment = async () => {
    if (!selectedPackId || !user?.uid) {
      showToast('Please select a credit pack.', 'error')
      return
    }
    setCheckoutLoading(true)
    const { success, url, error } = await createCreditPackCheckout(user.uid, { packId: selectedPackId })
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
          Add One-Time Credits
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 4 }}>
          Not ready to upgrade your subscription? Purchase credit packs to create more amazing coloring pages.
        </Typography>

        {/* Current Balance */}
        <Card sx={{ boxShadow: 1, mb: 3 }}>
          <CardContent sx={{ pt: 2, pb: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <LinkIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              <Typography variant="h6" fontWeight={600}>
                Current Balance
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your available credits for generating coloring pages
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={600}>
                    {creditsTotal}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Available
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={600} color="secondary.main">
                    {planCredits}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plan Credits
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={600} color="success.main">
                    {purchasedCredits}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Purchased Credits
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={600} color="info.main">
                    {rolloverCredits}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rollover Credits
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Choose a One-Time Credit Pack */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Inventory2Outlined sx={{ color: 'secondary.main', fontSize: 22 }} />
            <Typography variant="h6" fontWeight={600}>
              Choose a One-Time Credit Pack
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the credit pack that best fits your needs
          </Typography>
        </Box>

        {packsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {creditPacks.map((pack) => {
            const isSelected = selectedPackId === pack.id
            const BadgeIcon = pack.badgeIcon
            return (
              <Grid item xs={12} md={4} key={pack.id}>
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
                      transform: 'scale(1.02)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {pack.badge && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        py: 0.75,
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        backgroundColor: pack.badgeColor,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: '8px 8px 0 0',
                      }}
                    >
                      {BadgeIcon && <BadgeIcon sx={{ fontSize: 16 }} />}
                      {pack.badge}
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, pt: pack.badge ? 4 : 2, pb: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {pack.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {pack.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {pack.credits.toLocaleString()} credits
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {formatPrice(pack.price, pack.currency)}
                      </Typography>
                      {pack.originalPrice > pack.price && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          {formatPrice(pack.originalPrice, pack.currency)}
                        </Typography>
                      )}
                    </Box>
                    {pack.savings > 0 && (
                      <Typography variant="caption" color="success.main" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                        Save {formatPrice(pack.savings, pack.currency)}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {pack.costPerCredit}¢ per credit
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      What&apos;s included:
                    </Typography>
                    <List dense disablePadding sx={{ mb: 2 }}>
                      <ListItem disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${pack.credits.toLocaleString()} credits`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${pack.expirationMonths}-month expiration`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>
                    <Button
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedPackId(isSelected ? null : pack.id)}
                      startIcon={isSelected ? <CheckIcon /> : <Inventory2Outlined />}
                      sx={{
                        mt: 'auto',
                        ...(isSelected
                          ? {
                              backgroundColor: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.dark' },
                            }
                          : pack.badgeColor === 'success.main'
                            ? { borderColor: 'success.main', color: 'success.main', '&:hover': { borderColor: 'success.dark', backgroundColor: 'action.hover' } }
                            : { borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }),
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select Pack'}
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
            You&apos;ll be redirected to secure payment. Credits will be added to your account after purchase.
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={!selectedPackId || checkoutLoading}
            onClick={handleProceedToPayment}
            startIcon={checkoutLoading ? <CircularProgress size={20} color="inherit" /> : <CreditCardOutlined />}
            sx={{
              backgroundColor: 'secondary.main',
              '&:hover': { backgroundColor: 'secondary.dark' },
            }}
          >
            {checkoutLoading ? 'Redirecting…' : 'Proceed to Payment'}
          </Button>
        </Box>
      </Box>
    </MainLayout>
  )
}
