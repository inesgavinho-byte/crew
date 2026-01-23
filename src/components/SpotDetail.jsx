import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { 
  getSpotReviews, 
  getSpotStats, 
  createSpotReview, 
  deleteSpotReview,
  getSpotSessions 
} from '../lib/supabase'
import { PinIcon, UserIcon } from './Icons'

// Star Rating Component
const StarRating = ({ rating, size = 16, interactive = false, onChange }) => {
  const [hover, setHover] = useState(0)
  
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          disabled={!interactive}
          style={{ fontSize: size }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// Compass Direction Icon
const CompassIcon = ({ direction, size = 20 }) => {
  const angles = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--deep-ocean)" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path 
        d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" 
        strokeWidth="1" 
      />
      <path 
        d="M12 8 L14 16 L12 14 L10 16 Z" 
        fill="var(--faded-coral)"
        stroke="none"
        transform={`rotate(${angles[direction] || 0} 12 12)`}
      />
    </svg>
  )
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'var(--seafoam)' },
  { value: 'intermediate', label: 'Intermediate', color: 'var(--sun-bleached)' },
  { value: 'advanced', label: 'Advanced', color: 'var(--faded-coral)' }
]

const CROWDS = [
  { value: 'empty', label: 'Empty' },
  { value: 'few', label: 'Few people' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'crowded', label: 'Crowded' }
]

const PARKING = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'difficult', label: 'Difficult' },
  { value: 'none', label: 'None' }
]

const TIDES = [
  { value: 'low', label: 'Low' },
  { value: 'mid', label: 'Mid' },
  { value: 'high', label: 'High' },
  { value: 'all', label: 'All tides' }
]

const SWELL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export default function SpotDetail({ spotName, onClose }) {
  const { user, profile } = useAuth()
  
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userReview, setUserReview] = useState(null)
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    skill_level: '',
    crowds: '',
    parking: '',
    best_tide: '',
    best_swell: '',
    comment: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSpotData()
  }, [spotName])

  const loadSpotData = async () => {
    setLoading(true)
    
    const [statsResult, reviewsResult, sessionsResult] = await Promise.all([
      getSpotStats(spotName),
      getSpotReviews(spotName),
      getSpotSessions(spotName)
    ])
    
    if (statsResult) setStats(statsResult)
    if (reviewsResult.data) {
      setReviews(reviewsResult.data)
      // Check if user already has a review
      const existing = reviewsResult.data.find(r => r.user_id === user?.id)
      if (existing) {
        setUserReview(existing)
        setReviewForm({
          rating: existing.rating,
          skill_level: existing.skill_level || '',
          crowds: existing.crowds || '',
          parking: existing.parking || '',
          best_tide: existing.best_tide || '',
          best_swell: existing.best_swell || '',
          comment: existing.comment || ''
        })
      }
    }
    if (sessionsResult.data) setSessions(sessionsResult.data)
    
    setLoading(false)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (reviewForm.rating === 0) return
    
    setSubmitting(true)
    
    const { error } = await createSpotReview({
      spot_name: spotName,
      user_id: user.id,
      username: profile.username,
      ...reviewForm
    })
    
    if (!error) {
      await loadSpotData()
      setShowReviewForm(false)
    }
    
    setSubmitting(false)
  }

  const handleDeleteReview = async () => {
    if (!userReview) return
    if (!confirm('Delete your review?')) return
    
    await deleteSpotReview(userReview.id)
    setUserReview(null)
    setReviewForm({ rating: 0, skill_level: '', crowds: '', parking: '', best_tide: '', best_swell: '', comment: '' })
    await loadSpotData()
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large spot-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {/* Header */}
        <div className="spot-detail-header">
          <div className="spot-icon">
            <PinIcon size={24} color="var(--faded-coral)" />
          </div>
          <div>
            <h2 className="spot-name">{spotName}</h2>
            {stats && (
              <div className="spot-rating-summary">
                <StarRating rating={Math.round(stats.avgRating)} size={18} />
                <span className="rating-text">{stats.avgRating}</span>
                <span className="review-count">({stats.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="spot-tabs">
          <button 
            className={`spot-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button 
            className={`spot-tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
          <button 
            className={`spot-tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions ({sessions.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : (
          <div className="spot-detail-content">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="spot-info-tab">
                {stats ? (
                  <div className="spot-stats-grid">
                    <div className="spot-stat-card">
                      <span className="stat-label">Skill Level</span>
                      <span className="stat-value" style={{ 
                        color: SKILL_LEVELS.find(s => s.value === stats.skillLevel)?.color 
                      }}>
                        {SKILL_LEVELS.find(s => s.value === stats.skillLevel)?.label || '—'}
                      </span>
                    </div>
                    <div className="spot-stat-card">
                      <span className="stat-label">Typical Crowds</span>
                      <span className="stat-value">
                        {CROWDS.find(c => c.value === stats.crowds)?.label || '—'}
                      </span>
                    </div>
                    <div className="spot-stat-card">
                      <span className="stat-label">Parking</span>
                      <span className="stat-value">
                        {PARKING.find(p => p.value === stats.parking)?.label || '—'}
                      </span>
                    </div>
                    <div className="spot-stat-card">
                      <span className="stat-label">Best Tide</span>
                      <span className="stat-value">
                        {TIDES.find(t => t.value === stats.bestTide)?.label || '—'}
                      </span>
                    </div>
                    <div className="spot-stat-card">
                      <span className="stat-label">Best Swell</span>
                      <div className="stat-value swell-value">
                        {stats.bestSwell ? (
                          <>
                            <CompassIcon direction={stats.bestSwell} size={24} />
                            <span>{stats.bestSwell}</span>
                          </>
                        ) : '—'}
                      </div>
                    </div>
                    <div className="spot-stat-card">
                      <span className="stat-label">Avg Rating</span>
                      <div className="stat-value rating-value">
                        <span className="big-rating">{stats.avgRating}</span>
                        <StarRating rating={Math.round(stats.avgRating)} size={14} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No reviews yet. Be the first to review this spot!</p>
                  </div>
                )}
                
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setActiveTab('reviews')
                    setShowReviewForm(true)
                  }}
                >
                  {userReview ? 'Edit Your Review' : 'Write a Review'}
                </button>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="spot-reviews-tab">
                {/* Review Form */}
                {showReviewForm && (
                  <form className="review-form" onSubmit={handleSubmitReview}>
                    <h3>{userReview ? 'Edit Your Review' : 'Write a Review'}</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Rating *</label>
                      <StarRating 
                        rating={reviewForm.rating} 
                        size={28} 
                        interactive 
                        onChange={r => setReviewForm({ ...reviewForm, rating: r })}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Skill Level</label>
                        <select
                          value={reviewForm.skill_level}
                          onChange={e => setReviewForm({ ...reviewForm, skill_level: e.target.value })}
                          className="form-select"
                        >
                          <option value="">Select...</option>
                          {SKILL_LEVELS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Crowds</label>
                        <select
                          value={reviewForm.crowds}
                          onChange={e => setReviewForm({ ...reviewForm, crowds: e.target.value })}
                          className="form-select"
                        >
                          <option value="">Select...</option>
                          {CROWDS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Parking</label>
                        <select
                          value={reviewForm.parking}
                          onChange={e => setReviewForm({ ...reviewForm, parking: e.target.value })}
                          className="form-select"
                        >
                          <option value="">Select...</option>
                          {PARKING.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Best Tide</label>
                        <select
                          value={reviewForm.best_tide}
                          onChange={e => setReviewForm({ ...reviewForm, best_tide: e.target.value })}
                          className="form-select"
                        >
                          <option value="">Select...</option>
                          {TIDES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Best Swell Direction</label>
                      <div className="swell-buttons">
                        {SWELL_DIRECTIONS.map(dir => (
                          <button
                            key={dir}
                            type="button"
                            className={`swell-btn ${reviewForm.best_swell === dir ? 'active' : ''}`}
                            onClick={() => setReviewForm({ ...reviewForm, best_swell: dir })}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tips & Comments</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="Share your experience, tips for other surfers..."
                        className="form-textarea"
                        rows={3}
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowReviewForm(false)}>
                        Cancel
                      </button>
                      {userReview && (
                        <button type="button" className="btn-ghost btn-danger" onClick={handleDeleteReview}>
                          Delete
                        </button>
                      )}
                      <button type="submit" className="btn-primary" disabled={submitting || reviewForm.rating === 0}>
                        {submitting ? 'Saving...' : 'Save Review'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {!showReviewForm && (
                  <>
                    <div className="reviews-header">
                      <span>{reviews.length} reviews</span>
                      <button className="btn-secondary" onClick={() => setShowReviewForm(true)}>
                        {userReview ? 'Edit Review' : '+ Add Review'}
                      </button>
                    </div>
                    
                    {reviews.length === 0 ? (
                      <div className="empty-state">
                        <p>No reviews yet. Be the first!</p>
                      </div>
                    ) : (
                      <div className="reviews-list">
                        {reviews.map(review => (
                          <div key={review.id} className={`review-card ${review.user_id === user?.id ? 'own-review' : ''}`}>
                            <div className="review-header">
                              <Link to={`/profile/${review.user_id}`} className="review-author">
                                <div className="review-avatar">{review.username?.charAt(0).toUpperCase()}</div>
                                <span>{review.username}</span>
                              </Link>
                              <div className="review-meta">
                                <StarRating rating={review.rating} size={14} />
                                <span className="review-date">{formatDate(review.created_at)}</span>
                              </div>
                            </div>
                            
                            <div className="review-tags">
                              {review.skill_level && (
                                <span className="review-tag">{SKILL_LEVELS.find(s => s.value === review.skill_level)?.label}</span>
                              )}
                              {review.crowds && (
                                <span className="review-tag">{CROWDS.find(c => c.value === review.crowds)?.label}</span>
                              )}
                              {review.best_tide && (
                                <span className="review-tag">Best: {TIDES.find(t => t.value === review.best_tide)?.label}</span>
                              )}
                              {review.best_swell && (
                                <span className="review-tag">Swell: {review.best_swell}</span>
                              )}
                            </div>
                            
                            {review.comment && (
                              <p className="review-comment">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="spot-sessions-tab">
                {sessions.length === 0 ? (
                  <div className="empty-state">
                    <p>No sessions logged at this spot yet.</p>
                  </div>
                ) : (
                  <div className="sessions-list">
                    {sessions.map(session => (
                      <div key={session.id} className="session-card-mini">
                        <div className="session-date-mini">
                          {formatDate(session.session_date)}
                        </div>
                        <Link to={`/profile/${session.user_id}`} className="session-user-mini">
                          {session.username}
                        </Link>
                        <div className="session-details-mini">
                          {session.duration_minutes && <span>{Math.round(session.duration_minutes / 60)}h</span>}
                          {session.wave_size && <span>{session.wave_size}m</span>}
                          {session.rating && <StarRating rating={session.rating} size={12} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
