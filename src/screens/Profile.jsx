import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'

const profileSections = [
  { id: 'info', label: 'Your Info' },
  { id: 'subscription', label: 'Subscription and Billing' },
  { id: 'password', label: 'Update Password' },
  { id: 'watermark', label: 'Watermark Settings' },
  { id: 'testimonial', label: 'Testimonial' },
  { id: 'referral', label: 'Referral Program' },
  { id: 'help', label: 'Get Help' },
]

export const Profile = () => {
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const [activeSection, setActiveSection] = useState('info')

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, marginBottom: 3 }}>
        Profile
      </Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ width: 250 }}>
          <List>
            {profileSections.map((section) => (
              <ListItem key={section.id} disablePadding>
                <ListItemButton
                  selected={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemText primary={section.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ flex: 1 }}>
          {activeSection === 'info' && (
            <Card sx={{ marginBottom: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Your Info
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                  You are logged in as {user?.email}.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      border: '3px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    {getInitials(user?.email)}
                  </Avatar>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    marginRight: 2,
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  Edit Avatar
                </Button>
                <Button variant="outlined">Sign out</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'subscription' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Subscription and Billing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
                  You are on the free plan. Upgrade today!
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    background: 'linear-gradient(90deg, #64B5F6 0%, #42A5F5 100%)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #42A5F5 0%, #1E88E5 100%)',
                    },
                  }}
                >
                  Upgrade Now!
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </MainLayout>
  )
}
