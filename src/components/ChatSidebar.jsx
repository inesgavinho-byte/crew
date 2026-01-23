import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNotifications } from '../lib/NotificationContext'
import { 
  supabase, 
  getChatMessages, 
  sendChatMessage, 
  sendPhotoMessage, 
  sendLocationMessage, 
  sendPollMessage,
  respondToPoll,
  subscribeToChatMessages,
  uploadImage,
  getSpots
} from '../lib/supabase'
import { PinIcon, CameraIcon } from './Icons'

// Chat Icons
const SendIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 2 L11 13"/>
    <path d="M22 2 L15 22 L11 13 L2 9 L22 2"/>
  </svg>
)

const PollIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 6 L4 18"/>
    <path d="M4 10 L14 10"/>
    <path d="M4 14 L10 14"/>
    <path d="M18 8 L18 16"/>
    <circle cx="18" cy="6" r="2"/>
    <circle cx="18" cy="18" r="2"/>
  </svg>
)

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 L6 18"/>
    <path d="M6 6 L18 18"/>
  </svg>
)

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12 L10 17 L19 7"/>
  </svg>
)

const CrossIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 L6 18"/>
    <path d="M6 6 L18 18"/>
  </svg>
)

// Format time
const formatTime = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
}

export default function ChatSidebar({ crew, onClose }) {
  const { user, profile } = useAuth()
  const { addNotification } = useNotifications()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [spots, setSpots] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (crew?.id) {
      loadMessages()
      loadSpots()
      
      // Subscribe to new messages
      const channel = subscribeToChatMessages(crew.id, (message, eventType) => {
        if (eventType === 'update') {
          // Poll response update
          setMessages(prev => prev.map(m => m.id === message.id ? message : m))
        } else {
          // New message
          setMessages(prev => [message, ...prev])
          
          // Show notification if from another user
          if (message.user_id !== user?.id) {
            addNotification({
              type: 'signal',
              title: `${message.username} in ${crew.name}`,
              message: message.type === 'text' ? message.content : 
                       message.type === 'photo' ? '📷 Photo' :
                       message.type === 'location' ? `📍 ${message.spot_name}` :
                       message.type === 'poll' ? `📊 ${message.poll_question}` : 'New message'
            })
          }
        }
      })

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [crew?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setLoading(true)
    const { data } = await getChatMessages(crew.id)
    if (data) setMessages(data)
    setLoading(false)
  }

  const loadSpots = async () => {
    const { data } = await getSpots()
    if (data) setSpots(data)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    try {
      await sendChatMessage(crew.id, user.id, profile.username, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    }
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      addNotification({ type: 'error', title: 'Error', message: 'Image must be under 5MB' })
      return
    }

    setSending(true)
    try {
      const photoUrl = await uploadImage(file, 'chat')
      await sendPhotoMessage(crew.id, user.id, profile.username, photoUrl, '')
      setShowPhotoUpload(false)
      setShowActions(false)
    } catch (err) {
      console.error('Error uploading photo:', err)
      addNotification({ type: 'error', title: 'Error', message: 'Failed to upload photo' })
    }
    setSending(false)
  }

  const handleLocationShare = async (spotName) => {
    setSending(true)
    try {
      await sendLocationMessage(crew.id, user.id, profile.username, spotName)
      setShowLocationPicker(false)
      setShowActions(false)
    } catch (err) {
      console.error('Error sharing location:', err)
    }
    setSending(false)
  }

  const handleCreatePoll = async (question) => {
    if (!question.trim()) return
    
    setSending(true)
    try {
      await sendPollMessage(crew.id, user.id, profile.username, question.trim())
      setShowPollCreator(false)
      setShowActions(false)
    } catch (err) {
      console.error('Error creating poll:', err)
    }
    setSending(false)
  }

  const handlePollResponse = async (message, response) => {
    try {
      await respondToPoll(message.id, message.poll_responses || [], user.id, profile.username, response)
    } catch (err) {
      console.error('Error responding to poll:', err)
    }
  }

  return (
    <div className="chat-sidebar-overlay" onClick={onClose}>
      <div className="chat-sidebar" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>{crew?.name}</h3>
            <span className="chat-member-count">{crew?.member_count || 0} members</span>
          </div>
          <button className="chat-close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet</p>
              <span>Start the conversation!</span>
            </div>
          ) : (
            <>
              <div ref={messagesEndRef} />
              {messages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isOwn={msg.user_id === user?.id}
                  onPollResponse={handlePollResponse}
                  currentUserId={user?.id}
                />
              ))}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="chat-actions">
            <button onClick={() => { setShowPhotoUpload(true); setShowActions(false); }}>
              <CameraIcon size={18} />
              <span>Photo</span>
            </button>
            <button onClick={() => { setShowLocationPicker(true); setShowActions(false); }}>
              <PinIcon size={18} />
              <span>Location</span>
            </button>
            <button onClick={() => { setShowPollCreator(true); setShowActions(false); }}>
              <PollIcon size={18} />
              <span>Who's in?</span>
            </button>
          </div>
        )}

        {/* Photo Upload */}
        {showPhotoUpload && (
          <div className="chat-action-panel">
            <div className="chat-action-panel-header">
              <span>Share Photo</span>
              <button onClick={() => setShowPhotoUpload(false)}>×</button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="chat-action-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              {sending ? 'Uploading...' : 'Choose Photo'}
            </button>
          </div>
        )}

        {/* Location Picker */}
        {showLocationPicker && (
          <div className="chat-action-panel">
            <div className="chat-action-panel-header">
              <span>Share Location</span>
              <button onClick={() => setShowLocationPicker(false)}>×</button>
            </div>
            <div className="chat-spots-list">
              {spots.slice(0, 10).map(spot => (
                <button
                  key={spot.id}
                  className="chat-spot-btn"
                  onClick={() => handleLocationShare(spot.name)}
                  disabled={sending}
                >
                  <PinIcon size={14} />
                  {spot.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Poll Creator */}
        {showPollCreator && (
          <PollCreator 
            onSubmit={handleCreatePoll}
            onCancel={() => setShowPollCreator(false)}
            sending={sending}
          />
        )}

        {/* Input */}
        <div className="chat-input-container">
          <button 
            className={`chat-actions-toggle ${showActions ? 'active' : ''}`}
            onClick={() => setShowActions(!showActions)}
          >
            +
          </button>
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button 
            className="chat-send"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Chat Message Component
function ChatMessage({ message, isOwn, onPollResponse, currentUserId }) {
  const renderContent = () => {
    switch (message.type) {
      case 'photo':
        return (
          <div className="chat-msg-photo">
            <img src={message.photo_url} alt="" />
            {message.content && <p>{message.content}</p>}
          </div>
        )
      
      case 'location':
        return (
          <div className="chat-msg-location">
            <PinIcon size={16} color="var(--seafoam)" />
            <span>{message.spot_name}</span>
          </div>
        )
      
      case 'poll':
        const responses = message.poll_responses || []
        const yesCount = responses.filter(r => r.response === 'yes').length
        const noCount = responses.filter(r => r.response === 'no').length
        const userResponse = responses.find(r => r.user_id === currentUserId)?.response
        
        return (
          <div className="chat-msg-poll">
            <div className="poll-question">{message.poll_question}</div>
            <div className="poll-buttons">
              <button 
                className={`poll-btn poll-yes ${userResponse === 'yes' ? 'selected' : ''}`}
                onClick={() => onPollResponse(message, 'yes')}
              >
                <CheckIcon size={14} />
                <span>I'm in</span>
                {yesCount > 0 && <span className="poll-count">{yesCount}</span>}
              </button>
              <button 
                className={`poll-btn poll-no ${userResponse === 'no' ? 'selected' : ''}`}
                onClick={() => onPollResponse(message, 'no')}
              >
                <CrossIcon size={14} />
                <span>Pass</span>
                {noCount > 0 && <span className="poll-count">{noCount}</span>}
              </button>
            </div>
            {responses.length > 0 && (
              <div className="poll-responders">
                {responses.filter(r => r.response === 'yes').map(r => r.username).join(', ')}
                {yesCount > 0 && ' going'}
              </div>
            )}
          </div>
        )
      
      default:
        return <p>{message.content}</p>
    }
  }

  return (
    <div className={`chat-msg ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <div className="chat-msg-avatar">
          {message.username?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="chat-msg-bubble">
        {!isOwn && <span className="chat-msg-username">{message.username}</span>}
        {renderContent()}
        <span className="chat-msg-time">{formatTime(message.created_at)}</span>
      </div>
    </div>
  )
}

// Poll Creator Component
function PollCreator({ onSubmit, onCancel, sending }) {
  const [question, setQuestion] = useState('Session tomorrow?')
  
  return (
    <div className="chat-action-panel">
      <div className="chat-action-panel-header">
        <span>Who's In?</span>
        <button onClick={onCancel}>×</button>
      </div>
      <input
        type="text"
        placeholder="e.g., Session tomorrow at 7am?"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        className="poll-input"
      />
      <button 
        className="chat-action-btn"
        onClick={() => onSubmit(question)}
        disabled={sending || !question.trim()}
      >
        {sending ? 'Creating...' : 'Create Poll'}
      </button>
    </div>
  )
}
