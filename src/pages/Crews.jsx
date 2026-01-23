import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getMyCrews, createCrew, getCrewMembers, getPendingMembers, getPendingInvites, acceptInvite, declineInvite, getPublicCrews, joinCrewByCode } from '../lib/supabase'
import { useNotifications } from '../lib/NotificationContext'
import { FinLogo, WaveIcon, CrewsIcon, ArrowIcon, PlusIcon, MapIcon, MarketIcon, UserIcon, SurfboardIcon, BodyboardIcon, SupIcon, KiteIcon, SkateIcon, BikeIcon, RunIcon, TribeIcon, MessageIcon } from '../components/Icons'

// Sport icon component
const SportIcon = ({ sport, size = 32 }) => {
  const iconProps = { size, color: 'var(--deep-ocean)' }
  switch(sport) {
    case 'surf': return <SurfboardIcon {...iconProps} />
    case 'bodyboard': return <BodyboardIcon {...iconProps} />
    case 'sup': return <SupIcon {...iconProps} />
    case 'kitesurf': return <KiteIcon {...iconProps} />
    case 'windsurf': return <KiteIcon {...iconProps} />
    case 'skate': return <SkateIcon {...iconProps} />
    case 'bike': return <BikeIcon {...iconProps} />
    case 'run': return <RunIcon {...iconProps} />
    default: return <TribeIcon {...iconProps} />
  }
}

export default function Crews() {
  const { user, profile, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const [crews, setCrews] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [publicCrews, setPublicCrews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [joiningCrew, setJoiningCrew] = useState(null)

  useEffect(() => {
    loadCrews()
    loadPublicCrews()
  }, [])

  useEffect(() => {
    if (user) {
      loadInvites()
    }
  }, [user])

  const loadCrews = async () => {
    setLoading(true)
    try {
      const { data } = await getMyCrews()
      if (data) {
        setCrews(data)
      }
    } catch (err) {
      console.error('Error loading crews:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInvites = async () => {
    if (!user) return
    const { data } = await getPendingInvites(user.id)
    if (data) setPendingInvites(data)
  }

  const loadPublicCrews = async () => {
    const { data } = await getPublicCrews()
    if (data) setPublicCrews(data)
  }

  const handleAcceptInvite = async (invite) => {
    await acceptInvite(invite.id, invite.crew_id, user.id, profile.username)
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id))
    addNotification({ type: 'success', message: `Joined ${invite.crews.name}!` })
    loadCrews()
  }

  const handleDeclineInvite = async (invite) => {
    await declineInvite(invite.id)
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id))
  }

  const handleJoinPublicCrew = async (crew) => {
    setJoiningCrew(crew.id)
    const { data } = await joinCrewByCode(crew.invite_code, user.id, profile.username)
    if (data?.success) {
      addNotification({ type: 'success', message: `Joined ${crew.name}!` })
      setPublicCrews(prev => prev.filter(c => c.id !== crew.id))
      loadCrews()
    } else {
      addNotification({ type: 'error', message: data?.error || 'Failed to join' })
    }
    setJoiningCrew(null)
  }

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
          <Link to="/crews" className="nav-link active">
            <CrewsIcon size={20} />
            Crews
          </Link>
          <Link to="/map" className="nav-link">
            <MapIcon size={20} />
            Map
          </Link>
          <Link to="/messages" className="nav-link">
            <MessageIcon size={20} />
            Messages
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="avatar">{profile?.username?.charAt(0).toUpperCase()}</div>
            <span style={{ color: '#fff', fontSize: '14px' }}>{profile?.username}</span>
          </div>
          <button 
            onClick={signOut}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="invites-section">
            <h2 className="section-title-small">Pending Invites</h2>
            <div className="invites-list">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="invite-card">
                  <div className="invite-card-icon">
                    <SportIcon sport={invite.crews?.sport || 'surf'} size={28} />
                  </div>
                  <div className="invite-card-content">
                    <h4 className="invite-card-name">{invite.crews?.name}</h4>
                    <p className="invite-card-from">Invited by {invite.inviter_username}</p>
                  </div>
                  <div className="invite-card-actions">
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => handleAcceptInvite(invite)}
                    >
                      Accept
                    </button>
                    <button 
                      className="btn-ghost btn-small"
                      onClick={() => handleDeclineInvite(invite)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Your Crews</h1>
            <p className="page-subtitle">Manage your surf crews</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/join" className="btn btn-secondary">
              Join Crew
            </Link>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <PlusIcon size={18} />
              New Crew
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading crews...</p>
          </div>
        ) : crews.length === 0 ? (
          <div className="empty-state">
            <CrewsIcon size={48} color="#ccc" />
            <p>No crews yet. Create one or get invited!</p>
          </div>
        ) : (
          <div className="crews-grid">
            {crews.filter(c => c.crews).map(crew => (
              <Link 
                key={crew.crew_id} 
                to={`/crews/${crew.crew_id}`}
                className="crew-card"
              >
                <div className="crew-card-icon">
                  <SportIcon sport={crew.crews?.sport || 'surf'} size={36} />
                </div>
                <div className="crew-card-content">
                  <h3 className="crew-card-name">{crew.crews?.name || 'Unknown'}</h3>
                  <p className="crew-card-sport">{crew.crews?.sport || 'surf'}</p>
                  {crew.crews?.description && (
                    <p className="crew-card-desc">{crew.crews.description}</p>
                  )}
                </div>
                <ArrowIcon size={20} color="var(--driftwood)" />
              </Link>
            ))}
          </div>
        )}

        {/* Discover Public Crews */}
        {publicCrews.filter(c => !crews.some(mc => mc.crew_id === c.id)).length > 0 && (
          <div className="discover-section">
            <h2 className="section-title-small">Discover Public Crews</h2>
            <div className="crews-grid">
              {publicCrews
                .filter(c => !crews.some(mc => mc.crew_id === c.id))
                .map(crew => (
                  <div key={crew.id} className="crew-card discover-card">
                    <div className="crew-card-icon">
                      <SportIcon sport={crew.sport || 'surf'} size={36} />
                    </div>
                    <div className="crew-card-content">
                      <h3 className="crew-card-name">{crew.name}</h3>
                      <p className="crew-card-sport">{crew.sport || 'surf'}</p>
                      <p className="crew-card-members">
                        {crew.crew_members?.length || 0} members
                      </p>
                    </div>
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => handleJoinPublicCrew(crew)}
                      disabled={joiningCrew === crew.id}
                    >
                      {joiningCrew === crew.id ? '...' : 'Join'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        <div className="sidebar-section">
          <h3 className="sidebar-title">How Crews Work</h3>
          <div className="info-card">
            <p>Crews are small, private groups. New members need <strong>&gt;50% approval</strong> from existing members.</p>
            <p className="info-card-note">Keep it tight, keep it real.</p>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">Your Crews</h3>
          <div className="stat-card">
            <div className="stat-number">{crews.length}</div>
            <div className="stat-label">active crews</div>
          </div>
        </div>
      </aside>

      {/* Create Crew Modal */}
      {showCreate && (
        <CreateCrewModal 
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            loadCrews()
          }}
        />
      )}
    </div>
  )
}

function CreateCrewModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sport, setSport] = useState('surf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sports = [
    { id: 'surf', label: 'Surf' },
    { id: 'bodyboard', label: 'Bodyboard' },
    { id: 'sup', label: 'SUP' },
    { id: 'kitesurf', label: 'Kitesurf' },
    { id: 'windsurf', label: 'Windsurf' },
    { id: 'skate', label: 'Skate' },
    { id: 'bike', label: 'Bike' },
    { id: 'run', label: 'Run' },
    { id: 'other', label: 'Other' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give your crew a name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createCrew(name.trim(), '🌊', description, sport)
      console.log('Create crew result:', result)
      if (result.error) {
        setError(result.error.message || 'Failed to create crew')
        setLoading(false)
        return
      }
      onSuccess()
    } catch (err) {
      console.error('Create crew error:', err)
      setError(err?.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Start a Crew</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Crew Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Dawn Patrol, Costa Crew..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Activity</label>
            <div className="sport-options">
              {sports.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`sport-option ${sport === s.id ? 'selected' : ''}`}
                  onClick={() => setSport(s.id)}
                >
                  <SportIcon sport={s.id} size={24} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="What's this crew about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={100}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Crew'}
          </button>
        </form>
      </div>
    </div>
  )
}
