import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { CircularProgress, Box } from '@mui/material'

// Screens
import { Login } from './screens/Login'
import { Register } from './screens/Register'
import { Dashboard } from './screens/Dashboard'
import { Gallery } from './screens/Gallery'
import { Favorites } from './screens/Favorites'
import { CreateColoringPage } from './screens/CreateColoringPage'
import { Profile } from './screens/Profile'
import { Folders } from './screens/Folders'
import { FolderView } from './screens/FolderView'
import { ChoosePlan } from './screens/ChoosePlan'
import { AddOneTimeCredits } from './screens/AddOneTimeCredits'

// Components
import { AuthHandler } from './components/AuthHandler'
import { ToastProvider } from './contexts/ToastContext'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <ToastProvider>
      <AuthHandler />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create/:type"
        element={
          <ProtectedRoute>
            <CreateColoringPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/folders"
        element={
          <ProtectedRoute>
            <Folders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/folders/:folderId"
        element={
          <ProtectedRoute>
            <FolderView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/choose-plan"
        element={
          <ProtectedRoute>
            <ChoosePlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-credits"
        element={
          <ProtectedRoute>
            <AddOneTimeCredits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ideas"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
