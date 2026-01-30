import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import { Google } from '@mui/icons-material'
import { loginUser, signInWithGoogle } from '../api/auth'
import { getUserProfile, registerUser as registerUserAPI } from '../api/user'

export const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await loginUser(email, password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Failed to login')
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      // Sign in with Google (Firebase)
      const result = await signInWithGoogle()

      if (!result.success) {
        setError(result.error || 'Failed to sign in with Google')
        setLoading(false)
        return
      }

      const firebaseUser = result.user

      // Check if user exists in backend
      const userProfileResult = await getUserProfile(firebaseUser.uid)

      // If user doesn't exist (404), register them
      if (!userProfileResult.success && userProfileResult.status === 404) {
        const userData = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatarUrl: firebaseUser.photoURL || null,
          plan: 'free',
        }

        const registerResult = await registerUserAPI(firebaseUser.uid, userData)

        if (!registerResult.success) {
          // If registration fails but user already exists (409), that's okay
          if (registerResult.status !== 409) {
            setError(registerResult.error || 'Failed to register user')
            setLoading(false)
            return
          }
        }
      } else if (!userProfileResult.success && userProfileResult.status !== 404) {
        // Other errors (not 404)
        setError(userProfileResult.error || 'Failed to check user profile')
        setLoading(false)
        return
      }

      // Success - navigate to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Google sign-in error:', error)
      setError(error.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ padding: 4 }}>
            <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                ColorBliss
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to your account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ marginTop: 3, marginBottom: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ marginY: 2 }}>
              <Divider>
                <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                  OR
                </Typography>
              </Divider>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                marginBottom: 2,
                borderColor: '#DB4437',
                color: '#DB4437',
                '&:hover': {
                  borderColor: '#DB4437',
                  backgroundColor: 'rgba(219, 68, 55, 0.04)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign in with Google'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{ color: '#64B5F6', textDecoration: 'none' }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
