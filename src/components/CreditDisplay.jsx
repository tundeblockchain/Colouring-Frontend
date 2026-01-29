import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import { Info, Refresh } from '@mui/icons-material'

export const CreditDisplay = ({ credits, onRefresh }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: '#E8F5E9',
        padding: '8px 16px',
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
        {credits}
      </Typography>
      <Typography variant="body2" sx={{ color: '#2E7D32' }}>
        credits remaining
      </Typography>
      {onRefresh && (
        <IconButton size="small" onClick={onRefresh}>
          <Refresh fontSize="small" sx={{ color: '#2E7D32' }} />
        </IconButton>
      )}
      <Tooltip title="Credits are used when generating coloring pages">
        <IconButton size="small">
          <Info fontSize="small" sx={{ color: '#2E7D32' }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
