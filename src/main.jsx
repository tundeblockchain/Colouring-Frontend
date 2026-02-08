import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App'
import { getTheme } from './theme'
import { ThemeModeProvider, useThemeMode } from './contexts/ThemeModeContext'
import { initAnalytics } from './utils/analytics'
import './index.css'

initAnalytics()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const ThemeWrapper = ({ children }) => {
  const { mode } = useThemeMode()
  const theme = React.useMemo(() => getTheme(mode), [mode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeModeProvider>
            <ThemeWrapper>
              <App />
            </ThemeWrapper>
          </ThemeModeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
