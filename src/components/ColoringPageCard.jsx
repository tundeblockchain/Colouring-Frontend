import { useState } from 'react'
import {
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Checkbox,
  CircularProgress,
  useTheme,
  Dialog,
  DialogContent,
  Box,
  Button,
  Stack,
} from '@mui/material'
import { Favorite, Download, MoreVert, DriveFileMoveOutlined, Print, Close } from '@mui/icons-material'
import { downloadImage, printColoringPages } from '../utils/downloadImage'
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

const PDF_UPGRADE_MESSAGE = 'Download as PDF is available on Hobby, Artist and Business plans. Upgrade to unlock this feature.'

const checkboxSx = {
  position: 'absolute',
  top: 8,
  left: 8,
  color: 'white',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(6px)',
  padding: 0.5,
  '&.Mui-checked': {
    color: 'primary.light',
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
}

export const ColoringPageCard = ({
  page,
  onToggleFavorite,
  isFavoritePending,
  draggable: isDraggable = false,
  canDownloadPdf = true,
  selectable = false,
  selected = false,
  onSelect,
  onDragStart,
  onRemoveFromFolder,
  userId,
}) => {
  const imageUrl = page.imageUrl || page.thumbnailUrl
  const titleTrim = (page.title || '').trim()
  const promptTrim = (page.prompt || '').trim()
  const showPromptInPreview = Boolean(promptTrim && promptTrim !== titleTrim)
  const theme = useTheme()
  const { showToast } = useToast()
  const [downloadAnchor, setDownloadAnchor] = useState(null)
  const [moreAnchor, setMoreAnchor] = useState(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleDownloadClick = (e) => {
    setDownloadAnchor(e.currentTarget)
  }
  const handleDownloadClose = () => setDownloadAnchor(null)

  const handleDownload = async (format) => {
    handleDownloadClose()
    if (format === 'pdf' && !canDownloadPdf) {
      showToast(PDF_UPGRADE_MESSAGE, 'info')
      return
    }
    setDownloadLoading(true)
    try {
      await downloadImage(imageUrl, page.title, format, page.id, userId)
      showToast(`Downloaded as ${format.toUpperCase()}`)
    } catch (error) {
      showToast(error.message || 'Failed to download image', 'error')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handlePrint = async (e) => {
    e?.stopPropagation?.()
    setPrintLoading(true)
    try {
      await printColoringPages(
        [{ url: imageUrl, title: page.title, id: page.id }],
        userId,
      )
    } catch (error) {
      showToast(error.message || 'Failed to print', 'error')
    } finally {
      setPrintLoading(false)
    }
  }

  const handlePreviewOpen = (e) => {
    e.stopPropagation()
    setPreviewOpen(true)
  }

  const handlePreviewClose = () => setPreviewOpen(false)

  const handleDragStart = (e) => {
    if (!isDraggable) return
    if (onDragStart) {
      onDragStart(e)
    } else {
      e.dataTransfer.setData(DRAG_TYPE, page.id)
      e.dataTransfer.effectAllowed = 'move'
    }
    const el = e.currentTarget
    el.style.opacity = '0.85'
    el.style.transform = 'scale(1.05)'
    el.style.boxShadow = '0 12px 24px rgba(0,0,0,0.35)'
    el.style.zIndex = '1000'
    el.style.border = '3px solid'
    el.style.borderColor = theme.palette.primary.main
  }

  const handleDragEnd = (e) => {
    const el = e.currentTarget
    el.style.opacity = ''
    el.style.transform = ''
    el.style.boxShadow = ''
    el.style.zIndex = ''
    el.style.border = ''
    el.style.borderColor = ''
  }

  return (
    <Card
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      onClick={selectable ? () => onSelect?.() : undefined}
      sx={{
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: selectable ? 'pointer' : isDraggable ? 'grab' : undefined,
        '&:active': isDraggable && !selectable ? { cursor: 'grabbing' } : undefined,
        border: selected ? '3px solid' : undefined,
        borderColor: selected ? 'primary.main' : undefined,
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
        onClick={handlePreviewOpen}
        sx={{ objectFit: 'cover', cursor: 'zoom-in' }}
      />
      {selectable && (
        <Checkbox
          checked={selected}
          onChange={() => onSelect?.()}
          onClick={(e) => e.stopPropagation()}
          sx={checkboxSx}
          size="small"
        />
      )}
      <IconButton
        onClick={(e) => {
          e.stopPropagation()
          handleDownloadClick(e)
        }}
        disabled={downloadLoading}
        sx={{ ...iconButtonSx, left: selectable ? 44 : 8 }}
        aria-label="Download"
      >
        {downloadLoading ? <CircularProgress size={20} color="inherit" /> : <Download />}
      </IconButton>
      <IconButton
        onClick={handlePrint}
        disabled={printLoading}
        sx={{ ...iconButtonSx, left: selectable ? 92 : 56 }}
        aria-label="Print"
      >
        {printLoading ? <CircularProgress size={20} color="inherit" /> : <Print />}
      </IconButton>
      <Menu
        anchorEl={downloadAnchor}
        open={Boolean(downloadAnchor)}
        onClose={handleDownloadClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => handleDownload('png')}>Download as PNG</MenuItem>
        <MenuItem
          onClick={() => handleDownload('pdf')}
          disabled={!canDownloadPdf}
          sx={!canDownloadPdf ? { opacity: 0.7 } : {}}
        >
          Download as PDF{!canDownloadPdf ? ' (Upgrade required)' : ''}
        </MenuItem>
      </Menu>
      {onRemoveFromFolder && (
        <>
          <IconButton
            onClick={(e) => { e.stopPropagation(); setMoreAnchor(e.currentTarget) }}
            sx={{ ...iconButtonSx, right: 8 }}
            aria-label="More actions"
          >
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={moreAnchor}
            open={Boolean(moreAnchor)}
            onClose={() => setMoreAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                setMoreAnchor(null)
                onRemoveFromFolder(page.id)
              }}
            >
              <DriveFileMoveOutlined sx={{ mr: 1, fontSize: 20 }} />
              Remove from folder
            </MenuItem>
          </Menu>
        </>
      )}
      <IconButton
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(page.id)
        }}
        disabled={isFavoritePending}
        sx={{ ...iconButtonSx, right: onRemoveFromFolder ? 52 : 8 }}
      >
        <Favorite
          sx={{
            color: page.isFavorite ? 'primary.light' : 'white',
          }}
        />
      </IconButton>
      <CardContent sx={{ pt: 1.5, pb: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="body2" fontWeight={500} noWrap>
          {page.title}
        </Typography>
      </CardContent>
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          },
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={handlePreviewClose} aria-label="Close preview">
              <Close />
            </IconButton>
          </Box>
          <Box
            component="img"
            src={imageUrl}
            alt={page.title}
            sx={{
              width: '100%',
              maxHeight: { xs: '50vh', sm: '62vh' },
              objectFit: 'contain',
              borderRadius: 2,
              backgroundColor: 'action.hover',
              mb: 2,
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {page.title}
          </Typography>
          {showPromptInPreview ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {page.prompt}
            </Typography>
          ) : null}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ mt: 2, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Download />}
                disabled={downloadLoading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownloadClick(e)
                }}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={printLoading ? <CircularProgress size={16} color="inherit" /> : <Print />}
                disabled={printLoading}
                onClick={handlePrint}
              >
                Print
              </Button>
              <Button
                variant={page.isFavorite ? 'contained' : 'outlined'}
                color="secondary"
                startIcon={<Favorite />}
                disabled={isFavoritePending}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(page.id)
                }}
              >
                {page.isFavorite ? 'Favourited' : 'Add to favourites'}
              </Button>
            </Stack>
            {onRemoveFromFolder ? (
              <Button
                variant="text"
                color="error"
                startIcon={<DriveFileMoveOutlined />}
                onClick={() => {
                  onRemoveFromFolder(page.id)
                  handlePreviewClose()
                }}
              >
                Remove from folder
              </Button>
            ) : null}
          </Stack>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
