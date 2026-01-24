import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase, getMyCrews, updateProfile, uploadImage, getMyListings, markListingAsSold, deleteListing, getUserSessions, deleteSession, getUserAlerts, deleteAlert, toggleAlert, requestFollow, unfollow, acceptFollowRequest, declineFollowRequest, getPendingFollowRequests, getFollowers, getFollowing, getFollowStatus, getFollowCounts, usersShareCrew, getOrCreateConversation } from '../lib/supabase'
import { formatAlertConditions } from '../lib/alertChecker'
import { useNotifications } from '../lib/NotificationContext'
import { FinLogo, WaveIcon, CrewsIcon, MapIcon, PlusIcon, CameraIcon, EditIcon, UserIcon, MarketIcon, SurfboardIcon, BodyboardIcon, SupIcon, KiteIcon, SkateIcon, BikeIcon, RunIcon, TribeIcon, PinIcon, BellIcon, MessageIcon } from '../components/Icons'
import LogSession from '../components/LogSession'
import CreateAlertModal from '../components/CreateAlertModal'
import SessionAnalytics from '../components/SessionAnalytics'
import MobileNav from '../components/MobileNav'

// Star Rating
const StarRating = ({ rating, size = 14 }) => (
  <div className="star-rating-display">
    {[1, 2, 3, 4, 5].map(star => (
      <span key={star} className={`star-small ${star <= rating ? 'filled' : ''}`} style={{ fontSize: size }}>★</span>
    ))}
  </div>
)

// Sport icon component
const SportIcon = ({ sport, size = 20, color = 'var(--seafoam)' }) => {
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

export default function Profile() {
  const { userId } = useParams()
  const { user, profile: myProfile, signOut } = useAuth()
  const [profile, setProfile] = useState(null)
  const [crews, setCrews] = useState([])
  const [boards, setBoards] = useState([])
  const [photos, setPhotos] = useState([])
  const [myListings, setMyListings] = useState([])
  const [sessions, setSessions] = useState([])
  const [showLogSession, setShowLogSession] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showAddBoard, setShowAddBoard] = useState(false)
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  
  // Follow state
  const [followStatus, setFollowStatus] = useState({ iFollow: null, theyFollowMe: null })
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [pendingRequests, setPendingRequests] = useState([])
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [followLoading, setFollowLoading] = useState(false)
  const [canMessage, setCanMessage] = useState(false)
  const [hasMoreSessions, setHasMoreSessions] = useState(true)
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false)
  const navigate = useNavigate()
  
  const { addNotification } = useNotifications()
  
  // Is this my own profile?
  const isOwnProfile = !userId || userId === user?.id
  const targetUserId = userId || user?.id
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    home_spot: ''
  })

  useEffect(() => {
    if (targetUserId) {
      loadData()
    }
  }, [targetUserId])

  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        home_spot: profile.home_spot || ''
      })
    }
  }, [profile, isOwnProfile])

  const loadData = async () => {
    if (!targetUserId) return
    setLoading(true)
    try {
      // Always load profile from database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      } else if (isOwnProfile && user) {
        // Profile doesn't exist yet, create a minimal one
        setProfile({ id: user.id, username: user.email?.split('@')[0] || 'User' })
      }

      // Load crews (user's memberships) - fetch separately
      const { data: membershipsData } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
      
      if (membershipsData && membershipsData.length > 0) {
        const crewIds = membershipsData.map(m => m.crew_id)
        const { data: crewsData } = await supabase
          .from('crews')
          .select('id, name, emoji, sport')
          .in('id', crewIds)
        
        if (crewsData) {
          setCrews(crewsData.map(c => ({ crew_id: c.id, crews: c })))
        }
      } else {
        setCrews([])
      }

      // Load boards
      const { data: boardsData } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', targetUserId)
        .order('is_favorite', { ascending: false })
      if (boardsData) setBoards(boardsData)

      // Load photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
      if (photosData) setPhotos(photosData)

      // Load market listings
      if (isOwnProfile) {
        const { data: listingsData } = await getMyListings(targetUserId)
        if (listingsData) setMyListings(listingsData)
      }

      // Load sessions (first page - 10 items)
      const { data: sessionsData } = await getUserSessions(targetUserId, 10, 0)
      if (sessionsData) {
        setSessions(sessionsData)
        setHasMoreSessions(sessionsData.length === 10)
      }

      // Load alerts (only own profile)
      if (isOwnProfile) {
        const { data: alertsData } = await getUserAlerts(targetUserId)
        if (alertsData) setAlerts(alertsData)
      }

      // Load signals count
      const { data: signalsData } = await supabase
        .from('signals')
        .select('id')
        .eq('user_id', targetUserId)
      if (signalsData) setSignals(signalsData)

      // Load follow data
      try {
        // Get follow counts
        const counts = await getFollowCounts(targetUserId)
        setFollowCounts(counts)
        
        // If viewing another profile, get follow status
        if (!isOwnProfile && user) {
          const status = await getFollowStatus(targetUserId)
          setFollowStatus(status)
          
          // Check if can message (share a crew)
          const sharesCrew = await usersShareCrew(targetUserId)
          setCanMessage(sharesCrew)
        }
        
        // If own profile, get pending requests
        if (isOwnProfile) {
          const { data: requests } = await getPendingFollowRequests()
          setPendingRequests(requests || [])
        }
      } catch (e) {
        console.log('Follow data not available')
      }

    } catch (err) {
      console.error('Error loading profile data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreSessions = async () => {
    if (loadingMoreSessions || !hasMoreSessions) return

    setLoadingMoreSessions(true)
    try {
      const { data: moreSessions } = await getUserSessions(
        targetUserId,
        10,
        sessions.length
      )
      if (moreSessions && moreSessions.length > 0) {
        setSessions(prev => [...prev, ...moreSessions])
        setHasMoreSessions(moreSessions.length === 10)
      } else {
        setHasMoreSessions(false)
      }
    } catch (err) {
      console.error('Error loading more sessions:', err)
    } finally {
      setLoadingMoreSessions(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(user.id, editForm)
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Error saving profile:', err)
    }
  }

  // Follow handlers
  const handleFollow = async () => {
    setFollowLoading(true)
    const { error } = await requestFollow(targetUserId)
    if (!error) {
      setFollowStatus({ ...followStatus, iFollow: 'pending' })
      addNotification({ type: 'success', message: 'Follow request sent!' })
    }
    setFollowLoading(false)
  }

  const handleUnfollow = async () => {
    setFollowLoading(true)
    const { error } = await unfollow(targetUserId)
    if (!error) {
      setFollowStatus({ ...followStatus, iFollow: null })
      setFollowCounts({ ...followCounts, followers: followCounts.followers - 1 })
      addNotification({ type: 'info', message: 'Unfollowed' })
    }
    setFollowLoading(false)
  }

  const handleCancelRequest = async () => {
    setFollowLoading(true)
    const { error } = await unfollow(targetUserId)
    if (!error) {
      setFollowStatus({ ...followStatus, iFollow: null })
      addNotification({ type: 'info', message: 'Request cancelled' })
    }
    setFollowLoading(false)
  }

  const handleAcceptRequest = async (followerId) => {
    const { error } = await acceptFollowRequest(followerId)
    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.follower_id !== followerId))
      setFollowCounts({ ...followCounts, followers: followCounts.followers + 1 })
      addNotification({ type: 'success', message: 'Follow request accepted!' })
    }
  }

  const handleDeclineRequest = async (followerId) => {
    const { error } = await declineFollowRequest(followerId)
    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.follower_id !== followerId))
      addNotification({ type: 'info', message: 'Request declined' })
    }
  }

  const loadFollowersList = async () => {
    const { data } = await getFollowers(targetUserId)
    setFollowersList(data || [])
    setShowFollowers(true)
  }

  const loadFollowingList = async () => {
    const { data } = await getFollowing(targetUserId)
    setFollowingList(data || [])
    setShowFollowing(true)
  }

  const handleMessage = async () => {
    const { data: conv, error } = await getOrCreateConversation(targetUserId)
    if (conv && !error) {
      navigate('/messages')
    }
  }

  if (loading) {
    return (
      <div className="app">
        <aside className="sidebar-left">
          <div className="logo">
            <FinLogo size={36} color="#F5F0E6" waveColor="#5B8A72" />
            <div>
              <div className="logo-title">CREW</div>
              <div className="logo-tagline">your micro tribe</div>
            </div>
          </div>
        </aside>
        <main className="main-content">
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="app">
        <aside className="sidebar-left">
          <div className="logo">
            <FinLogo size={36} color="#F5F0E6" waveColor="#5B8A72" />
            <div>
              <div className="logo-title">CREW</div>
              <div className="logo-tagline">your micro tribe</div>
            </div>
          </div>
        </aside>
        <main className="main-content">
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>User not found</div>
        </main>
      </div>
    )
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
          <Link to="/crews" className="nav-link">
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
          <Link to="/profile" className={`nav-link ${isOwnProfile ? 'active' : ''}`}>
            <span className="nav-avatar">{myProfile?.username?.charAt(0).toUpperCase() || 'U'}</span>
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
      <main className="main-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profile?.username?.charAt(0).toUpperCase()}
          </div>
          
          {editing && isOwnProfile ? (
            <div className="profile-edit-form">
              <input
                type="text"
                className="form-input"
                placeholder="Username"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Full name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Home spot (e.g. Carcavelos)"
                value={editForm.home_spot}
                onChange={(e) => setEditForm({...editForm, home_spot: e.target.value})}
              />
              <textarea
                className="form-textarea"
                placeholder="Bio - tell us about yourself..."
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                rows={3}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={handleSaveProfile}>Save</button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <h1 className="profile-name">{profile?.full_name || profile?.username}</h1>
              <p className="profile-username">@{profile?.username}</p>
              {profile?.home_spot && (
                <p className="profile-spot">
                  <PinIcon size={14} color="var(--driftwood)" />
                  {profile.home_spot}
                </p>
              )}
              {profile?.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}
              
              {/* Follow counts */}
              <div className="follow-counts">
                <button className="follow-count-btn" onClick={loadFollowersList}>
                  <strong>{followCounts.followers}</strong> followers
                </button>
                <button className="follow-count-btn" onClick={loadFollowingList}>
                  <strong>{followCounts.following}</strong> following
                </button>
              </div>
              
              {isOwnProfile ? (
                <button className="btn btn-secondary btn-small" onClick={() => setEditing(true)}>
                  <EditIcon size={14} />
                  Edit Profile
                </button>
              ) : (
                <div className="follow-actions">
                  {followStatus.iFollow === 'accepted' ? (
                    <button 
                      className="btn btn-secondary btn-small" 
                      onClick={handleUnfollow}
                      disabled={followLoading}
                    >
                      Following ✓
                    </button>
                  ) : followStatus.iFollow === 'pending' ? (
                    <button 
                      className="btn btn-secondary btn-small" 
                      onClick={handleCancelRequest}
                      disabled={followLoading}
                    >
                      Requested...
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary btn-small" 
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      + Follow
                    </button>
                  )}
                  
                  {canMessage && (
                    <button className="btn-message" onClick={handleMessage}>
                      <MessageIcon size={14} />
                      Message
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats - CREW: Simplificado, sem gamificação */}
        <div className="profile-stats">
          <div className="stat-box">
            <span className="stat-value">{signals.length}</span>
            <span className="stat-label">Signals</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{sessions.length}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </div>

        {/* Pending Follow Requests */}
        {isOwnProfile && pendingRequests.length > 0 && (
          <div className="profile-section pending-requests-section">
            <div className="section-header">
              <h2 className="section-title">
                <BellIcon size={22} color="var(--faded-coral)" />
                <span>Follow Requests ({pendingRequests.length})</span>
              </h2>
            </div>
            <div className="pending-requests-list">
              {pendingRequests.map(request => (
                <div key={request.id} className="pending-request-card">
                  <Link to={`/profile/${request.follower_id}`} className="request-user">
                    <div className="request-avatar">
                      {request.profile?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="request-info">
                      <strong>{request.profile?.full_name || request.profile?.username}</strong>
                      <span>@{request.profile?.username}</span>
                    </div>
                  </Link>
                  <div className="request-actions">
                    <button 
                      className="btn btn-primary btn-small"
                      onClick={() => handleAcceptRequest(request.follower_id)}
                    >
                      Accept
                    </button>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleDeclineRequest(request.follower_id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiver Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <SurfboardIcon size={22} color="var(--deep-ocean)" />
              <span>Quiver</span>
            </h2>
            {isOwnProfile && (
              <button className="btn btn-small" onClick={() => setShowAddBoard(true)}>
                <PlusIcon size={16} />
                Add Board
              </button>
            )}
          </div>
          
          {boards.length === 0 ? (
            <div className="empty-section">
              <p>{isOwnProfile ? 'No boards yet. Add your first board!' : 'No boards yet.'}</p>
            </div>
          ) : (
            <div className="boards-grid">
              {boards.map(board => (
                <div key={board.id} className="board-card">
                  {board.photo_url ? (
                    <img src={board.photo_url} alt={board.name} className="board-photo" />
                  ) : (
                    <div className="board-photo-placeholder">
                      <SurfboardIcon size={32} color="var(--driftwood)" />
                    </div>
                  )}
                  <div className="board-info">
                    <h4 className="board-name">
                      {board.name}
                      {board.is_favorite && <span className="favorite-star">★</span>}
                    </h4>
                    <p className="board-details">
                      {board.brand && `${board.brand} `}
                      {board.size && `• ${board.size} `}
                      {board.type && `• ${board.type}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photos Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <CameraIcon size={22} color="var(--driftwood)" />
              <span>Sessions</span>
            </h2>
            {isOwnProfile && (
              <button className="btn btn-small" onClick={() => setShowAddPhoto(true)}>
                <CameraIcon size={16} />
                Add Photo
              </button>
            )}
          </div>
          
          {photos.length === 0 ? (
            <div className="empty-section">
              <p>{isOwnProfile ? 'No photos yet. Share your sessions!' : 'No photos yet.'}</p>
            </div>
          ) : (
            <div className="photos-grid">
              {photos.map(photo => (
                <div key={photo.id} className="photo-card">
                  <img src={photo.url} alt={photo.caption || 'Session'} className="photo-img" />
                  {(photo.caption || photo.spot_name) && (
                    <div className="photo-overlay">
                      {photo.spot_name && (
                        <span className="photo-spot">
                          <PinIcon size={14} color="var(--wax)" />
                          {photo.spot_name}
                        </span>
                      )}
                      {photo.caption && <span className="photo-caption">{photo.caption}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Listings - Only on own profile */}
        {isOwnProfile && (
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <MarketIcon size={22} color="var(--deep-ocean)" />
                <span>My Listings</span>
              </h2>
              <Link to="/market" className="btn-secondary btn-small">
                + Sell Board
              </Link>
            </div>
            {myListings.length === 0 ? (
              <div className="empty-section">
                <p>No boards for sale. List your first board!</p>
              </div>
            ) : (
              <div className="my-listings-grid">
                {myListings.map(listing => (
                  <div key={listing.id} className={`my-listing-card ${listing.status}`}>
                    <div className="my-listing-image">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} />
                      ) : (
                        <SurfboardIcon size={32} color="var(--driftwood)" />
                      )}
                      <span className={`listing-status-badge ${listing.status}`}>
                        {listing.status === 'active' ? 'Active' : 'Sold'}
                      </span>
                    </div>
                    <div className="my-listing-content">
                      <h4 className="my-listing-title">{listing.title}</h4>
                      <div className="my-listing-meta">
                        <span className="my-listing-price">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(listing.price)}
                        </span>
                        <span className="my-listing-type">{listing.board_type}</span>
                      </div>
                      <div className="my-listing-actions">
                        {listing.status === 'active' ? (
                          <>
                            <button 
                              className="btn-small btn-success"
                              onClick={async () => {
                                await markListingAsSold(listing.id)
                                setMyListings(prev => prev.map(l => 
                                  l.id === listing.id ? { ...l, status: 'sold' } : l
                                ))
                              }}
                            >
                              Mark Sold
                            </button>
                            <button 
                              className="btn-small btn-ghost"
                              onClick={async () => {
                                if (confirm('Delete this listing?')) {
                                  await deleteListing(listing.id)
                                  setMyListings(prev => prev.filter(l => l.id !== listing.id))
                                }
                              }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="sold-label">Sold!</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Session Analytics */}
        {isOwnProfile && sessions.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <WaveIcon size={22} color="var(--deep-ocean)" />
                <span>Estatísticas</span>
              </h2>
            </div>
            <SessionAnalytics userId={targetUserId} />
          </div>
        )}

        {/* Sessions Log */}
        <div className="profile-section">
          <div className="section-header">
            <h2 className="section-title">
              <WaveIcon size={22} color="var(--deep-ocean)" />
              <span>Sessions Log</span>
            </h2>
            {isOwnProfile && (
              <button className="btn-secondary btn-small" onClick={() => setShowLogSession(true)}>
                + Log Session
              </button>
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="empty-section">
              <p>{isOwnProfile ? 'No sessions logged yet. Start tracking your surf!' : 'No sessions logged yet.'}</p>
            </div>
          ) : (
            <>
              <div className="sessions-log-grid">
                {sessions.map(session => (
                <div key={session.id} className="session-log-card">
                  <div className="session-log-header">
                    <div className="session-log-date">
                      {new Date(session.session_date).toLocaleDateString('pt-PT', { 
                        day: 'numeric', month: 'short' 
                      })}
                    </div>
                    {session.rating && <StarRating rating={session.rating} size={12} />}
                  </div>
                  <div className="session-log-spot">
                    <PinIcon size={14} color="var(--faded-coral)" />
                    <span>{session.spot_name}</span>
                  </div>
                  <div className="session-log-details">
                    {session.duration_minutes && (
                      <span className="session-detail">{Math.round(session.duration_minutes / 60)}h</span>
                    )}
                    {session.wave_size && (
                      <span className="session-detail">{session.wave_size}m</span>
                    )}
                    {session.wind && (
                      <span className="session-detail">{session.wind}</span>
                    )}
                    {session.board_name && (
                      <span className="session-detail board">{session.board_name}</span>
                    )}
                  </div>
                  {session.notes && (
                    <p className="session-log-notes">{session.notes}</p>
                  )}
                  {isOwnProfile && (
                    <div className="session-log-actions">
                      <button 
                        className="btn-ghost btn-tiny"
                        onClick={() => {
                          setEditingSession(session)
                          setShowLogSession(true)
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-ghost btn-tiny btn-danger"
                        onClick={async () => {
                          if (confirm('Delete this session?')) {
                            await deleteSession(session.id)
                            setSessions(prev => prev.filter(s => s.id !== session.id))
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMoreSessions && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button
                    className="btn-secondary"
                    onClick={loadMoreSessions}
                    disabled={loadingMoreSessions}
                  >
                    {loadingMoreSessions ? 'Loading...' : 'Load More Sessions'}
                  </button>
                </div>
              )}

              {!hasMoreSessions && sessions.length > 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                  All sessions loaded
                </div>
              )}
            </>
          )}
        </div>

        {/* Condition Alerts - Only on own profile */}
        {isOwnProfile && (
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <BellIcon size={22} color="var(--deep-ocean)" />
                <span>Condition Alerts</span>
              </h2>
            </div>
            {alerts.length === 0 ? (
              <div className="empty-section">
                <p>No alerts set. Create alerts from the Map to get notified when conditions are good!</p>
              </div>
            ) : (
              <div className="alerts-grid">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-card ${!alert.is_active ? 'inactive' : ''}`}>
                    <div className="alert-card-header">
                      <div className="alert-spot">
                        <PinIcon size={16} color="var(--faded-coral)" />
                        <span>{alert.spot_name}</span>
                      </div>
                      <label className="alert-toggle">
                        <input
                          type="checkbox"
                          checked={alert.is_active}
                          onChange={async () => {
                            await toggleAlert(alert.id, !alert.is_active)
                            setAlerts(prev => prev.map(a => 
                              a.id === alert.id ? { ...a, is_active: !a.is_active } : a
                            ))
                          }}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="alert-conditions">
                      {formatAlertConditions(alert)}
                    </div>
                    {alert.last_triggered && (
                      <div className="alert-last-triggered">
                        Last triggered: {new Date(alert.last_triggered).toLocaleDateString('pt-PT')}
                      </div>
                    )}
                    <div className="alert-card-actions">
                      <button 
                        className="btn-ghost btn-tiny btn-danger"
                        onClick={async () => {
                          if (confirm('Delete this alert?')) {
                            await deleteAlert(alert.id)
                            setAlerts(prev => prev.filter(a => a.id !== alert.id))
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sign Out - Visible on mobile */}
        {isOwnProfile && (
          <div className="profile-section mobile-signout">
            <button className="btn-signout" onClick={signOut}>
              Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        <div className="sidebar-section">
          <h3 className="sidebar-title">{isOwnProfile ? 'Your' : `${profile?.username}'s`} Crews</h3>
          {crews.length === 0 ? (
            <p className="sidebar-empty">No crews yet</p>
          ) : (
            <div className="sidebar-crews">
              {crews.map(crew => (
                <Link key={crew.crew_id} to={`/crews/${crew.crew_id}`} className="sidebar-crew-item">
                  <SportIcon sport={crew.crews?.sport || 'surf'} size={18} />
                  <span className="sidebar-crew-name">{crew.crews?.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">Member Since</h3>
          <p className="sidebar-meta">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT', { 
              month: 'long', 
              year: 'numeric' 
            }) : '—'}
          </p>
        </div>

        {!isOwnProfile && (
          <div className="sidebar-section">
            <Link to="/profile" className="btn btn-secondary btn-small" style={{ width: '100%', justifyContent: 'center' }}>
              ← Back to my profile
            </Link>
          </div>
        )}
      </aside>

      {/* Add Board Modal */}
      {showAddBoard && isOwnProfile && (
        <AddBoardModal 
          userId={user.id}
          onClose={() => setShowAddBoard(false)}
          onSuccess={() => {
            setShowAddBoard(false)
            loadData()
          }}
        />
      )}

      {/* Add Photo Modal */}
      {showAddPhoto && isOwnProfile && (
        <AddPhotoModal 
          userId={user.id}
          onClose={() => setShowAddPhoto(false)}
          onSuccess={() => {
            setShowAddPhoto(false)
            loadData()
          }}
        />
      )}

      {/* Log Session Modal */}
      {showLogSession && isOwnProfile && (
        <LogSession 
          onClose={() => {
            setShowLogSession(false)
            setEditingSession(null)
          }}
          onSuccess={async () => {
            const { data } = await getUserSessions(user.id)
            if (data) setSessions(data)
          }}
          editSession={editingSession}
        />
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="modal modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Followers</h3>
              <button className="modal-close" onClick={() => setShowFollowers(false)}>×</button>
            </div>
            <div className="modal-body">
              {followersList.length === 0 ? (
                <p className="empty-text">No followers yet</p>
              ) : (
                <div className="users-list">
                  {followersList.map(u => (
                    <Link 
                      key={u.id} 
                      to={`/profile/${u.id}`} 
                      className="user-list-item"
                      onClick={() => setShowFollowers(false)}
                    >
                      <div className="user-list-avatar">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-list-info">
                        <strong>{u.full_name || u.username}</strong>
                        <span>@{u.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="modal modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Following</h3>
              <button className="modal-close" onClick={() => setShowFollowing(false)}>×</button>
            </div>
            <div className="modal-body">
              {followingList.length === 0 ? (
                <p className="empty-text">Not following anyone yet</p>
              ) : (
                <div className="users-list">
                  {followingList.map(u => (
                    <Link 
                      key={u.id} 
                      to={`/profile/${u.id}`} 
                      className="user-list-item"
                      onClick={() => setShowFollowing(false)}
                    >
                      <div className="user-list-avatar">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-list-info">
                        <strong>{u.full_name || u.username}</strong>
                        <span>@{u.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNav profile={myProfile} />
    </div>
  )
}

// Add Board Modal
function AddBoardModal({ userId, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [size, setSize] = useState('')
  const [type, setType] = useState('shortboard')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const boardTypes = ['shortboard', 'longboard', 'fish', 'funboard', 'gun', 'mini-mal', 'SUP', 'bodyboard']

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5MB')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give your board a name')
      return
    }

    setLoading(true)
    setError('')

    try {
      let photoUrl = null
      
      // Upload photo if selected
      if (photoFile) {
        photoUrl = await uploadImage(photoFile, 'boards')
      }

      const { error } = await supabase.from('boards').insert({
        user_id: userId,
        name: name.trim(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        size: size.trim() || null,
        type,
        photo_url: photoUrl,
        is_favorite: isFavorite
      })
      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Board</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Board Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="My daily driver, The magic board..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="JS, Channel Islands..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                placeholder="Monsta Box, Pod Mod..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Size</label>
              <input
                type="text"
                className="form-input"
                placeholder="5'10, 6'2..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                {boardTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Photo</label>
            <div className="file-upload-area">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                id="board-photo-input"
                className="file-input-hidden"
              />
              {photoPreview ? (
                <div className="file-preview">
                  <img src={photoPreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-preview"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  >×</button>
                </div>
              ) : (
                <label htmlFor="board-photo-input" className="file-upload-label">
                  <CameraIcon size={24} color="#888" />
                  <span>Click to upload photo</span>
                  <span className="file-hint">JPG, PNG, WebP • Max 5MB</span>
                </label>
              )}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>⭐ This is my favorite board</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Uploading...' : 'Add Board'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Add Photo Modal
function AddPhotoModal({ userId, onClose, onSuccess }) {
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [spotName, setSpotName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5MB')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photoFile) {
      setError('Select a photo')
      return
    }

    setLoading(true)
    setError('')

    try {
      const photoUrl = await uploadImage(photoFile, 'photos')

      const { error } = await supabase.from('photos').insert({
        user_id: userId,
        url: photoUrl,
        caption: caption.trim() || null,
        spot_name: spotName.trim() || null
      })
      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Photo</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Photo *</label>
            <div className="file-upload-area file-upload-large">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                id="session-photo-input"
                className="file-input-hidden"
              />
              {photoPreview ? (
                <div className="file-preview file-preview-large">
                  <img src={photoPreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-preview"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  >×</button>
                </div>
              ) : (
                <label htmlFor="session-photo-input" className="file-upload-label">
                  <CameraIcon size={32} color="#888" />
                  <span>Click to upload photo</span>
                  <span className="file-hint">JPG, PNG, WebP • Max 5MB</span>
                </label>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Spot</label>
            <input
              type="text"
              className="form-input"
              placeholder="Where was this?"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Caption</label>
            <textarea
              className="form-textarea"
              placeholder="Tell the story..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !photoFile}>
            {loading ? 'Uploading...' : 'Add Photo'}
          </button>
        </form>
      </div>
    </div>
  )
}
