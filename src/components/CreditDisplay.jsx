import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import { Info, Refresh } from '@mui/icons-material'

export const CreditDisplay = ({ credits, onRefresh }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'primary.light',
        padding: '8px 16px',
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
        {credits}
      </Typography>
      <Typography variant="body2" sx={{ color: 'primary.dark' }}>
        credits remaining
      </Typography>
      {onRefresh && (
        <IconButton size="small" onClick={onRefresh}>
          <Refresh fontSize="small" sx={{ color: 'primary.dark' }} />
        </IconButton>
      )}
      <Tooltip title="Standard quality: 2 credits per image. Fast/quick quality: 1 credit per image.">
        <IconButton size="small">
          <Info fontSize="small" sx={{ color: 'primary.dark' }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
