import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
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
import { registerUser, signInWithGoogle } from '../api/auth'
import { getUserProfile, registerUser as registerUserAPI } from '../api/user'
import { trackSignUp, trackLogin } from '../utils/analytics'

export const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Register with Firebase
      const result = await registerUser(email, password)

      if (!result.success) {
        setError(result.error || 'Failed to register')
        setLoading(false)
        return
      }

      const firebaseUser = result.user

      // Register user in backend
      const userData = {
        email: firebaseUser.email || email,
        displayName: email.split('@')[0] || 'User',
        avatarUrl: null,
        plan: 'free',
      }

      const backendRegisterResult = await registerUserAPI(firebaseUser.uid, userData)

      if (!backendRegisterResult.success) {
        // If user already exists (409), that's okay - they can proceed
        if (backendRegisterResult.status !== 409) {
          setError(backendRegisterResult.error || 'Failed to register in backend')
          setLoading(false)
          return
        }
      }

      // Success - navigate to dashboard or intended page from landing
      trackSignUp('email')
      navigate(from)
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
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
        } else {
          trackSignUp('google')
        }
      } else if (!userProfileResult.success && userProfileResult.status !== 404) {
        // Other errors (not 404)
        setError(userProfileResult.error || 'Failed to check user profile')
        setLoading(false)
        return
      } else {
        trackLogin('google')
      }

      // Success - navigate to dashboard or intended page from landing
      navigate(from)
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
                Color Charm
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your account
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
                autoComplete="new-password"
                helperText="Password must be at least 6 characters"
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ marginTop: 3, marginBottom: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
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
              {loading ? <CircularProgress size={24} /> : 'Sign up with Google'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ color: '#64B5F6', textDecoration: 'none' }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
