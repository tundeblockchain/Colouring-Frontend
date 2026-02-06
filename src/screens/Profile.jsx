import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useToast } from '../contexts/ToastContext'
import { updatePassword as updateAuthPassword, deleteAuthUser } from '../api/auth'
import { cancelSubscription } from '../api/subscriptions'
import { deleteUserProfile } from '../api/user'

const profileSections = [
  { id: 'info', label: 'Your Info' },
  { id: 'subscription', label: 'Subscription and Billing' },
  { id: 'password', label: 'Update Password' },
  // { id: 'watermark', label: 'Watermark Settings' },
  // { id: 'testimonial', label: 'Testimonial' },
  // { id: 'referral', label: 'Referral Program' },
  { id: 'help', label: 'Get Help' },
  { id: 'delete', label: 'Delete Account' },
]

const MIN_PASSWORD_LENGTH = 6
const PAID_PLANS = ['starter', 'hobby', 'artist', 'business']

const formatPlanName = (plan) => {
  if (!plan) return 'Free'
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()
}

export const Profile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const { showToast } = useToast()
  const [activeSection, setActiveSection] = useState('info')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const isEmailProvider = user?.providerData?.some((p) => p.providerId === 'password')

  const plan = (userProfile?.plan || 'free').toLowerCase()
  const isPaidPlan = PAID_PLANS.includes(plan)

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      showToast('Subscription updated successfully.')
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('subscription')
        return next
      }, { replace: true })
    }
    if (searchParams.get('credits') === 'success') {
      showToast('Credits added successfully.')
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('credits')
        return next
      }, { replace: true })
    }
  }, [searchParams, setSearchParams, showToast])

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const handleDeleteAccount = async () => {
    if (!user?.uid) return
    setDeleteLoading(true)
    const backendResult = await deleteUserProfile(user.uid)
    if (!backendResult.success) {
      setDeleteLoading(false)
      showToast(backendResult.error || 'Failed to delete account.', 'error')
      return
    }
    const authResult = await deleteAuthUser(isEmailProvider ? { password: deletePassword } : {})
    setDeleteLoading(false)
    setDeleteDialogOpen(false)
    setDeleteConfirmText('')
    setDeletePassword('')
    if (authResult.success) {
      showToast('Account deleted successfully.')
      navigate('/', { replace: true })
    } else {
      showToast(authResult.error || 'Account data removed. Please sign out and sign in again to complete.', 'error')
    }
  }

  const handleCancelSubscription = async () => {
    if (!user?.uid) return
    setCancelLoading(true)
    const { success, error } = await cancelSubscription(user.uid)
    setCancelLoading(false)
    setCancelDialogOpen(false)
    if (success) {
      queryClient.invalidateQueries(['user', user.uid])
      showToast('Your subscription will cancel at the end of the billing period.')
    } else {
      showToast(error || 'Failed to cancel subscription.', 'error')
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordLoading(true)
    const { success, error } = await updateAuthPassword(password)
    setPasswordLoading(false)
    if (success) {
      showToast('Password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    } else {
      const message = error?.includes('requires-recent-login')
        ? 'Please sign out and sign in again, then try updating your password.'
        : error || 'Failed to update password.'
      setPasswordError(message)
      showToast(message, 'error')
    }
  }

  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, marginBottom: 3 }}>
        Profile
      </Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ width: 250, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          <List>
            {profileSections.map((section) => (
              <ListItem key={section.id} disablePadding sx={section.id === 'delete' ? { mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' } : undefined}>
                <ListItemButton
                  selected={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                  sx={{
                    borderRadius: 1,
                    ...(section.id === 'delete'
                      ? {
                          color: 'error.main',
                          '&:hover': { backgroundColor: 'error.main', color: 'error.contrastText' },
                          '&.Mui-selected': {
                            backgroundColor: 'error.main',
                            color: 'error.contrastText',
                            '&:hover': { backgroundColor: 'error.dark' },
                          },
                        }
                      : {
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'primary.dark' },
                          },
                        }),
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
              <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
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
                <Button variant="outlined">Sign out</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'password' && (
            <Card sx={{ marginBottom: 3 }}>
              <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Update Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your new password below and confirm it.
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleUpdatePassword}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}
                >
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    error={Boolean(passwordError)}
                    disabled={passwordLoading}
                    fullWidth
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    error={Boolean(passwordError)}
                    helperText={passwordError}
                    disabled={passwordLoading}
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={passwordLoading}
                    sx={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }}
                  >
                    {passwordLoading ? 'Updating…' : 'Update Password'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeSection === 'subscription' && (
            <Card>
              <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Subscription and Billing
                </Typography>
                {isPaidPlan ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      You&apos;re on the <strong>{formatPlanName(plan)}</strong> plan.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                      {userProfile?.currentPeriodEnd
                        ? (userProfile.cancelAtPeriodEnd
                            ? `Your subscription will end on ${new Date(userProfile.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: 'medium' })}.`
                            : `Next expected bill date: ${new Date(userProfile.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: 'medium' })}`)
                        : 'Next expected bill date: —'}
                    </Typography>
                    {userProfile?.cancelAtPeriodEnd && (
                      <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                        You have requested to cancel. Access continues until the end of the billing period.
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/choose-plan')}
                        sx={{
                          backgroundColor: 'primary.main',
                          '&:hover': { backgroundColor: 'primary.dark' },
                        }}
                      >
                        Upgrade
                      </Button>
                      {!userProfile?.cancelAtPeriodEnd && (
                        <Button
                          variant="outlined"
                          size="large"
                          color="error"
                          onClick={() => setCancelDialogOpen(true)}
                        >
                          Cancel subscription
                        </Button>
                      )}
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
                      You are on the free plan. Upgrade today!
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/choose-plan')}
                      sx={{
                        backgroundColor: 'primary.main',
                        '&:hover': { backgroundColor: 'primary.dark' },
                      }}
                    >
                      Upgrade Now!
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'help' && (
            <Card sx={{ marginBottom: 3 }}>
              <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Get Help
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                  New to Color Charm? Take a quick tour to learn where everything is.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard?tour=1')}
                    sx={{
                      alignSelf: 'flex-start',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': { borderColor: 'primary.dark', backgroundColor: 'action.hover' },
                    }}
                  >
                    Take product tour
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/create/text?tour=1')}
                    sx={{
                      alignSelf: 'flex-start',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': { borderColor: 'primary.dark', backgroundColor: 'action.hover' },
                    }}
                  >
                    Take Create screen tour
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeSection === 'delete' && (
            <Card sx={{ marginBottom: 3, borderColor: 'error.main', border: 2 }}>
              <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  Delete Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Permanently delete your account and all associated data. This cannot be undone. Your subscription will be cancelled and you will lose access to all coloring pages and folders.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ minWidth: 200, fontWeight: 600 }}
                >
                  Delete my account
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={cancelDialogOpen} onClose={() => !cancelLoading && setCancelDialogOpen(false)}>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Your subscription will remain active until the end of your current billing period. After that, you&apos;ll be on the free plan and will lose access to plan benefits.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
                Keep subscription
              </Button>
              <Button color="error" variant="contained" onClick={handleCancelSubscription} disabled={cancelLoading}>
                {cancelLoading ? 'Cancelling…' : 'Cancel at period end'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={deleteDialogOpen}
            onClose={() => !deleteLoading && (setDeleteDialogOpen(false), setDeleteConfirmText(''), setDeletePassword(''))}
          >
            <DialogTitle>Delete account?</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                This will permanently delete your account and all data. Type <strong>DELETE</strong> below to confirm.
              </DialogContentText>
              <TextField
                autoFocus
                fullWidth
                label="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                error={deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE'}
                disabled={deleteLoading}
                sx={{ mt: 1 }}
              />
              {isEmailProvider && (
                <TextField
                  fullWidth
                  type="password"
                  label="Your password"
                  placeholder="Enter your password to confirm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  disabled={deleteLoading}
                  sx={{ mt: 2 }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); setDeletePassword('') }} disabled={deleteLoading}>
                Keep account
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE' || (isEmailProvider && !deletePassword.trim())}
              >
                {deleteLoading ? 'Deleting…' : 'Delete account'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </MainLayout>
  )
}
