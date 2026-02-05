import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  ExpandMore,
  Palette,
  AutoAwesome,
  PhotoCamera,
  TextFields,
  Star as StarIcon,
} from '@mui/icons-material'
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans'

const SITE_NAME = 'ColorBliss'

const formatPrice = (amountInCents, currency = 'usd') => {
  const value = amountInCents / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(value)
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`
  }
}

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

const heroGradient = 'linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 50%, #F3E5F5 100%)'
const heroGradientDark = 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #16213e 100%)'
const ctaGradient = 'linear-gradient(90deg, #42A5F5 0%, #66BB6A 100%)'

const features = [
  {
    title: 'Create AI colouring pages in seconds',
    description:
      "Type any idea — 'unicorn in a castle', 'dinosaurs on the moon', 'my cat as a superhero' — and get a printable colouring page in seconds. Perfect for kids, teachers, and anyone who loves to colour.",
    cta: 'Try it now',
    path: '/create/text',
    image: '/text-prompts.png',
    icon: AutoAwesome,
    imageSide: 'right',
  },
  {
    title: 'Turn photos into colouring pages',
    description:
      'Upload a photo and our AI removes the background, cleans the details, and returns crisp line art ready to print. Works with any JPG or PNG — turn family photos, pets, or favourite moments into one-of-a-kind colouring pages.',
    cta: 'Convert a photo',
    path: '/create/photo',
    image: '/photos.png',
    icon: PhotoCamera,
    imageSide: 'left',
  },
  {
    title: 'Word art & custom lettering',
    description:
      'Create custom word art with names, quotes, numbers, or any text. Great for banners, bulletin boards, gifts, and classroom projects. Choose from bubble letters, script, and more.',
    cta: 'Create word art',
    path: '/create/word-art',
    image: '/word-art.png',
    icon: TextFields,
    imageSide: 'right',
  },
]

const FALLBACK_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get started creating colouring pages from text prompts.',
    credits: 250,
    priceMonthly: 9,
    priceAnnual: 90,
    prices: { month: { amount: 900, currency: 'usd' }, year: { amount: 9000, currency: 'usd' } },
    popular: false,
  },
  {
    id: 'hobby',
    name: 'Hobby',
    tagline: 'Higher limits and access to all ways of creating colouring pages.',
    credits: 500,
    priceMonthly: 18,
    priceAnnual: 180,
    prices: { month: { amount: 1800, currency: 'usd' }, year: { amount: 18000, currency: 'usd' } },
    popular: false,
  },
  {
    id: 'artist',
    name: 'Artist',
    tagline: 'Best for those looking to sell their creations.',
    credits: 1000,
    priceMonthly: 35,
    priceAnnual: 350,
    prices: { month: { amount: 3500, currency: 'usd' }, year: { amount: 35000, currency: 'usd' } },
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For businesses that need higher limits.',
    credits: 5000,
    priceMonthly: 99,
    priceAnnual: 990,
    prices: { month: { amount: 9900, currency: 'usd' }, year: { amount: 99000, currency: 'usd' } },
    popular: false,
  },
]

const faqItems = [
  {
    q: 'What is ColorBliss?',
    a: 'ColorBliss is an AI-powered colouring page generator. Create printable colouring pages from text prompts, turn photos into line art, or design custom word art — all in seconds.',
  },
  {
    q: 'How do I make my own colouring page?',
    a: "Sign up for free, then choose how you want to create: type a description (e.g. 'dragon in a forest'), upload a photo, or create word art. Our AI generates a printable page you can download and colour.",
  },
  {
    q: 'Can I use the images I create to make colouring books to sell?',
    a: 'Yes. Our Artist and Business plans are designed for creators who want to sell their work. Check the plan details and terms for commercial use.',
  },
  {
    q: 'How does the AI generate colouring pages?',
    a: 'Our AI turns your ideas or photos into clean black-and-white line art suitable for colouring. You get full control over style, and you can adjust contrast and brightness before downloading.',
  },
  {
    q: 'Is ColorBliss free to use?',
    a: 'You can start with a free trial that includes credits to try all features. When you need more, choose a plan that fits how much you create.',
  },
  {
    q: 'Can I print the colouring pages?',
    a: 'Yes. Every page you create can be downloaded and printed. Use them at home, in the classroom, or for your own projects.',
  },
  {
    q: 'Are the colouring pages unique?',
    a: 'Yes. Each generation is created from your prompt or photo, so your colouring pages are unique to you.',
  },
]

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'AI colouring page generator', to: '/create/text' },
      { label: 'Convert photos to colouring pages', to: '/create/photo' },
      { label: 'Word art generator', to: '/create/word-art' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '#' },
      { label: 'Blog', to: '#' },
      { label: 'Terms & conditions', to: '#' },
      { label: 'Privacy policy', to: '#' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign up', to: '/register' },
      { label: 'Log in', to: '/login' },
    ],
  },
]

export const Landing = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isSmall = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const [billingInterval, setBillingInterval] = useState('year')
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans()
  const apiPlans = plansData?.plans ?? []

  const plans = useMemo(() => {
    if (apiPlans?.length) return apiPlans.map(normalizePlan)
    return FALLBACK_PLANS
  }, [apiPlans])

  const getPriceForPlan = (plan) => {
    const key = billingInterval === 'year' ? 'year' : 'month'
    if (plan.prices?.[key]) return { amount: plan.prices[key].amount, currency: plan.prices[key].currency || 'usd' }
    const amountDollars = billingInterval === 'year' ? plan.priceAnnual : plan.priceMonthly
    return { amount: (amountDollars ?? 0) * 100, currency: 'usd' }
  }

  const handleCta = (path) => {
    navigate('/register', { state: { from: path } })
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Landing header */}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
              <Palette sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h6" fontWeight={700}>
                {SITE_NAME}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                component={Link}
                to="/pricing"
                color="inherit"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Pricing
              </Button>
              <Button
                component={Link}
                to="/login"
                color="inherit"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Log in
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  background: ctaGradient,
                  '&:hover': { opacity: 0.9, background: ctaGradient },
                }}
              >
                Get started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          pt: { xs: 12, md: 16 },
          pb: { xs: 8, md: 14 },
          px: 2,
          background: isDark ? heroGradientDark : heroGradient,
          backgroundAttachment: 'fixed',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              component="h1"
              variant="h3"
              fontWeight={700}
              color="text.primary"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              AI colouring page generator — make printable pages in seconds
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 560, mx: 'auto' }}>
              {SITE_NAME} is the AI colouring page generator for kids, grown-ups, and anyone who loves to colour.
            </Typography>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: ctaGradient,
                '&:hover': { opacity: 0.9, background: ctaGradient },
              }}
            >
              Start for free
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              No credit card. Just creativity.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 3,
                flexWrap: 'wrap',
              }}
            >
              <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                ★★★★★ from hundreds of creators
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thousands of colouring pages created
              </Typography>
            </Box>
          </Box>
          {/* Preview cards */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 1,
              flexWrap: 'wrap',
              '& > *': {
                flex: '1 1 140px',
                maxWidth: 200,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 4,
                border: '1px solid',
                borderColor: 'divider',
                transform: 'rotate(-3deg)',
                '&:nth-of-type(2)': { transform: 'rotate(2deg) scale(1.05)' },
                '&:nth-of-type(3)': { transform: 'rotate(3deg)' },
              },
            }}
          >
            <Box
              component="img"
              src="/text-prompts.png"
              alt="Text prompt example"
              sx={{ width: '100%', display: 'block', backgroundColor: 'background.paper' }}
            />
            <Box
              component="img"
              src="/word-art.png"
              alt="Word art example"
              sx={{ width: '100%', display: 'block', backgroundColor: 'background.paper' }}
            />
            <Box
              component="img"
              src="/photos.png"
              alt="Photo conversion example"
              sx={{ width: '100%', display: 'block', backgroundColor: 'background.paper' }}
            />
          </Box>
        </Container>
      </Box>

      {/* Feature sections */}
      {features.map((feat, idx) => {
        const Icon = feat.icon
        const imageFirst = feat.imageSide === 'left'
        return (
          <Box
            key={idx}
            sx={{
              py: { xs: 6, md: 10 },
              px: 2,
              backgroundColor: idx % 2 === 1 ? 'action.hover' : 'transparent',
            }}
          >
            <Container maxWidth="lg">
              <Grid
                container
                spacing={4}
                alignItems="center"
                direction={isSmall ? 'column' : (imageFirst ? 'row-reverse' : 'row')}
              >
                <Grid item xs={12} md={6}>
                  <Icon sx={{ color: 'primary.main', fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
                    {feat.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {feat.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleCta(feat.path)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      background: ctaGradient,
                      '&:hover': { opacity: 0.9, background: ctaGradient },
                    }}
                  >
                    {feat.cta}
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      maxWidth: 400,
                      mx: 'auto',
                    }}
                  >
                    <Box
                      component="img"
                      src={feat.image}
                      alt=""
                      sx={{ width: '100%', display: 'block', backgroundColor: 'background.paper' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>
        )
      })}

      {/* Pricing */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: 2, backgroundColor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="primary.main" fontWeight={600} sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            Pricing
          </Typography>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Choose the plan that&apos;s right for you
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
            Whether you&apos;re printing colouring sheets to keep the kids busy or running a business with high-volume needs, we&apos;ve got a plan for you.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={billingInterval}
              exclusive
              onChange={(_, v) => v != null && setBillingInterval(v)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  px: 3,
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
          {plansLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan) => {
              const priceInfo = getPriceForPlan(plan)
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
                    <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                      {formatPrice(priceInfo.amount, priceInfo.currency)}
                      <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                        {' '}
                        / {billingInterval === 'year' ? 'year' : 'month'}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {(plan.credits ?? 0).toLocaleString()} credits per month
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      ✓ Create from text, photos & word art
                    </Typography>
                    <Button
                      fullWidth
                      variant={plan.popular ? 'contained' : 'outlined'}
                      component={Link}
                      to="/register"
                      state={{ plan: plan.id }}
                      sx={{
                        mt: 'auto',
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(plan.popular && {
                          background: ctaGradient,
                          '&:hover': { opacity: 0.9, background: ctaGradient },
                        }),
                      }}
                    >
                      Get started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              )
            })}
          </Grid>
          )}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              component={Link}
              to="/pricing"
              variant="text"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Compare all plans and features →
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
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

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          py: 6,
          px: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Palette sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {SITE_NAME}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                AI colouring page generator for everyone.
              </Typography>
            </Grid>
            {footerColumns.map((col) => (
              <Grid item xs={6} md={2} key={col.title}>
                <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  {col.title}
                </Typography>
                {col.links.map((link) => (
                  <Box
                    key={link.label}
                    component={Link}
                    to={link.to}
                    sx={{
                      display: 'block',
                      py: 0.5,
                      color: 'text.secondary',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {link.label}
                  </Box>
                ))}
              </Grid>
            ))}
          </Grid>
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
