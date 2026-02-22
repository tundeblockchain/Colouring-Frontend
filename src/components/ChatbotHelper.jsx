import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Close, Send, SmartToy } from '@mui/icons-material'
import { getChatbotResponse, suggestedQuestions } from '../content/chatbotKnowledge'

const DRAWER_WIDTH = 400
const DRAWER_HEIGHT = '70vh'

/** Renders text with **bold** as <strong> and newlines as <br /> */
function renderMessageText(text) {
  const lines = (text || '').split(/\n/)
  return lines.map((line, lineIdx) => {
    const parts = []
    let rest = line
    let key = 0
    while (rest.length > 0) {
      const m = rest.match(/\*\*(.*?)\*\*/)
      if (m) {
        if (m.index > 0) parts.push(<span key={`${lineIdx}-${key++}`}>{rest.slice(0, m.index)}</span>)
        parts.push(<strong key={`${lineIdx}-${key++}`}>{m[1]}</strong>)
        rest = rest.slice(m.index + m[0].length)
      } else {
        parts.push(<span key={`${lineIdx}-${key++}`}>{rest}</span>)
        break
      }
    }
    return <span key={lineIdx}>{parts}{lineIdx < lines.length - 1 && <br />}</span>
  })
}

const MessageBubble = ({ message, isUser }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 1.5,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        maxWidth: '85%',
        px: 2,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: isUser ? 'primary.main' : 'action.hover',
        color: isUser ? 'primary.contrastText' : 'text.primary',
        whiteSpace: 'pre-wrap',
        '& strong': { fontWeight: 600 },
      }}
    >
      <Typography component="span" variant="body2" sx={{ '& strong': { fontWeight: 600 } }}>
        {renderMessageText(message)}
      </Typography>
    </Paper>
  </Box>
)

export const ChatbotHelper = ({ open, onClose }) => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          text: "Hi! I'm your Color Charm helper. Ask me about creating colouring pages (text prompt, word art, photo), making a colouring book, credits and billing, folders, PDF download, or anything else about the app.",
          isUser: false,
        },
      ])
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (text) => {
    const trimmed = (text || input || '').trim()
    if (!trimmed) return

    const userMsg = { id: `u-${Date.now()}`, text: trimmed, isUser: true }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const reply = getChatbotResponse(trimmed)
    const botMsg = { id: `b-${Date.now()}`, text: reply, isUser: false }
    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg])
    }, 400)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSuggestionClick = (question) => {
    sendMessage(question)
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>
            Color Charm Helper
          </Typography>
        </Box>
        <IconButton aria-label="Close chatbot" onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
        ))}
        {(() => {
          const lastMsg = messages[messages.length - 1]
          const showSuggestions = messages.length === 1 || (lastMsg && !lastMsg.isUser)
          if (!showSuggestions) return null
          return (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                {messages.length === 1 ? 'Try a suggestion:' : 'Ask something else:'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                {suggestedQuestions.slice(0, 6).map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    size="small"
                    onClick={() => handleSuggestionClick(q)}
                    sx={{
                      borderRadius: 2,
                      maxWidth: '100%',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  />
                ))}
              </Box>
            </>
          )
        })()}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder="Ask anything about Color Charm..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send />
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 2 },
          }}
        />
      </Box>
    </Box>
  )

  return (
    <Drawer
      anchor={isSmall ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isSmall ? '100%' : DRAWER_WIDTH,
          maxWidth: '100%',
          height: isSmall ? DRAWER_HEIGHT : '100%',
          maxHeight: '100%',
          borderTopLeftRadius: isSmall ? 16 : 0,
          borderTopRightRadius: isSmall ? 16 : 0,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}
