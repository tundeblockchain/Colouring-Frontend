import { createTheme } from '@mui/material/styles'

const STORAGE_KEY = 'colorbliss-theme'

const sharedPalette = {
  primary: {
    main: '#64B5F6',
    light: '#90CAF9',
    dark: '#42A5F5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#81C784',
    light: '#A5D6A7',
    dark: '#66BB6A',
  },
}

const lightPalette = {
  ...sharedPalette,
  mode: 'light',
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
  },
  divider: '#E0E0E0',
  action: {
    hover: 'rgba(100, 181, 246, 0.08)',
    selected: 'rgba(100, 181, 246, 0.16)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
}

const darkPalette = {
  ...sharedPalette,
  mode: 'dark',
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
}

const typography = {
  fontFamily: [
    '"Nunito"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: { fontWeight: 700, fontSize: '2.5rem' },
  h2: { fontWeight: 700, fontSize: '2rem' },
  h3: { fontWeight: 600, fontSize: '1.75rem' },
  h4: { fontWeight: 600, fontSize: '1.5rem' },
  h5: { fontWeight: 600, fontSize: '1.25rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
  button: { textTransform: 'none', fontWeight: 500 },
}

const shape = { borderRadius: 8 }

const components = {
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 8, padding: '10px 24px' },
      contained: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 12 },
    },
  },
}

export const getTheme = (mode) =>
  createTheme({
    palette: mode === 'dark' ? darkPalette : lightPalette,
    typography,
    shape,
    components,
  })

export const getStoredThemeMode = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch (_) {}
  return 'light'
}

export const setStoredThemeMode = (mode) => {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch (_) {}
}
