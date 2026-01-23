import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useNotifications } from '../lib/NotificationContext'
import { supabase, getMyCrews, getFollowingSignalsFeed, getSpots, getUnreadCount } from '../lib/supabase'
import { FinLogo, WaveIcon, CrewsIcon, PinIcon, WindIcon, ModalWave, MapIcon, MarketIcon, UserIcon, BellIcon, GlassyIcon, CleanIcon, ChoppyIcon, BlownIcon, FlatIcon, SurfboardIcon, BodyboardIcon, SupIcon, KiteIcon, SkateIcon, BikeIcon, RunIcon, TribeIcon, MessageIcon } from '../components/Icons'
import LogSession from '../components/LogSession'
import CheckInModal from '../components/CheckInModal'

// Condition icon component
const ConditionIcon = ({ condition, size = 18 }) => {
  switch(condition) {
    case 'glassy': return <GlassyIcon size={size} />
    case 'clean': return <CleanIcon size={size} />
    case 'choppy': return <ChoppyIcon size={size} />
    case 'blown': return <BlownIcon size={size} />
    case 'flat': return <FlatIcon size={size} />
    default: return <WaveIcon size={size} />
  }
}

// Sport icon component
const SportIcon = ({ sport, size = 18, color = 'var(--seafoam)' }) => {
  const iconProps = { size, color }
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

// Format time ago
const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000)
  
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Feed() {
  const { user, profile, signOut } = useAuth()
  const { notifications, addNotification, unreadCount, markAllRead, clearAll, requestPermission } = useNotifications()
  const [crews, setCrews] = useState([])
  const [signals, setSignals] = useState([])
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showLogSession, setShowLogSession] = useState(false)
  const [lastSignal, setLastSignal] = useState(null)
  const [newSignalIds, setNewSignalIds] = useState(new Set())
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadMsgCount, setUnreadMsgCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const crewIdsRef = useRef([])

  useEffect(() => {
    loadData()
    // Request notification permission on load
    requestPermission()
  }, [])

  // Real-time subscription
  useEffect(() => {
    if (crewIdsRef.current.length === 0) return

    const channel = supabase
      .channel('signals-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals'
        },
        async (payload) => {
          // Check if this signal is from one of our crews
          if (!crewIdsRef.current.includes(payload.new.crew_id)) return
          
          // Get profile for this user
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single()
          
          // Get crew info
          const { data: crewData } = await supabase
            .from('crews')
            .select('name, sport')
            .eq('id', payload.new.crew_id)
            .single()
          
          const data = {
            ...payload.new,
            username: profileData?.username || 'Unknown',
            crew_name: crewData?.name || 'Unknown',
            crew_sport: crewData?.sport || 'surf'
          }
          
          // Add to beginning of signals list
          setSignals(prev => [data, ...prev])
          // Mark as new for animation
          setNewSignalIds(prev => new Set([...prev, data.id]))
          // Remove "new" status after 3 seconds
          setTimeout(() => {
            setNewSignalIds(prev => {
              const next = new Set(prev)
              next.delete(data.id)
              return next
            })
          }, 3000)

          // Show notification if it's not from current user
          if (data.user_id !== user?.id) {
            addNotification({
              type: 'signal',
              title: `${data.username} checked in`,
              message: `${data.spot_name} • ${data.condition}${data.size ? ` • ${data.size}` : ''}`
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [crews, user, addNotification])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: crewsData } = await getMyCrews()
      if (crewsData) {
        setCrews(crewsData)
        const crewIds = crewsData.map(c => c.crew_id)
        crewIdsRef.current = crewIds
        // Load signals from crews AND followed users (first page - 20 items)
        const { data: signalsData } = await getFollowingSignalsFeed(crewIds, 20, 0)
        if (signalsData) {
          setSignals(signalsData)
          setHasMore(signalsData.length === 20)
        }
      } else {
        // No crews, but still show signals from followed users
        const { data: signalsData } = await getFollowingSignalsFeed([], 20, 0)
        if (signalsData) {
          setSignals(signalsData)
          setHasMore(signalsData.length === 20)
        }
      }
      const { data: spotsData } = await getSpots()
      if (spotsData) setSpots(spotsData)

      // Load unread message count
      const msgCount = await getUnreadCount()
      setUnreadMsgCount(msgCount)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const { data: moreSignals } = await getFollowingSignalsFeed(
        crewIdsRef.current,
        20,
        signals.length
      )
      if (moreSignals && moreSignals.length > 0) {
        setSignals(prev => [...prev, ...moreSignals])
        setHasMore(moreSignals.length === 20)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more signals:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const todaySignals = signals.filter(s => {
    const today = new Date()
    const signalDate = new Date(s.created_at)
    return signalDate.toDateString() === today.toDateString()
  })
  const uniqueUsers = [...new Set(todaySignals.map(s => s.user_id))].length

  return (
    <div className="app">
      {/* Left Sidebar */}
      <aside className="sidebar-left">
        <div className="logo">
          <FinLogo size={36} color="#F5F0E6" waveColor="#5B8A72" />
          <div>
            <div className="logo-title">CREW</div>
            <div className="logo-tagline">no time / no territory</div>
          </div>
        </div>

        <nav className="nav-menu">
          <Link to="/" className="nav-link active">
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
          <Link to="/messages" className="nav-link nav-link-badge">
            <MessageIcon size={20} />
            Messages
            {unreadMsgCount > 0 && <span className="nav-badge">{unreadMsgCount}</span>}
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

        <button className="btn-signal" onClick={() => setShowCheckIn(true)} disabled={crews.length === 0}>
          <PinIcon size={20} color="#F4F1E8" />
          Signal
        </button>

        {crews.length === 0 && (
          <p style={{ padding: '0 16px', fontSize: '12px', color: '#888', marginTop: '8px' }}>
            Join a crew first to signal
          </p>
        )}

        <div className="nav-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="avatar">{profile?.username?.charAt(0).toUpperCase()}</div>
            <span style={{ color: '#fff', fontSize: '14px', flex: 1 }}>{profile?.username}</span>
            <button 
              className="notification-bell"
              onClick={() => {
                setShowNotifications(!showNotifications)
                if (!showNotifications && unreadCount > 0) {
                  markAllRead()
                }
              }}
            >
              <BellIcon size={20} color="#F4F1E8" />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Panel */}
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-panel-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="notification-clear">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="notification-panel-list">
                  {notifications.length === 0 ? (
                    <p className="notification-empty">No notifications yet</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`notification-item notification-item-${n.type || 'info'}`}>
                        <div className="notification-item-content">
                          <strong>{n.title}</strong>
                          <span>{n.message}</span>
                          <small>{formatTimeAgo(n.timestamp)}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
        <div className="page-header">
          <h1 className="page-title">Today's Signals</h1>
          <p className="page-subtitle">What's happening out there</p>
        </div>

        {/* Stats */}
        <div className="stats-box">
          <div className="stats-header">
            <WaveIcon size={24} color="#2D8C8C" />
            <span className="stats-label">today's activity</span>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{todaySignals.length}</span>
              <span className="stat-label">signals</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{uniqueUsers}</span>
              <span className="stat-label">crew out</span>
            </div>
          </div>
        </div>

        {/* Signals */}
        {loading ? (
          <div className="empty-state">
            <p>Loading signals...</p>
          </div>
        ) : signals.length === 0 ? (
          <div className="empty-state">
            <WaveIcon size={48} color="#ccc" />
            <p>No signals yet. Be the first to check in!</p>
          </div>
        ) : (
          <>
            {signals.map(signal => (
              <div key={signal.id} className={`card signal-card ${newSignalIds.has(signal.id) ? 'signal-new' : ''}`}>
                <div className="signal-header">
                  <div className="signal-user">
                    <Link to={`/profile/${signal.user_id}`} className="avatar-link">
                      <div className="avatar">
                        {signal.username?.charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    <div className="user-info">
                      <Link to={`/profile/${signal.user_id}`} className="user-name-link">
                        {signal.username}
                      </Link>
                      <span className="user-crew">
                        <SportIcon sport={signal.crew_sport} size={14} color="var(--seafoam)" />
                        {signal.crew_name}
                      </span>
                    </div>
                  </div>
                  <span className="signal-time">{formatTime(signal.created_at)}</span>
                </div>

                <div className="signal-spot">
                  <PinIcon size={18} />
                  <span className="spot-name">{signal.spot_name}</span>
                </div>

                <div className="signal-badges">
                  <span className={`badge badge-${signal.condition}`}>
                    <ConditionIcon condition={signal.condition} size={16} />
                    <span>{signal.condition}</span>
                  </span>
                  {signal.size && (
                    <span className="badge-size">{signal.size}</span>
                  )}
                  {signal.wind && (
                    <span className="badge-wind">
                      <WindIcon size={14} />
                      {signal.wind}
                    </span>
                  )}
                  {signal.crowd && (
                    <span className={`badge-crowd badge-crowd-${signal.crowd}`}>
                      {signal.crowd}
                    </span>
                  )}
                </div>

                {signal.note && (
                  <p className="signal-note">"{signal.note}"</p>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <button
                  className="btn-secondary"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {!hasMore && signals.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                That's all the signals!
              </div>
            )}
          </>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Your Crews</h3>
          {crews.map(crew => (
            <Link key={crew.crew_id} to={`/crews/${crew.crew_id}`} className="sidebar-crew-item">
              <SportIcon sport={crew.crews?.sport} size={18} />
              <span className="sidebar-crew-name">{crew.crews?.name}</span>
            </Link>
          ))}
          {crews.length === 0 && (
            <p className="sidebar-empty">No crews yet</p>
          )}
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">Popular Spots</h3>
          {spots.slice(0, 6).map(spot => (
            <div key={spot.id} className="spot-item">
              <PinIcon size={14} />
              <span className="spot-item-name">{spot.name}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Check-in Modal */}
      {showCheckIn && (
        <CheckInModal 
          crews={crews}
          spots={spots}
          userId={user?.id}
          addNotification={addNotification}
          onClose={() => setShowCheckIn(false)}
          onSuccess={(signal) => {
            setShowCheckIn(false)
            setLastSignal(signal)
            loadData()
            // Show Log Session option
            setTimeout(() => {
              if (confirm('Check-in saved! Want to log this session with more details?')) {
                setShowLogSession(true)
              } else {
                setLastSignal(null)
              }
            }, 300)
          }}
        />
      )}

      {/* Log Session Modal */}
      {showLogSession && (
        <LogSession 
          signal={lastSignal}
          onClose={() => {
            setShowLogSession(false)
            setLastSignal(null)
          }}
          onSuccess={() => {
            addNotification({
              type: 'success',
              title: 'Session Logged',
              message: 'Your session has been saved!'
            })
          }}
        />
      )}
    </div>
  )
}
