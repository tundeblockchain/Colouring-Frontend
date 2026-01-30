import { Card, CardMedia, CardContent, IconButton, Typography } from '@mui/material'
import { Favorite, Download } from '@mui/icons-material'
import { downloadImage } from '../utils/downloadImage'
import { useToast } from '../contexts/ToastContext'

const iconButtonSx = {
  position: 'absolute',
  top: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(6px)',
  color: 'white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
  },
}

const DRAG_TYPE = 'application/x-coloring-page-id'

export const ColoringPageCard = ({
  page,
  onToggleFavorite,
  isFavoritePending,
  draggable: isDraggable = false,
}) => {
  const imageUrl = page.imageUrl || page.thumbnailUrl
  const { showToast } = useToast()

  const handleDownload = () => {
    downloadImage(imageUrl, page.title)
    showToast('Download complete')
  }

  const handleDragStart = (e) => {
    if (!isDraggable) return
    e.dataTransfer.setData(DRAG_TYPE, page.id)
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  return (
    <Card
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      sx={{
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: isDraggable ? 'grab' : undefined,
        '&:active': isDraggable ? { cursor: 'grabbing' } : undefined,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardMedia
        component="img"
        height="300"
        image={imageUrl}
        alt={page.title}
        sx={{ objectFit: 'cover' }}
      />
      <IconButton
        onClick={handleDownload}
        sx={{ ...iconButtonSx, left: 8 }}
      >
        <Download />
      </IconButton>
      <IconButton
        onClick={() => onToggleFavorite(page.id)}
        disabled={isFavoritePending}
        sx={{ ...iconButtonSx, right: 8 }}
      >
        <Favorite
          sx={{
            color: page.isFavorite ? 'primary.light' : 'white',
          }}
        />
      </IconButton>
      <CardContent>
        <Typography variant="body2" fontWeight={500} noWrap>
          {page.title}
        </Typography>
      </CardContent>
    </Card>
  )
}
