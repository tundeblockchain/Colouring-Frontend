import { useMemo, useRef } from 'react'
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
} from '@mui/material'
import {
  SearchOutlined,
  NotificationsOutlined,
  InfoOutlined,
  RefreshOutlined,
} from '@mui/icons-material'
import { useUser } from '../../hooks/useUser'
import { useColoringPages } from '../../hooks/useColoringPages'

export const Header = ({ user }) => {
  const searchAnchorRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: userProfile } = useUser(user?.uid)
  const { data: coloringPages = [] } = useColoringPages(user?.uid)
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = (searchParams.get('q') ?? '').trim()

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
          icon={<RefreshOutlined fontSize="small" />}
          label={`${userProfile?.credits || 0} credits remaining`}
          color="primary"
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 500,
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
                        <Box sx={{ p: 1 }}>
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
    </Box>
  )
}
