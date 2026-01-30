import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Avatar,
} from '@mui/material'
import {
  AddPhotoAlternateOutlined,
  ImageOutlined,
  FavoriteBorder,
  FolderOutlined,
  SettingsOutlined,
  LightbulbOutlined,
  LogoutOutlined,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { logoutUser } from '../../api/auth'

const menuItems = [
  { icon: AddPhotoAlternateOutlined, path: '/dashboard', label: 'Create' },
  { icon: ImageOutlined, path: '/gallery', label: 'Gallery' },
  { icon: FavoriteBorder, path: '/favorites', label: 'Favorites' },
  { icon: FolderOutlined, path: '/folders', label: 'Folders' },
  { icon: SettingsOutlined, path: '/settings', label: 'Settings' },
  { icon: LightbulbOutlined, path: '/ideas', label: 'Ideas' },
]

export const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <Box
      sx={{
        width: 80,
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 2,
        paddingBottom: 2,
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <List sx={{ width: '100%', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <ListItem key={item.path} disablePadding>
              <Tooltip title={item.label} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    justifyContent: 'center',
                    minHeight: 56,
                    backgroundColor: isActive
                      ? 'rgba(100, 181, 246, 0.1)'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(100, 181, 246, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <Icon />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}
      </List>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          marginTop: 'auto',
        }}
      >
        <Tooltip title={user?.email || 'User'} placement="right">
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 40,
              height: 40,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/profile')}
          >
            {getInitials(user?.email)}
          </Avatar>
        </Tooltip>

        <Tooltip title="Logout" placement="right">
          <ListItemButton
            onClick={handleLogout}
            sx={{
              justifyContent: 'center',
              minHeight: 40,
              '&:hover': {
                backgroundColor: 'rgba(100, 181, 246, 0.05)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <LogoutOutlined fontSize="small" />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
