import { useState } from 'react'
import { Box, Fab } from '@mui/material'
import { ContactSupport } from '@mui/icons-material'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChatbotHelper } from '../ChatbotHelper'
import { useAuth } from '../../hooks/useAuth'

export const MainLayout = ({ children }) => {
  const { user } = useAuth()
  const [chatbotOpen, setChatbotOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar />
      <Box
        sx={{
          marginLeft: '80px',
          width: 'calc(100% - 80px)',
          minHeight: '100vh',
        }}
      >
        <Header user={user} />
        <Box
          sx={{
            marginTop: '70px',
            padding: 3,
          }}
        >
          {children}
        </Box>
      </Box>

      <Fab
        color="primary"
        aria-label="Get help"
        onClick={() => setChatbotOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 998,
          '&:hover': { backgroundColor: 'primary.dark' },
        }}
      >
        <ContactSupport />
      </Fab>

      <ChatbotHelper open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </Box>
  )
}
