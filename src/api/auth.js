import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

/**
 * Register a new user
 */
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    return {
      success: true,
      user: userCredential.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return {
      success: true,
      user: userCredential.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return {
      success: true,
      user: result.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Update the current user's password (Firebase Auth).
 * Requires the user to have signed in recently; otherwise use re-authentication.
 */
export const updatePassword = async (newPassword) => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { success: false, error: 'You must be logged in to update your password.' }
  }
  try {
    await firebaseUpdatePassword(currentUser, newPassword)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Re-authenticate the current user (required before deleteUser if they signed in a while ago).
 * For email/password users pass { password }. For Google (and other OAuth) users, a popup is used.
 * @param {{ password?: string }} options - password required for email/password provider
 */
export const reauthenticateCurrentUser = async (options = {}) => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { success: false, error: 'You must be logged in.' }
  }
  const providerData = currentUser.providerData || []
  const hasPassword = providerData.some((p) => p.providerId === 'password')
  const hasGoogle = providerData.some((p) => p.providerId === 'google.com')
  try {
    if (hasPassword && options.password) {
      const credential = EmailAuthProvider.credential(currentUser.email, options.password)
      await reauthenticateWithCredential(currentUser, credential)
      return { success: true }
    }
    if (hasGoogle) {
      await reauthenticateWithPopup(currentUser, googleProvider)
      return { success: true }
    }
    if (hasPassword) {
      return { success: false, error: 'Please enter your password to confirm.' }
    }
    return { success: false, error: 'Re-authentication is not supported for this sign-in method.' }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete the current Firebase Auth user. Call after backend has deleted user data.
 * Re-authenticates first if needed (pass { password } for email/password users).
 * This signs the user out.
 * @param {{ password?: string }} options - password required for email/password users to re-auth
 */
export const deleteAuthUser = async (options = {}) => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { success: false, error: 'You must be logged in to delete your account.' }
  }
  try {
    const reauth = await reauthenticateCurrentUser(options)
    if (!reauth.success) {
      return reauth
    }
    await firebaseDeleteUser(currentUser)
    return { success: true }
  } catch (error) {
    const msg = error.message || ''
    const needsReauth = msg.includes('requires-recent-login') || msg.includes('auth/requires-recent-login')
    return {
      success: false,
      error: needsReauth
        ? 'Please sign in again to confirm. Enter your password below, or we\'ll use the sign-in popup.'
        : error.message,
    }
  }
}
