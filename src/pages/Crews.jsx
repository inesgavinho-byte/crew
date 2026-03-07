import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getMyCrews, createCrew, getCrewMembers, getPendingMembers, getPendingInvites, acceptInvite, declineInvite, getPublicCrews, joinCrewByCode } from '../lib/supabase'
import { useNotifications } from '../lib/NotificationContext'
import { CrewsIcon, ArrowIcon, PlusIcon } from '../components/Icons'
import { SportIcon } from '../components/Icons'
import Layout from '../components/Layout'

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

  const rightSidebarContent = (
    <>
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
    </>
  )

  return (
    <Layout rightSidebar={rightSidebarContent}>
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
    </Layout>
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

  // Clear error when user starts typing
  const handleNameChange = (e) => {
    setName(e.target.value)
    if (error) setError('')
  }

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modal: {
      background: 'rgba(13, 34, 64, 0.95)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(46, 196, 160, 0.12)',
      borderRadius: '20px',
      padding: '36px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      animation: 'modalIn 0.2s ease',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '28px',
    },
    title: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '28px',
      color: '#e8f4f0',
      letterSpacing: '0.15em',
      margin: 0,
    },
    closeBtn: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(255,255,255,0.08)',
      fontSize: '24px',
      color: '#e8f4f0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s ease',
    },
    label: {
      display: 'block',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
      fontSize: '0.68rem',
      color: '#2ec4a0',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '16px',
      color: '#e8f4f0',
      outline: 'none',
      transition: 'border-color 0.15s ease',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '16px',
      color: '#e8f4f0',
      outline: 'none',
      resize: 'none',
      transition: 'border-color 0.15s ease',
      boxSizing: 'border-box',
    },
    sportGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
    },
    sportOption: (isSelected) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      padding: '12px 8px',
      background: isSelected ? 'rgba(46,196,160,0.12)' : 'rgba(255,255,255,0.04)',
      border: isSelected ? '1.5px solid rgba(46,196,160,0.4)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: isSelected ? '#2ec4a0' : 'rgba(232,240,236,0.7)',
    }),
    sportLabel: (isSelected) => ({
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: isSelected ? '#2ec4a0' : 'rgba(232,240,236,0.7)',
    }),
    submitBtn: {
      width: '100%',
      padding: '16px 24px',
      border: 'none',
      borderRadius: '12px',
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '18px',
      letterSpacing: '0.1em',
      cursor: 'pointer',
      background: '#2ec4a0',
      color: '#0a1628',
      transition: 'all 0.15s ease',
    },
    error: {
      background: 'rgba(205, 92, 92, 0.2)',
      border: '1px solid rgba(205, 92, 92, 0.5)',
      color: '#f0a0a0',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '14px',
      textAlign: 'center',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '24px',
    },
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Start a Crew</h3>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Crew Name</label>
            <input
              type="text"
              style={styles.input}
              placeholder="Dawn Patrol, Costa Crew..."
              value={name}
              onChange={handleNameChange}
              maxLength={30}
              onFocus={e => e.target.style.borderColor = 'rgba(46,196,160,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Activity</label>
            <div style={styles.sportGrid}>
              {sports.map(s => (
                <button
                  key={s.id}
                  type="button"
                  style={styles.sportOption(sport === s.id)}
                  onClick={() => setSport(s.id)}
                >
                  <SportIcon sport={s.id} size={24} color={sport === s.id ? '#2ec4a0' : '#ffffff'} />
                  <span style={styles.sportLabel(sport === s.id)}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description (optional)</label>
            <textarea
              style={styles.textarea}
              placeholder="What's this crew about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={100}
              onFocus={e => e.target.style.borderColor = 'rgba(46,196,160,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(46,196,160,0.4)' }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {loading ? 'CREATING...' : 'CREATE CREW'}
          </button>
        </form>
      </div>
    </div>
  )
}
