import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { joinCrewByCode } from '../lib/supabase'
import { FinLogo } from '../components/Icons'

export default function Join() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [status, setStatus] = useState('idle') // idle, joining, success, error
  const [error, setError] = useState('')
  const [crewName, setCrewName] = useState('')
  const [manualCode, setManualCode] = useState(code || '')

  useEffect(() => {
    // Auto-join if we have a code and user is logged in
    if (code && user && profile && status === 'idle') {
      handleJoin(code)
    }
  }, [code, user, profile])

  const handleJoin = async (inviteCode) => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }

    setStatus('joining')
    setError('')

    try {
      const { data, error: rpcError } = await joinCrewByCode(
        inviteCode.trim(),
        user.id,
        profile.username
      )

      if (rpcError) throw rpcError

      if (data.success) {
        setCrewName(data.crew_name)
        setStatus('success')
        // Redirect to crew after 2 seconds
        setTimeout(() => {
          navigate(`/crews/${data.crew_id}`)
        }, 2000)
      } else {
        setError(data.error || 'Failed to join crew')
        setStatus('error')
      }
    } catch (err) {
      setError(err.message || 'Failed to join crew')
      setStatus('error')
    }
  }

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="join-page">
        <div className="join-card">
          <FinLogo size={48} />
          <h1>Join a Crew</h1>
          <p>You need to sign in first to join this crew.</p>
          <Link to="/auth" className="btn-primary" style={{ marginTop: '20px' }}>
            Sign In
          </Link>
          {code && (
            <p className="join-hint">
              Invite code: <code>{code}</code>
            </p>
          )}
        </div>
      </div>
    )
  }

  // Loading
  if (authLoading || (status === 'idle' && code)) {
    return (
      <div className="join-page">
        <div className="join-card">
          <FinLogo size={48} />
          <h1>Joining Crew...</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  // Success
  if (status === 'success') {
    return (
      <div className="join-page">
        <div className="join-card">
          <div className="join-success-icon">🎉</div>
          <h1>Welcome to {crewName}!</h1>
          <p>You're now a member of this crew.</p>
          <p className="join-hint">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Manual entry or error
  return (
    <div className="join-page">
      <div className="join-card">
        <FinLogo size={48} />
        <h1>Join a Crew</h1>
        <p>Enter an invite code to join a crew</p>
        
        {error && (
          <div className="error-message" style={{ marginTop: '16px' }}>
            {error}
          </div>
        )}

        <div className="join-form">
          <input
            type="text"
            className="form-input"
            placeholder="Enter invite code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
          />
          <button 
            className="btn-primary"
            onClick={() => handleJoin(manualCode)}
            disabled={status === 'joining' || !manualCode.trim()}
          >
            {status === 'joining' ? 'Joining...' : 'Join Crew'}
          </button>
        </div>

        <Link to="/crews" className="join-back">
          ← Back to My Crews
        </Link>
      </div>
    </div>
  )
}
