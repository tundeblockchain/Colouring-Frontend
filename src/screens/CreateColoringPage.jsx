import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  RadioGroup,
  FormControl,
  FormLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  ExpandMore,
  AutoAwesome,
  Shuffle,
} from '@mui/icons-material'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { useGenerateColoringPage } from '../hooks/useColoringPages'
import { pollColoringPageUntilComplete } from '../api/coloringPages'
import { improvePrompt } from '../api/prompts'
import { ColoringPage } from '../models/coloringPage'

const tabTypes = {
  text: 'text',
  'word-art': 'wordArt',
  drawing: 'drawing',
  photo: 'photo',
}

export const CreateColoringPage = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: userProfile } = useUser(user?.uid)
  const generateMutation = useGenerateColoringPage()

  const initialTab = tabTypes[type] || 'text'
  const [activeTab, setActiveTab] = useState(
    initialTab === 'drawing' ? 'text' : initialTab
  )
  const [prompt, setPrompt] = useState(initialTab === 'photo' ? 'simple lines' : 'fancy anime footballer')
  const [improveLoading, setImproveLoading] = useState(false)
  const [quality, setQuality] = useState('fast')
  const [dimensions, setDimensions] = useState('2:3')
  const [numImages, setNumImages] = useState(1)
  const [autoUpscale, setAutoUpscale] = useState(false)
  const [generatedPreviews, setGeneratedPreviews] = useState([])
  const [imageAspectRatio, setImageAspectRatio] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [wordArtStyle, setWordArtStyle] = useState('bubble')

  const handleTabChange = (event, newValue) => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
      setPhotoPreviewUrl(null)
    }
    setPhotoFile(null)
    if (newValue === 'photo') setPrompt('simple lines')
    setActiveTab(newValue)
    const tabPath = Object.keys(tabTypes).find(key => tabTypes[key] === newValue)
    navigate(`/create/${tabPath}`)
  }

  const handleImprove = async () => {
    if (!user?.uid || !prompt.trim()) return
    setImproveLoading(true)
    try {
      const result = await improvePrompt(user.uid, { prompt: prompt.trim() })
      if (result.success && result.data?.improvedPrompt) {
        setPrompt(result.data.improvedPrompt)
      } else {
        alert(result.error || 'Failed to improve prompt')
      }
    } catch (err) {
      console.error('Improve prompt error:', err)
      alert(err.message || 'Failed to improve prompt')
    } finally {
      setImproveLoading(false)
    }
  }

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
      setPhotoPreviewUrl(null)
    }
    setPhotoFile(file || null)
    if (file) {
      setPhotoPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleGenerate = async () => {
    if (!user || !userProfile) {
      return
    }

    const count = Math.min(6, Math.max(1, numImages))
    if (userProfile.credits < count) {
      alert(`Insufficient credits. You need ${count} credit(s). Please upgrade your plan.`)
      return
    }

    if (activeTab === 'photo') {
      if (!photoFile) {
        alert('Please upload a photo')
        return
      }
    } else if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    try {
      const result = await generateMutation.mutateAsync({
        userId: user.uid,
        prompt: prompt.trim(),
        title: prompt.trim() || (activeTab === 'photo' ? 'Photo coloring page' : ''),
        type: activeTab,
        quality,
        dimensions,
        folderId: null,
        numImages: count,
        ...(activeTab === 'photo' && photoFile ? { imageFile: photoFile } : {}),
        ...(activeTab === 'wordArt' ? { wordArtStyle } : {}),
      })

      if (result.success) {
        const pages = result.data?.coloringPages ?? (result.data?.id ? [result.data] : [])
        const previewPages = Array.isArray(pages) ? pages : [pages]
        if (previewPages.length) {
          setGeneratedPreviews(previewPages)
          setImageAspectRatio(null)
          if (activeTab === 'photo' && photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl)
            setPhotoPreviewUrl(null)
          }
          setPhotoFile(null)
          // Poll each page until completed or failed (async generation)
          previewPages.forEach((page) => {
            if (!page.id) return
            pollColoringPageUntilComplete(user.uid, page.id)
              .then((completedPage) => {
                setGeneratedPreviews((prev) =>
                  prev.map((p) => (p.id === completedPage.id ? completedPage : p))
                )
              })
              .catch((err) => {
                const failedPage = new ColoringPage({
                  ...Object.assign({}, page),
                  status: 'failed',
                  errorMessage: err.message || 'Generation failed',
                })
                setGeneratedPreviews((prev) =>
                  prev.map((p) => (p.id === page.id ? failedPage : p))
                )
              })
          })
        }
      }
      if (!result.success) {
        const errorMessage = result.error || 'Failed to generate coloring page'
        if (result.status === 402) {
          alert('Insufficient credits. Please upgrade your plan.')
        } else {
          alert(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error generating coloring page:', error)
      const errorMessage = error.message || 'Failed to generate coloring page'
      if (error.status === 402) {
        alert('Insufficient credits. Please upgrade your plan.')
      } else {
        alert(errorMessage)
      }
    }
  }

  const isFreePlan = userProfile?.plan === 'free'
  const canGenerateMultiple = !isFreePlan

  const aspectRatioMap = { '1:1': '1', '2:3': '2/3', '3:2': '3/2' }
  const hasPreviews = generatedPreviews.length > 0

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 100px)' }}>
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: 2,
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: hasPreviews ? 560 : 280,
              ...(hasPreviews
                ? { flex: 1, minHeight: 0, minWidth: 0 }
                : {
                    maxHeight: '70vh',
                    aspectRatio: imageAspectRatio != null
                      ? imageAspectRatio
                      : (aspectRatioMap[dimensions] || '2/3'),
                  }),
              backgroundColor: '#000000',
              borderRadius: 2,
              border: '2px dashed rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {generateMutation.isPending ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress sx={{ color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Creating {numImages > 1 ? `${numImages} coloring pages` : 'your coloring page'}...
                </Typography>
              </Box>
            ) : hasPreviews ? (
              <Box
                sx={{
                  display: 'grid',
                  width: '100%',
                  height: '100%',
                  gap: 1,
                  p: 1,
                  boxSizing: 'border-box',
                  ...(generatedPreviews.length === 1
                    ? { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
                    : generatedPreviews.length === 2
                      ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
                      : generatedPreviews.length <= 4
                        ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
                        : { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }),
                }}
              >
                {generatedPreviews.map((page, index) => {
                  const url = page.imageUrl || page.thumbnailUrl
                  const isProcessing = page.status === 'processing' || (!url && page.status !== 'failed')
                  const isFailed = page.status === 'failed'
                  return (
                    <Box
                      key={page.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        minHeight: 0,
                        minWidth: 0,
                        borderRadius: 1,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {isProcessing && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={40} sx={{ color: 'primary.main' }} />
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Generating…
                          </Typography>
                        </Box>
                      )}
                      {isFailed && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'error.light',
                            textAlign: 'center',
                            px: 1,
                            fontSize: '0.875rem',
                          }}
                        >
                          {page.errorMessage || 'Generation failed'}
                        </Typography>
                      )}
                      {!isProcessing && !isFailed && url && (
                        <Box
                          component="img"
                          src={url}
                          alt={page.title || `Generated ${index + 1}`}
                          onLoad={(e) => {
                            if (generatedPreviews.length === 1 && imageAspectRatio == null) {
                              const { naturalWidth, naturalHeight } = e.target
                              if (naturalWidth && naturalHeight) {
                                setImageAspectRatio(`${naturalWidth} / ${naturalHeight}`)
                              }
                            }
                          }}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </Box>
                  )
                })}
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center',
                  px: 2,
                }}
              >
                Preview • Your coloring page{numImages > 1 ? 's' : ''} will appear here
              </Typography>
            )}
          </Box>
          {hasPreviews && (
            <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 560 }}>
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate('/gallery')}
                sx={{
                  flex: 1,
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                View in gallery
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setGeneratedPreviews([])
                  setImageAspectRatio(null)
                }}
                sx={{
                  flex: 1,
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                Create another
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ width: 500, backgroundColor: 'background.paper', borderRadius: 2, padding: 3, overflowY: 'auto' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ marginBottom: 3 }}>
            <Tab label="Text Prompt" value="text" />
            <Tab label="Word Art" value="wordArt" />
            <Tab label="Photo" value="photo" />
          </Tabs>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, marginBottom: 1 }}>
            {activeTab === 'wordArt'
              ? 'Create a coloring page with words, names, and numbers'
              : activeTab === 'photo'
                ? 'Turn your photo into a coloring page'
                : 'Create a coloring page from a text prompt'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
            {activeTab === 'wordArt'
              ? 'Enter words, a name, or numbers to turn them into a coloring page.'
              : activeTab === 'photo'
                ? 'Upload a photo and we\'ll turn it into a coloring page.'
                : 'Describe your coloring page in natural language. Don\'t stress about your prompt, our AI will automatically improve it for you.'}
          </Typography>

          {activeTab === 'photo' && (
            <Box sx={{ marginBottom: 3 }}>
              <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
                Upload a photo
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2, py: 2, borderStyle: 'dashed' }}
              >
                {photoFile ? photoFile.name : 'Choose image (JPG, PNG, etc.)'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                />
              </Button>
              {photoPreviewUrl && (
                <Box
                  sx={{
                    width: '100%',
                    maxHeight: 200,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={photoPreviewUrl}
                    alt="Preview"
                    sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'contain', display: 'block' }}
                  />
                </Box>
              )}
              <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500, color: 'text.secondary' }}>
                Style hint (optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. cartoon style, simple lines"
                sx={{ marginBottom: 1 }}
              />
            </Box>
          )}

          {activeTab === 'wordArt' && (
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
                Style
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={wordArtStyle}
                onChange={(e) => setWordArtStyle(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ marginBottom: 2 }}
              >
                <option value="bubble">Bubble letters</option>
                <option value="graffiti">Graffiti</option>
                <option value="cursive">Cursive</option>
                <option value="block">Block letters</option>
                <option value="3d">3D</option>
                <option value="stencil">Stencil</option>
                <option value="comic">Comic</option>
                <option value="fancy">Fancy / decorative</option>
              </TextField>
            </Box>
          )}

          {activeTab !== 'photo' && (
          <Box sx={{ marginBottom: 3 }}>
            <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
              {activeTab === 'wordArt' ? 'Words, name, or numbers.' : 'Describe your coloring page.'}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={activeTab === 'wordArt' ? 2 : 4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'wordArt' ? 'e.g. Happy Birthday, Emma, 2024' : 'alien mother ship, crashing at beach.'}
              sx={{ marginBottom: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, marginBottom: 1 }}>
              <Button
                size="small"
                startIcon={improveLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                sx={{ color: 'text.secondary' }}
                onClick={handleImprove}
                disabled={improveLoading || !prompt.trim()}
              >
                Improve
              </Button>
              <Button
                size="small"
                startIcon={<Shuffle />}
                sx={{ color: 'text.secondary' }}
              >
                Shuffle
              </Button>
            </Box>
          </Box>
          )}

          {activeTab !== 'photo' && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Prompting tips
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="span" sx={{ display: 'block' }}>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                  Describe the image you want to see. You can use a simple prompt, like &quot;A unicorn at the Grand Canyon&quot;.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 1, fontWeight: 500 }}>
                  The best prompts include:
                </Typography>
                <Typography variant="body2" color="text.secondary" component="ul" sx={{ margin: 0, pl: 2.5 }}>
                  <li style={{ marginBottom: 4 }}><strong>A subject</strong> – what or who is in the image</li>
                  <li style={{ marginBottom: 4 }}><strong>A pose</strong> – try &quot;Diagonal pose&quot;, &quot;Turned slightly to the side&quot;, &quot;Straight-on view&quot;</li>
                  <li style={{ marginBottom: 4 }}><strong>A setting</strong> – where the scene takes place</li>
                  <li style={{ marginBottom: 4 }}><strong>A composition</strong> – try &quot;close up&quot;, &quot;full body&quot;, &quot;from behind&quot;</li>
                  <li><strong>An artistic style</strong> – try &quot;Manga&quot;, &quot;Cartoon&quot;, &quot;Kawaii&quot;, &quot;Stained Glass&quot;, etc.</li>
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
          )}

          <Accordion defaultExpanded sx={{ marginTop: activeTab === 'photo' ? 0 : 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ marginBottom: 3 }}>
                <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
                  Quality
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 1, display: 'block' }}>
                  Higher quality may take longer to generate.
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                  size="small"
                >
                  <option value="fast">Fast – quicker generation, good for most prompts</option>
                  <option value="standard">Standard – balanced quality and speed</option>
                </TextField>
              </Box>

              <Box sx={{ marginBottom: 3 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 1 }}>
                    Dimensions
                  </FormLabel>
                  <RadioGroup
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                  >
                    <FormControlLabel value="1:1" control={<Radio />} label="Square" />
                    <FormControlLabel value="2:3" control={<Radio />} label="Portrait (default)" />
                    <FormControlLabel value="3:2" control={<Radio />} label="Landscape" />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
                  Number of Images
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                  <TextField
                    type="number"
                    value={numImages}
                    onChange={(e) => setNumImages(Math.min(6, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    inputProps={{ min: 1, max: canGenerateMultiple ? 6 : 1 }}
                    sx={{ width: 80 }}
                    size="small"
                    disabled={!canGenerateMultiple}
                  />
                  <Slider
                    value={numImages}
                    onChange={(e, value) => setNumImages(value)}
                    min={1}
                    max={canGenerateMultiple ? 6 : 1}
                    step={1}
                    sx={{ flex: 1 }}
                    disabled={!canGenerateMultiple}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoUpscale}
                      onChange={(e) => setAutoUpscale(e.target.checked)}
                      size="small"
                      disabled={!canGenerateMultiple}
                    />
                  }
                  label="Auto upscale"
                />
                {isFreePlan && (
                  <Alert severity="info" sx={{ marginTop: 2 }}>
                    Upgrade to the Artist plan to generate more than 1 image at a time, automatically upscale your images and more!
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ marginLeft: 2 }}
                      onClick={() => navigate('/profile')}
                    >
                      Upgrade Now!
                    </Button>
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Button
            fullWidth
            variant="contained"
            onClick={handleGenerate}
            disabled={
              generateMutation.isPending ||
              (activeTab === 'photo' ? !photoFile : !prompt.trim())
            }
            sx={{
              marginTop: 3,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {generateMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Make my coloring sheet!'
            )}
          </Button>
        </Box>
      </Box>
    </MainLayout>
  )
}
