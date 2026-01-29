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
  const [style, setStyle] = useState('fast')
  const [dimensions, setDimensions] = useState('2:3')
  const [numImages, setNumImages] = useState(1)
  const [autoUpscale, setAutoUpscale] = useState(false)

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
        style,
        dimensions,
        folderId: null, // Can be updated later to support folder selection
      })

      if (result.success) {
        // Update user credits from response if available
        if (result.creditsRemaining !== undefined) {
          // Credits are automatically updated via query invalidation
        }
        navigate('/gallery')
      } else {
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

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 100px)' }}>
        <Box sx={{ flex: 1, backgroundColor: '#282828', borderRadius: 2, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No folders yet. Create one to get started!
          </Typography>
        </Box>

        <Box sx={{ width: 500, backgroundColor: '#FFFFFF', borderRadius: 2, padding: 3, overflowY: 'auto' }}>
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
              <Typography variant="body2" color="text.secondary">
                Tips for creating better prompts will go here...
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ marginBottom: 3 }}>
                <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
                  Style
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 1, display: 'block' }}>
                  Learn more about premium styles and see examples here.
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                  size="small"
                >
                  <option value="fast">Fast - fast generation and can handle a variety of styles. Can handle very simple...</option>
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ marginTop: 1, display: 'block' }}>
                  Looking for a different style? Let me know at ben@colorbliss.com and I can add it!
                </Typography>
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
                    <FormControlLabel value="2:3" control={<Radio />} label="2:3 (default)" />
                    <FormControlLabel value="1:1" control={<Radio />} label="1:1 (square)" />
                    <FormControlLabel value="3:2" control={<Radio />} label="3:2 (landscape)" />
                    <FormControlLabel value="A4" control={<Radio />} label="A4 (portrait)" />
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
                      sx={{ marginLeft: 2, backgroundColor: '#81C784' }}
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
              backgroundColor: '#81C784',
              '&:hover': {
                backgroundColor: '#66BB6A',
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
