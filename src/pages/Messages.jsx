import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase, getConversations, getMessages, sendDirectMessage, markMessagesAsRead, getUnreadCount } from '../lib/supabase'
import { FinLogo, WaveIcon, CrewsIcon, MapIcon, MarketIcon, MessageIcon } from '../components/Icons'

// Notification sound (base64 encoded short beep)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (e) {
    // Audio not supported or blocked
  }
}

export default function Messages() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  
  const messagesEndRef = useRef(null)
  const selectedConvRef = useRef(null)

  // Keep ref in sync with state for use in subscription callback
  useEffect(() => {
    selectedConvRef.current = selectedConv
  }, [selectedConv])

  useEffect(() => {
    loadConversations()
  }, [])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('direct-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        async (payload) => {
          const newMsg = payload.new
          
          // Ignore our own messages (already added locally)
          if (newMsg.sender_id === user.id) return
          
          // Check if this message is for a conversation we're part of
          const { data: conv } = await supabase
            .from('conversations')
            .select('id, user1_id, user2_id')
            .eq('id', newMsg.conversation_id)
            .single()
          
          if (!conv) return
          if (conv.user1_id !== user.id && conv.user2_id !== user.id) return
          
          // If we're viewing this conversation, add the message
          if (selectedConvRef.current?.id === newMsg.conversation_id) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            // Mark as read since we're viewing
            markMessagesAsRead(newMsg.conversation_id)
          } else {
            // Not viewing this conversation - play sound and show indicator
            playNotificationSound()
            setHasNewMessage(true)
            
            // Update unread count in conversation list
            setConversations(prev => prev.map(c => {
              if (c.id === newMsg.conversation_id) {
                return {
                  ...c,
                  unread_count: (c.unread_count || 0) + 1,
                  last_message: newMsg,
                  last_message_at: newMsg.created_at
                }
              }
              return c
            }))
          }
          
          // Re-sort conversations by last message
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.id === newMsg.conversation_id) {
                return { ...c, last_message: newMsg, last_message_at: newMsg.created_at }
              }
              return c
            })
            return updated.sort((a, b) => 
              new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id)
      markMessagesAsRead(selectedConv.id)
      // Clear new message indicator when selecting a conversation
      setHasNewMessage(false)
      // Update conversation to show 0 unread
      setConversations(prev => prev.map(c => 
        c.id === selectedConv.id ? { ...c, unread_count: 0 } : c
      ))
    }
  }, [selectedConv])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    const { data } = await getConversations()
    setConversations(data || [])
    setLoading(false)
  }

  const loadMessages = async (convId) => {
    const { data } = await getMessages(convId)
    setMessages(data || [])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    
    setSending(true)
    const { data, error } = await sendDirectMessage(selectedConv.id, newMessage.trim())
    
    if (!error && data) {
      setMessages(prev => [...prev, data])
      setNewMessage('')
      // Update conversation in list
      setConversations(prev => {
        const updated = prev.map(c => 
          c.id === selectedConv.id 
            ? { ...c, last_message: data, last_message_at: data.created_at }
            : c
        )
        // Re-sort by last message
        return updated.sort((a, b) => 
          new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
        )
      })
    }
    setSending(false)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate total unread
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  return (
    <div className="app">
      {/* Left Sidebar */}
      <aside className="sidebar-left">
        <div className="logo">
          <FinLogo size={36} color="#F5F0E6" waveColor="#5B8A72" />
          <div>
            <div className="logo-title">CREW</div>
            <div className="logo-tagline">your micro tribe</div>
          </div>
        </div>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">
            <WaveIcon size={20} />
            Feed
          </Link>
          <Link to="/crews" className="nav-link">
            <CrewsIcon size={20} />
            Crews
          </Link>
          <Link to="/map" className="nav-link">
            <MapIcon size={20} />
            Map
          </Link>
          <Link to="/messages" className={`nav-link active ${hasNewMessage ? 'has-new' : ''}`}>
            <MessageIcon size={20} />
            Messages
            {totalUnread > 0 && <span className="nav-badge">{totalUnread}</span>}
          </Link>
          <Link to="/market" className="nav-link">
            <MarketIcon size={20} />
            Market
          </Link>
          <Link to="/profile" className="nav-link">
            <span className="nav-avatar">{profile?.username?.charAt(0).toUpperCase() || 'U'}</span>
            Profile
          </Link>
        </nav>

        <div className="nav-spacer" />

        <div className="nav-user">
          <button 
            onClick={signOut}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content messages-page">
        {/* Conversations List */}
        <div className={`conversations-list ${selectedConv ? 'hidden-mobile' : ''}`}>
          <div className="conversations-header">
            <h1 className="page-title">Messages</h1>
          </div>
          
          {loading ? (
            <div className="loading-small">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="empty-conversations">
              <MessageIcon size={48} color="var(--driftwood)" />
              <p>No messages yet</p>
              <span>Start a conversation from a crewmate's profile</span>
            </div>
          ) : (
            <div className="conversations">
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  className={`conversation-item ${selectedConv?.id === conv.id ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedConv(conv)}
                >
                  <div className="conversation-avatar">
                    {conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-top">
                      <span className="conversation-name">
                        {conv.other_user?.full_name || conv.other_user?.username}
                      </span>
                      <span className="conversation-time">
                        {conv.last_message && formatTime(conv.last_message.created_at)}
                      </span>
                    </div>
                    <div className="conversation-preview">
                      {conv.last_message?.sender_id === user?.id && (
                        <span className="you-prefix">You: </span>
                      )}
                      {conv.last_message?.content || 'No messages yet'}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="unread-badge">{conv.unread_count}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat View */}
        <div className={`chat-view ${selectedConv ? 'active' : ''}`}>
          {selectedConv ? (
            <>
              <div className="chat-header">
                <button className="back-btn-mobile" onClick={() => setSelectedConv(null)}>
                  ← 
                </button>
                <Link to={`/profile/${selectedConv.other_user?.id}`} className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedConv.other_user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="chat-username">
                      {selectedConv.other_user?.full_name || selectedConv.other_user?.username}
                    </div>
                    <div className="chat-handle">@{selectedConv.other_user?.username}</div>
                  </div>
                </Link>
              </div>

              <div className="chat-messages">
                {messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.created_at)}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleSend}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={!newMessage.trim() || sending}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageIcon size={64} color="var(--driftwood)" />
              <p>Select a conversation</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
