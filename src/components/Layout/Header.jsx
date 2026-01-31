import { useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Chip,
  Popover,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  Button,
  Divider,
} from '@mui/material'
import {
  SearchOutlined,
  NotificationsOutlined,
  InfoOutlined,
  RefreshOutlined,
  CardGiftcardOutlined,
  ConfirmationNumberOutlined,
  ScheduleOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material'
import { useUser } from '../../hooks/useUser'
import { useColoringPages } from '../../hooks/useColoringPages'

const PLAN_CREDITS_BY_PLAN = {
  free: 12,
  starter: 250,
  hobby: 500,
  artist: 1000,
  business: 5000,
}

export const Header = ({ user }) => {
  const searchAnchorRef = useRef(null)
  const creditsAnchorRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: userProfile } = useUser(user?.uid)
  const { data: coloringPages = [] } = useColoringPages(user?.uid)
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = (searchParams.get('q') ?? '').trim()
  const [creditsPopoverOpen, setCreditsPopoverOpen] = useState(false)

  const creditsRemaining = userProfile?.credits ?? 0
  const planKey = (userProfile?.plan || 'free').toLowerCase()
  const derivedPlanCredits = PLAN_CREDITS_BY_PLAN[planKey] ?? PLAN_CREDITS_BY_PLAN.free
  const planCredits = userProfile?.planCredits ?? Math.max(derivedPlanCredits, creditsRemaining)
  const creditsUsed =
    userProfile?.creditsUsed ??
    Math.max(0, planCredits - creditsRemaining)
  const planLabel = userProfile?.plan === 'free' || !userProfile?.plan ? 'Free Trial' : (userProfile?.plan ?? 'Free Trial')

  const isOnGallery = location.pathname === '/gallery'
  const showSearchPopover = !isOnGallery && searchQuery.length > 0

  const filteredResults = useMemo(() => {
    if (!searchQuery) return []
    const lower = searchQuery.toLowerCase()
    return coloringPages.filter(
      (page) =>
        page.title?.toLowerCase().includes(lower) ||
        page.prompt?.toLowerCase().includes(lower)
    )
  }, [coloringPages, searchQuery])

  const handleSearchChange = (e) => {
    const value = e.target.value
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const handleCloseSearchPopover = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const handleViewInGallery = () => {
    navigate(`/gallery${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`)
  }

  const handleResultClick = () => {
    navigate(`/gallery${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`)
  }

  return (
    <Box
      sx={{
        height: 70,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingX: 3,
        position: 'fixed',
        top: 0,
        left: 80,
        right: 0,
        zIndex: 999,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="ColorBliss"
          sx={{
            height: 32,
            width: 32,
            display: { xs: 'none', md: 'block' },
          }}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
        <Box
          component="span"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'text.primary',
            display: { xs: 'none', md: 'block' },
          }}
        >
          ColorBliss
        </Box>
      </Box>

      <Box
        ref={searchAnchorRef}
        sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 600, marginX: 4 }}
      >
        <TextField
          placeholder="Search coloring pages..."
          size="small"
          fullWidth
          value={searchParams.get('q') ?? ''}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'action.hover',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton>
          <Badge badgeContent={0} color="primary">
            <NotificationsOutlined sx={{ color: 'text.secondary' }} />
          </Badge>
        </IconButton>

        <Chip
          ref={creditsAnchorRef}
          icon={<RefreshOutlined fontSize="small" />}
          label={`${creditsRemaining} credits remaining`}
          color="primary"
          onClick={() => setCreditsPopoverOpen(true)}
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 500,
            cursor: 'pointer',
            '& .MuiChip-icon': {
              color: 'primary.contrastText',
            },
          }}
        />

        <IconButton size="small">
          <InfoOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
        </IconButton>
      </Box>

      <Popover
        open={showSearchPopover}
        onClose={handleCloseSearchPopover}
        anchorEl={searchAnchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        hideBackdrop
        ModalProps={{
          disableEnforceFocus: true,
          disableAutoFocus: true,
          disableRestoreFocus: true,
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 2,
            minWidth: searchAnchorRef.current?.offsetWidth ?? 400,
            maxHeight: 400,
            overflow: 'auto',
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ p: 2 }} tabIndex={-1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Search results {searchQuery && `for "${searchQuery}"`}
          </Typography>
          {filteredResults.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No coloring pages match your search.
            </Typography>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {filteredResults.map((page) => (
                  <Grid item xs={6} sm={4} md={3} key={page.id}>
                    <Card sx={{ overflow: 'hidden' }}>
                      <CardActionArea onClick={handleResultClick}>
                        <CardMedia
                          component="img"
                          height={120}
                          image={page.thumbnailUrl || page.imageUrl}
                          alt={page.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <Box sx={{ p: 1, pt: 1, pb: 1.5 }}>
                          <Typography variant="body2" noWrap title={page.title}>
                            {page.title}
                          </Typography>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Chip
                  label="View all in Gallery"
                  onClick={handleViewInGallery}
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </>
          )}
        </Box>
      </Popover>

      <Popover
        open={creditsPopoverOpen}
        onClose={() => setCreditsPopoverOpen(false)}
        anchorEl={creditsAnchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1.5,
            minWidth: 280,
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WorkspacePremiumOutlined sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {planLabel}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CardGiftcardOutlined sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Plan Credits
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {planCredits}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ConfirmationNumberOutlined sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Credits used
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {creditsUsed}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleOutlined sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Credits remaining
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {creditsRemaining}
              </Typography>
            </Box>
          </Box>
          <Box
            component="a"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setCreditsPopoverOpen(false)
              navigate('/profile')
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.875rem',
              color: 'primary.main',
              textDecoration: 'none',
              mb: 2,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <InfoOutlined sx={{ fontSize: 16 }} />
            Credits FAQ
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setCreditsPopoverOpen(false)
                navigate('/choose-plan')
              }}
              sx={{ borderColor: 'divider', color: 'text.primary' }}
            >
              Upgrade plan
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setCreditsPopoverOpen(false)
                navigate('/choose-plan')
              }}
              sx={{ borderColor: 'divider', color: 'text.primary' }}
            >
              Add more credits
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  )
}
