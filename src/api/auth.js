import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
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
 * Delete the current Firebase Auth user. Call after backend has deleted user data.
 * This signs the user out.
 */
export const deleteAuthUser = async () => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { success: false, error: 'You must be logged in to delete your account.' }
  }
  try {
    await firebaseDeleteUser(currentUser)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
