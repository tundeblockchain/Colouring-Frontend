import { Box } from '@mui/material'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '../../hooks/useAuth'

export const MainLayout = ({ children }) => {
  const { user } = useAuth()

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
    </Box>
  )
}
