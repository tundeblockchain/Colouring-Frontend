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
import { useDeductCredits } from '../hooks/useUser'

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
    initialTab === 'wordArt' || initialTab === 'drawing' ? 'text' : initialTab
  )
  const [prompt, setPrompt] = useState('alien mother ship, crashing at beach.')
  const [autoImprove, setAutoImprove] = useState(true)
  const [quality, setQuality] = useState('fast')
  const [dimensions, setDimensions] = useState('2:3')
  const [numImages, setNumImages] = useState(1)
  const [autoUpscale, setAutoUpscale] = useState(false)
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState(null)
  const [imageAspectRatio, setImageAspectRatio] = useState(null)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    const tabPath = Object.keys(tabTypes).find(key => tabTypes[key] === newValue)
    navigate(`/create/${tabPath}`)
  }

  const handleGenerate = async () => {
    if (!user || !userProfile) {
      return
    }

    if (userProfile.credits < 1) {
      alert('Insufficient credits. Please upgrade your plan.')
      return
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    try {
      // Generate coloring page (backend automatically deducts credits)
      const result = await generateMutation.mutateAsync({
        userId: user.uid,
        prompt: prompt.trim(),
        title: prompt.trim(),
        type: activeTab,
        quality,
        dimensions,
        folderId: null, // Can be updated later to support folder selection
      })

      if (result.success) {
        const imageUrl = result.data?.imageUrl || result.data?.thumbnailUrl
        if (imageUrl) {
          setGeneratedPreviewUrl(imageUrl)
          setImageAspectRatio(null)
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
              maxWidth: 280,
              maxHeight: '70vh',
              aspectRatio: generatedPreviewUrl && imageAspectRatio != null
                ? imageAspectRatio
                : (aspectRatioMap[dimensions] || '2/3'),
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
                  Creating your coloring page...
                </Typography>
              </Box>
            ) : generatedPreviewUrl ? (
              <Box
                component="img"
                src={generatedPreviewUrl}
                alt="Generated coloring page"
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.target
                  if (naturalWidth && naturalHeight) {
                    setImageAspectRatio(`${naturalWidth} / ${naturalHeight}`)
                  }
                }}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center',
                  px: 2,
                }}
              >
                Preview • Your coloring page will appear here
              </Typography>
            )}
          </Box>
          {generatedPreviewUrl && (
            <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 280 }}>
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => navigate('/gallery')}
                sx={{
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
                  setGeneratedPreviewUrl(null)
                  setImageAspectRatio(null)
                }}
                sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'rgba(255,255,255,0.9)' }}
              >
                Create another
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ width: 500, backgroundColor: 'background.paper', borderRadius: 2, padding: 3, overflowY: 'auto' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ marginBottom: 3 }}>
            <Tab label="Text Prompt" value="text" />
            {/* Word Art and Drawing tabs hidden for now */}
            <Tab label="Photo" value="photo" />
          </Tabs>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, marginBottom: 1 }}>
            Create a coloring page from a text prompt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
            Describe your coloring page in natural language. Don't stress about your prompt, our AI will automatically improve it for you.
          </Typography>

          <Box sx={{ marginBottom: 3 }}>
            <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
              Describe your coloring page.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="alien mother ship, crashing at beach."
              sx={{ marginBottom: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, marginBottom: 1 }}>
              <Button
                size="small"
                startIcon={<AutoAwesome />}
                sx={{ color: 'text.secondary' }}
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
            <FormControlLabel
              control={
                <Switch
                  checked={autoImprove}
                  onChange={(e) => setAutoImprove(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-improve"
            />
          </Box>

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

          <Accordion defaultExpanded sx={{ marginTop: 2 }}>
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
                    onChange={(e) => setNumImages(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: canGenerateMultiple ? 4 : 1 }}
                    sx={{ width: 80 }}
                    size="small"
                    disabled={!canGenerateMultiple}
                  />
                  <Slider
                    value={numImages}
                    onChange={(e, value) => setNumImages(value)}
                    min={1}
                    max={canGenerateMultiple ? 4 : 1}
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
            disabled={generateMutation.isPending || !prompt.trim()}
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
