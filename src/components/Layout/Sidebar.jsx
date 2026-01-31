import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import {
  AddPhotoAlternateOutlined,
  ImageOutlined,
  FavoriteBorder,
  FolderOutlined,
  SettingsOutlined,
  LightbulbOutlined,
  LogoutOutlined,
  DarkMode,
  LightMode,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useThemeMode } from '../../contexts/ThemeModeContext'
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
  const { mode, toggleMode } = useThemeMode()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const handleLogout = async () => {
    setLogoutDialogOpen(false)
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
        backgroundColor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
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
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
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
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
          <ListItemButton
            onClick={toggleMode}
            sx={{
              justifyContent: 'center',
              minHeight: 40,
              '&:hover': {
                backgroundColor: 'action.hover',
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
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>

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
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              justifyContent: 'center',
              minHeight: 40,
            '&:hover': {
              backgroundColor: 'action.hover',
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

      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Sign out?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLogout} color="primary">
            Sign out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
