import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { FinLogo, WaveIcon, CrewsIcon, MapIcon, MarketIcon, UserIcon, ChatIcon, SurfboardIcon, BodyboardIcon, SupIcon, KiteIcon, SkateIcon, BikeIcon, RunIcon, TribeIcon, MessageIcon } from '../components/Icons'
import MobileNav from '../components/MobileNav'
import ChatSidebar from '../components/ChatSidebar'
import MobileNav from '../components/MobileNav'
import InvitePanel from '../components/InvitePanel'
import MobileNav from '../components/MobileNav'

// Sport icon component
const SportIcon = ({ sport, size = 32, color = 'var(--deep-ocean)' }) => {
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

export default function CrewDetail() {
  const { crewId } = useParams()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  
  const [crew, setCrew] = useState(null)
  const [members, setMembers] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userMembership, setUserMembership] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    loadCrewData()
  }, [crewId])

  const loadCrewData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get crew details
      const { data: crewData, error: crewError } = await supabase
        .from('crews')
        .select('*')
        .eq('id', crewId)
        .single()
      
      if (crewError) throw crewError
      setCrew(crewData)

      // Get members (without nested profile)
      const { data: membersData, error: membersError } = await supabase
        .from('crew_members')
        .select('id, user_id, role, status, created_at')
        .eq('crew_id', crewId)
      
      if (membersError) throw membersError

      // Get profiles for all member user_ids
      const userIds = membersData.map(m => m.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, home_spot')
        .in('id', userIds)

      // Merge members with profiles
      const membersWithProfiles = membersData.map(m => ({
        ...m,
        profiles: profilesData?.find(p => p.id === m.user_id) || { username: 'Unknown' }
      }))

      // Separate active members and pending
      const approved = membersWithProfiles.filter(m => m.status === 'active')
      const pending = membersWithProfiles.filter(m => m.status === 'pending')
      
      setMembers(approved)
      setPendingMembers(pending)

      // Check current user's membership
      const userMember = membersWithProfiles.find(m => m.user_id === user?.id)
      setUserMembership(userMember)

    } catch (err) {
      console.error('Error loading crew:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (membershipId, vote) => {
    setActionLoading(membershipId)
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('crew_votes')
        .select('id')
        .eq('membership_id', membershipId)
        .eq('voter_id', user.id)
        .single()

      if (existingVote) {
        // Update existing vote
        await supabase
          .from('crew_votes')
          .update({ vote })
          .eq('id', existingVote.id)
      } else {
        // Create new vote
        await supabase
          .from('crew_votes')
          .insert({
            membership_id: membershipId,
            voter_id: user.id,
            vote
          })
      }

      // Check if enough votes to approve (majority of current members)
      const { data: votes } = await supabase
        .from('crew_votes')
        .select('vote')
        .eq('membership_id', membershipId)

      const yesVotes = votes?.filter(v => v.vote === true).length || 0
      const totalMembers = members.length
      const majority = Math.ceil(totalMembers / 2)

      if (yesVotes >= majority) {
        // Auto-approve
        await supabase
          .from('crew_members')
          .update({ status: 'active' })
          .eq('id', membershipId)
      }

      // Reload data
      loadCrewData()
    } catch (err) {
      console.error('Error voting:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleKick = async (membershipId, username) => {
    if (!confirm(`Remove ${username} from the crew?`)) return
    
    setActionLoading(membershipId)
    try {
      await supabase
        .from('crew_members')
        .delete()
        .eq('id', membershipId)
      
      loadCrewData()
    } catch (err) {
      console.error('Error removing member:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this crew?')) return
    
    setActionLoading('leave')
    try {
      await supabase
        .from('crew_members')
        .delete()
        .eq('crew_id', crewId)
        .eq('user_id', user.id)
      
      navigate('/crews')
    } catch (err) {
      console.error('Error leaving crew:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const isAdmin = userMembership?.role === 'admin'
  const isMember = userMembership?.status === 'active'

  if (loading) {
    return <div className="loading">Loading crew...</div>
  }

  if (error || !crew) {
    return (
      <div className="app">
        <aside className="sidebar-left">
          <div className="logo">
            <FinLogo size={36} color="#F5F0E6" waveColor="#5B8A72" />
            <div>
              <div className="logo-title">CREW</div>
              <div className="logo-tagline">no time / no territory</div>
            </div>
          </div>
        </aside>
        <main className="main-content">
          <div className="empty-state">
            <p>Crew not found</p>
            <Link to="/crews" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Back to Crews
            </Link>
          </div>
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
            <div className="logo-tagline">no time / no territory</div>
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
        <Link to="/crews" className="back-link">← Back to Crews</Link>
        
        {/* Crew Header */}
        <div className="crew-detail-header">
          <div className="crew-detail-icon">
            <SportIcon sport={crew.sport} size={48} color="var(--deep-ocean)" />
          </div>
          <div className="crew-detail-info">
            <h1 className="crew-detail-name">{crew.name}</h1>
            <p className="crew-detail-sport">{crew.sport}</p>
            {crew.description && (
              <p className="crew-detail-description">{crew.description}</p>
            )}
          </div>
          <div className="crew-detail-actions">
            {isMember && (
              <button className="chat-button" onClick={() => setShowChat(true)}>
                <ChatIcon size={18} />
                <span>Crew Chat</span>
              </button>
            )}
            {isAdmin && (
              <button className="btn-primary btn-small" onClick={() => setShowInvite(true)}>
                + Invite
              </button>
            )}
            <div className="crew-detail-stats">
              <div className="crew-stat">
                <span className="crew-stat-value">{members.length}</span>
                <span className="crew-stat-label">members</span>
              </div>
              {pendingMembers.length > 0 && (
                <div className="crew-stat crew-stat-pending">
                  <span className="crew-stat-value">{pendingMembers.length}</span>
                  <span className="crew-stat-label">pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Members */}
        {pendingMembers.length > 0 && isMember && (
          <div className="crew-section">
            <h2 className="crew-section-title">
              🗳️ Pending Approval ({pendingMembers.length})
            </h2>
            <p className="crew-section-desc">
              Vote to approve new members. Majority required.
            </p>
            <div className="pending-list">
              {pendingMembers.map(member => (
                <PendingMemberCard
                  key={member.id}
                  member={member}
                  currentUserId={user?.id}
                  totalMembers={members.length}
                  onVote={handleVote}
                  loading={actionLoading === member.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="crew-section">
          <h2 className="crew-section-title">Members ({members.length})</h2>
          <div className="members-grid">
            {members.map(member => (
              <div key={member.id} className="member-card">
                <Link to={`/profile/${member.user_id}`} className="member-avatar-link">
                  <div className="member-avatar">
                    {member.profiles?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                </Link>
                <div className="member-info">
                  <Link to={`/profile/${member.user_id}`} className="member-name">
                    {member.profiles?.username || 'Unknown'}
                    {member.role === 'admin' && <span className="admin-badge">Admin</span>}
                  </Link>
                  {member.profiles?.home_spot && (
                    <span className="member-spot">📍 {member.profiles.home_spot}</span>
                  )}
                  <span className="member-joined">
                    Joined {member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'recently'}
                  </span>
                </div>
                {isAdmin && member.user_id !== user?.id && (
                  <button
                    className="member-kick-btn"
                    onClick={() => handleKick(member.id, member.profiles?.username)}
                    disabled={actionLoading === member.id}
                  >
                    {actionLoading === member.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isMember && !isAdmin && (
          <div className="crew-actions">
            <button
              className="btn-leave"
              onClick={handleLeave}
              disabled={actionLoading === 'leave'}
            >
              {actionLoading === 'leave' ? 'Leaving...' : 'Leave Crew'}
            </button>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Quick Stats</h3>
          <div className="crew-quick-stats">
            <div className="quick-stat">
              <CrewsIcon size={24} color="var(--seafoam)" />
              <span className="quick-stat-value">{members.length}</span>
              <span className="quick-stat-label">members</span>
            </div>
            <div className="quick-stat">
              <SportIcon sport={crew.sport} size={24} color="var(--seafoam)" />
              <span className="quick-stat-value">{crew.sport}</span>
              <span className="quick-stat-label">activity</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <h3 className="sidebar-title">Admin Actions</h3>
            <InvitePanel crewId={crewId} crewName={crew?.name} />
          </div>
        )}
      </aside>

      {/* Chat Sidebar */}
      {showChat && (
        <ChatSidebar 
          crew={{ ...crew, member_count: members.length }}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Invite to {crew?.name}</h3>
              <button className="modal-close" onClick={() => setShowInvite(false)}>×</button>
            </div>
            <div className="modal-body">
              <InvitePanel crewId={crewId} crewName={crew?.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pending Member Card Component
function PendingMemberCard({ member, currentUserId, totalMembers, onVote, loading }) {
  const [votes, setVotes] = useState({ yes: 0, no: 0, userVote: null })
  const [loadingVotes, setLoadingVotes] = useState(true)

  useEffect(() => {
    loadVotes()
  }, [member.id])

  const loadVotes = async () => {
    try {
      const { data } = await supabase
        .from('crew_votes')
        .select('vote, voter_id')
        .eq('membership_id', member.id)

      const yesVotes = data?.filter(v => v.vote === true).length || 0
      const noVotes = data?.filter(v => v.vote === false).length || 0
      const userVote = data?.find(v => v.voter_id === currentUserId)?.vote

      setVotes({ yes: yesVotes, no: noVotes, userVote })
    } catch (err) {
      console.error('Error loading votes:', err)
    } finally {
      setLoadingVotes(false)
    }
  }

  const majority = Math.ceil(totalMembers / 2)

  return (
    <div className="pending-card">
      <div className="pending-user">
        <Link to={`/profile/${member.user_id}`}>
          <div className="pending-avatar">
            {member.profiles?.username?.charAt(0).toUpperCase() || '?'}
          </div>
        </Link>
        <div className="pending-info">
          <Link to={`/profile/${member.user_id}`} className="pending-name">
            {member.profiles?.username || 'Unknown'}
          </Link>
          {member.profiles?.home_spot && (
            <span className="pending-spot">📍 {member.profiles.home_spot}</span>
          )}
        </div>
      </div>

      <div className="pending-votes">
        <div className="vote-progress">
          <div 
            className="vote-progress-bar vote-yes" 
            style={{ width: `${(votes.yes / majority) * 100}%` }}
          />
        </div>
        <span className="vote-count">
          {votes.yes}/{majority} votes needed
        </span>
      </div>

      <div className="pending-actions">
        <button
          className={`vote-btn vote-yes-btn ${votes.userVote === true ? 'voted' : ''}`}
          onClick={() => onVote(member.id, true)}
          disabled={loading || loadingVotes}
        >
          {votes.userVote === true ? '✓ Yes' : '👍 Yes'}
        </button>
        <button
          className={`vote-btn vote-no-btn ${votes.userVote === false ? 'voted' : ''}`}
          onClick={() => onVote(member.id, false)}
          disabled={loading || loadingVotes}
        >
          {votes.userVote === false ? '✓ No' : '👎 No'}
        </button>
      </div>
    </div>
  )

      {/* Mobile Navigation */}
      <MobileNav profile={profile} />
}
