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
    default: '#0d1b2a',   // deep navy
    paper: '#1b2838',     // navy blue surface
  },
  text: {
    primary: '#e8eef4',
    secondary: 'rgba(232, 238, 244, 0.75)',
  },
  divider: 'rgba(255, 255, 255, 0.1)',
  action: {
    hover: 'rgba(100, 181, 246, 0.12)',
    selected: 'rgba(100, 181, 246, 0.2)',
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

const radius = 16
const shape = { borderRadius: radius }

const components = {
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: radius, padding: '10px 24px' },
      contained: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: radius },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: `${radius}px !important`,
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: '0 !important' },
        '& + &': { marginTop: 1 },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: radius },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: radius },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: radius },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: { borderRadius: radius },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: { borderRadius: radius },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: { borderRadius: radius / 2 },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: radius },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: { '&:last-child': { paddingBottom: 2 } },
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
