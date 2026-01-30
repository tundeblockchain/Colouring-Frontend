import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { getStoredThemeMode, setStoredThemeMode } from '../theme'

const ThemeModeContext = createContext(null)

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider')
  }
  return context
}

export const ThemeModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(getStoredThemeMode)

  const setMode = useCallback((newMode) => {
    setModeState(newMode)
    setStoredThemeMode(newMode)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      setStoredThemeMode(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode]
  )

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  )
}
