import { useState, useEffect } from 'react'
import { 
  getCrewInviteCode, 
  regenerateInviteCode, 
  toggleCrewPublic, 
  searchUsers, 
  sendCrewInvite 
} from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNotifications } from '../lib/NotificationContext'

export default function InvitePanel({ crewId, crewName }) {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  
  const [inviteCode, setInviteCode] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState(null)

  useEffect(() => {
    loadInviteCode()
  }, [crewId])

  const loadInviteCode = async () => {
    const { data } = await getCrewInviteCode(crewId)
    if (data) {
      setInviteCode(data.invite_code || '')
      setIsPublic(data.is_public || false)
    }
    setLoading(false)
  }

  const handleRegenerate = async () => {
    const { data } = await regenerateInviteCode(crewId)
    if (data) {
      setInviteCode(data.invite_code)
      addNotification({
        type: 'success',
        message: 'New invite code generated'
      })
    }
  }

  const handleTogglePublic = async () => {
    await toggleCrewPublic(crewId, !isPublic)
    setIsPublic(!isPublic)
    addNotification({
      type: 'success',
      message: isPublic ? 'Crew is now private' : 'Crew is now public'
    })
  }

  const copyLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    const { data } = await searchUsers(query)
    setSearchResults(data || [])
    setSearching(false)
  }

  const handleInvite = async (invitedUser) => {
    setInviting(invitedUser.id)
    try {
      const { error } = await sendCrewInvite(crewId, invitedUser.id, user.id)
      if (error) {
        if (error.code === '23505') {
          addNotification({
            type: 'error',
            message: 'User already invited'
          })
        } else {
          throw error
        }
      } else {
        addNotification({
          type: 'success',
          message: `Invite sent to ${invitedUser.username}`
        })
        setSearchResults(prev => prev.filter(u => u.id !== invitedUser.id))
      }
    } catch (err) {
      addNotification({
        type: 'error',
        message: 'Failed to send invite'
      })
    }
    setInviting(null)
  }

  if (loading) return <div className="loading-small">Loading...</div>

  return (
    <div className="invite-panel">
      <h3 className="invite-title">Invite to {crewName}</h3>
      
      {/* Public/Private Toggle */}
      <div className="invite-section">
        <div className="invite-row">
          <div>
            <span className="invite-label">Public Crew</span>
            <p className="invite-hint">Anyone can find and join</p>
          </div>
          <label className="alert-toggle">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={handleTogglePublic}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Invite Link */}
      <div className="invite-section">
        <span className="invite-label">Invite Link</span>
        <div className="invite-code-row">
          <code className="invite-code">{inviteCode}</code>
          <button className="btn-ghost btn-small" onClick={copyLink}>
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
          <button className="btn-ghost btn-small" onClick={handleRegenerate}>
            ↻
          </button>
        </div>
        <p className="invite-hint">Share this link: {window.location.origin}/join/{inviteCode}</p>
      </div>

      {/* Search & Invite Users */}
      <div className="invite-section">
        <span className="invite-label">Invite by Username</span>
        <input
          type="text"
          className="form-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        {searching && <p className="invite-hint">Searching...</p>}
        
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(u => (
              <div key={u.id} className="search-result-item">
                <div className="search-result-avatar">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" />
                  ) : (
                    <span>{u.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="search-result-info">
                  <span className="search-result-name">{u.username}</span>
                  {u.full_name && (
                    <span className="search-result-fullname">{u.full_name}</span>
                  )}
                </div>
                <button 
                  className="btn-primary btn-small"
                  onClick={() => handleInvite(u)}
                  disabled={inviting === u.id}
                >
                  {inviting === u.id ? '...' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
