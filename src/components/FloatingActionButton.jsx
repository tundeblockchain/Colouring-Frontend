import { Fab } from '@mui/material'
import { Check } from '@mui/icons-material'

export const FloatingActionButton = ({ onClick, ...props }) => {
  return (
    <Fab
      color="primary"
      aria-label="check"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        backgroundColor: 'primary.main',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      }}
      {...props}
    >
      <Check />
    </Fab>
  )
}
