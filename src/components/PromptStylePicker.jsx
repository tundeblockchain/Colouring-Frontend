import { useState, useMemo } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'

const STANDARD_ID = 'standard'
const THUMB_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

function PresetThumbnail({ presetId, label }) {
  const [extIdx, setExtIdx] = useState(0)
  const exhausted = extIdx >= THUMB_EXTENSIONS.length
  const src = exhausted
    ? null
    : `/templates/${presetId}.${THUMB_EXTENSIONS[extIdx]}`

  if (exhausted) {
    return (
      <Box
        sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          color: 'text.secondary',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        {label?.slice(0, 1) ?? '?'}
      </Box>
    )
  }

  return (
    <Box
      component="img"
      src={src}
      alt={label || 'Style preview'}
      loading="lazy"
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      }}
      onError={() => setExtIdx((i) => i + 1)}
    />
  )
}

/**
 * Server presets plus local "standard" option. Thumbnails live under `/templates/{id}.{ext}`.
 */
export const PromptStylePicker = ({
  value,
  onChange,
  presets = [],
  loading,
  disabled,
}) => {
  const options = useMemo(() => {
    const sorted = [...presets].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )
    return [
      { id: STANDARD_ID, name: 'Standard', sortOrder: -1 },
      ...sorted.map((p) => ({ id: p.id, name: p.name || p.id, sortOrder: p.sortOrder })),
    ]
  }, [presets])

  return (
    <Box sx={{ mb: 0 }}>
      <Box
        sx={(theme) => ({
          px: 2,
          py: 1.5,
          pb: 2,
          borderRadius: 2,
          bgcolor: 'background.default',
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Typography
          variant="subtitle2"
          component="h3"
          color="text.primary"
          sx={{ fontWeight: 600, mb: 1, letterSpacing: 0.2 }}
        >
          Art style
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: 'block',
            mb: loading ? 1.5 : 2,
            lineHeight: 1.5,
            maxWidth: 'md',
          }}
        >
          Choose how outlines and shading should look. Standard uses the default model style.
        </Typography>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <CircularProgress size={18} color="primary" />
            <Typography variant="body2" color="text.secondary">
              Loading styles…
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={(theme) => ({
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
          py: 1.5,
          px: 2,
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: theme.spacing(2),
          scrollPaddingRight: theme.spacing(2),
          WebkitOverflowScrolling: 'touch',
          scrollbarColor: `${theme.palette.action.selected} ${theme.palette.action.hover}`,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.action.hover,
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.action.selected,
            borderRadius: 4,
            '&:hover': {
              backgroundColor: theme.palette.action.active,
            },
          },
        })}
      >
        {options.map((opt) => {
          const selected = value === opt.id
          return (
            <Box
              key={opt.id}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              sx={(theme) => ({
                flex: '0 0 auto',
                scrollSnapAlign: 'start',
                width: 120,
                p: 0,
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                color: 'text.primary',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
                overflow: 'hidden',
                textAlign: 'left',
                transition: theme.transitions.create(['border-color', 'box-shadow'], {
                  duration: theme.transitions.duration.shorter,
                }),
                boxShadow: selected ? theme.shadows[3] : theme.shadows[0],
                '&:hover': {
                  borderColor: disabled ? 'divider' : 'primary.light',
                },
              })}
            >
              <Box sx={{ width: '100%', aspectRatio: '1 / 1', bgcolor: 'action.hover' }}>
                <PresetThumbnail presetId={opt.id} label={opt.name} />
              </Box>
              <Typography
                variant="caption"
                color="text.primary"
                sx={(theme) => ({
                  display: 'block',
                  px: 1.5,
                  py: 1.25,
                  fontWeight: selected ? 600 : 500,
                  lineHeight: 1.35,
                  borderTop: `1px solid ${theme.palette.divider}`,
                })}
              >
                {opt.name}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export const STANDARD_PROMPT_STYLE_ID = STANDARD_ID
