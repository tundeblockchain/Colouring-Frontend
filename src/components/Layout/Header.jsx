import { Box, TextField, InputAdornment, IconButton, Badge, Chip } from '@mui/material'
import {
  SearchOutlined,
  NotificationsOutlined,
  InfoOutlined,
  RefreshOutlined,
} from '@mui/icons-material'
import { useUser } from '../../hooks/useUser'

export const Header = ({ user }) => {
  const { data: userProfile } = useUser(user?.uid)

  return (
    <Box
      sx={{
        height: 70,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E0E0E0',
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 600, marginX: 4 }}>
        <TextField
          placeholder="Search coloring pages..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#F5F5F5',
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
            color: '#FFFFFF',
            fontWeight: 500,
            '& .MuiChip-icon': {
              color: '#FFFFFF',
            },
          }}
        />

        <IconButton size="small">
          <InfoOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  )
}
