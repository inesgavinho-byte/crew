import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useNotifications } from '../lib/NotificationContext'
import { 
  getListings, 
  createListing, 
  expressInterest,
  uploadImage 
} from '../lib/supabase'
import { FinLogo, WaveIcon, CrewsIcon, MapIcon, UserIcon, SurfboardIcon, PinIcon, MessageIcon } from '../components/Icons'

// Board type icons
const BoardTypeIcon = ({ type, size = 24 }) => {
  return <SurfboardIcon size={size} color="var(--deep-ocean)" />
}

// Market Icon
const MarketIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M3 9 L12 2 L21 9"/>
    <path d="M4 9 L4 20 L20 20 L20 9"/>
    <path d="M9 20 L9 14 L15 14 L15 20"/>
  </svg>
)

// Tag Icon
const TagIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <circle cx="7" cy="7" r="1.5" fill={color}/>
  </svg>
)

// Board types
const BOARD_TYPES = [
  { value: 'shortboard', label: 'Shortboard' },
  { value: 'longboard', label: 'Longboard' },
  { value: 'fish', label: 'Fish' },
  { value: 'funboard', label: 'Funboard' },
  { value: 'gun', label: 'Gun' },
  { value: 'sup', label: 'SUP' },
  { value: 'bodyboard', label: 'Bodyboard' }
]

// Conditions
const CONDITIONS = [
  { value: 'new', label: 'New', color: 'var(--seafoam)' },
  { value: 'like_new', label: 'Like New', color: 'var(--seafoam)' },
  { value: 'good', label: 'Good', color: 'var(--sun-bleached)' },
  { value: 'used', label: 'Used', color: 'var(--driftwood)' }
]

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(price)
}

// Format date
const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  
  if (diff < 86400) return 'Today'
  if (diff < 172800) return 'Yesterday'
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export default function Market() {
  const { user, profile, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedListing, setSelectedListing] = useState(null)
  const [filters, setFilters] = useState({
    board_type: '',
    condition: '',
    minPrice: '',
    maxPrice: ''
  })

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async (appliedFilters = {}) => {
    setLoading(true)
    const { data } = await getListings(appliedFilters)
    if (data) setListings(data)
    setLoading(false)
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    const cleanFilters = {}
    if (filters.board_type) cleanFilters.board_type = filters.board_type
    if (filters.condition) cleanFilters.condition = filters.condition
    if (filters.minPrice) cleanFilters.minPrice = parseInt(filters.minPrice)
    if (filters.maxPrice) cleanFilters.maxPrice = parseInt(filters.maxPrice)
    loadListings(cleanFilters)
  }

  const clearFilters = () => {
    setFilters({ board_type: '', condition: '', minPrice: '', maxPrice: '' })
    loadListings()
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    loadListings()
    addNotification({
      type: 'success',
      title: 'Listing Created',
      message: 'Your board is now on the market!'
    })
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar-left">
        <div className="logo">
          <FinLogo size={32} color="#F4F1E8" />
          <div>
            <div className="logo-title">CREW</div>
            <div className="logo-tagline">your micro tribe</div>
          </div>
        </div>

        <nav className="nav-menu">
          <Link to="/feed" className="nav-link">
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
          <Link to="/market" className="nav-link active">
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
        <div className="page-header">
          <div>
            <h1 className="page-title">Board Market</h1>
            <p className="page-subtitle">Buy and sell boards with the crew</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Sell Board
          </button>
        </div>

        {/* Filters */}
        <div className="market-filters">
          <select 
            value={filters.board_type} 
            onChange={e => handleFilterChange('board_type', e.target.value)}
            className="market-filter-select"
          >
            <option value="">All Types</option>
            {BOARD_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select 
            value={filters.condition} 
            onChange={e => handleFilterChange('condition', e.target.value)}
            className="market-filter-select"
          >
            <option value="">Any Condition</option>
            {CONDITIONS.map(cond => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>

          <div className="market-price-filter">
            <input
              type="number"
              placeholder="Min €"
              value={filters.minPrice}
              onChange={e => handleFilterChange('minPrice', e.target.value)}
              className="market-price-input"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max €"
              value={filters.maxPrice}
              onChange={e => handleFilterChange('maxPrice', e.target.value)}
              className="market-price-input"
            />
          </div>

          <button className="btn-filter" onClick={applyFilters}>Apply</button>
          <button className="btn-filter-clear" onClick={clearFilters}>Clear</button>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="loading-state">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <MarketIcon size={48} color="var(--driftwood)" />
            <h3>No boards for sale</h3>
            <p>Be the first to list a board!</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              + Sell Board
            </button>
          </div>
        ) : (
          <div className="market-grid">
            {listings.map(listing => (
              <ListingCard 
                key={listing.id} 
                listing={listing}
                onClick={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Quick Stats</h3>
          <div className="market-stats">
            <div className="market-stat">
              <span className="market-stat-value">{listings.length}</span>
              <span className="market-stat-label">Active Listings</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">Popular Types</h3>
          <div className="market-type-list">
            {BOARD_TYPES.slice(0, 5).map(type => {
              const count = listings.filter(l => l.board_type === type.value).length
              return (
                <button 
                  key={type.value}
                  className="market-type-btn"
                  onClick={() => {
                    setFilters({ ...filters, board_type: type.value })
                    loadListings({ board_type: type.value })
                  }}
                >
                  <SurfboardIcon size={16} />
                  <span>{type.label}</span>
                  <span className="market-type-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <CreateListingModal 
          userId={user?.id}
          username={profile?.username}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          currentUser={user}
          currentUsername={profile?.username}
          onClose={() => setSelectedListing(null)}
          onInterestSent={() => {
            addNotification({
              type: 'success',
              title: 'Interest Sent!',
              message: `${selectedListing.username} will be notified`
            })
            setSelectedListing(null)
          }}
        />
      )}
    </div>
  )
}

// Listing Card Component
function ListingCard({ listing, onClick }) {
  const mainPhoto = listing.photos?.[0] || null
  const condition = CONDITIONS.find(c => c.value === listing.condition)
  
  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-card-image">
        {mainPhoto ? (
          <img src={mainPhoto} alt={listing.title} />
        ) : (
          <div className="listing-card-placeholder">
            <SurfboardIcon size={48} color="var(--driftwood)" />
          </div>
        )}
        <span className="listing-card-price">{formatPrice(listing.price)}</span>
      </div>
      <div className="listing-card-content">
        <h3 className="listing-card-title">{listing.title}</h3>
        <div className="listing-card-meta">
          <span className="listing-card-type">{listing.board_type}</span>
          {listing.size && <span className="listing-card-size">{listing.size}</span>}
          <span 
            className="listing-card-condition"
            style={{ color: condition?.color }}
          >
            {condition?.label}
          </span>
        </div>
        <div className="listing-card-footer">
          {listing.location && (
            <span className="listing-card-location">
              <PinIcon size={12} />
              {listing.location}
            </span>
          )}
          <span className="listing-card-date">{formatDate(listing.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// Create Listing Modal
function CreateListingModal({ userId, username, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    board_type: 'shortboard',
    size: '',
    condition: 'good',
    location: ''
  })
  const [photos, setPhotos] = useState([])
  const [photoFiles, setPhotoFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value })
  }

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files)
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed')
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each photo must be under 5MB')
        return
      }
      setPhotoFiles(prev => [...prev, file])
      setPhotos(prev => [...prev, URL.createObjectURL(file)])
    })
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    if (!formData.price || formData.price <= 0) {
      setError('Valid price is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Upload photos
      const photoUrls = []
      for (const file of photoFiles) {
        const url = await uploadImage(file, 'market')
        photoUrls.push(url)
      }

      // Create listing
      await createListing({
        user_id: userId,
        username,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: parseInt(formData.price),
        board_type: formData.board_type,
        size: formData.size.trim() || null,
        condition: formData.condition,
        location: formData.location.trim() || null,
        photos: photoUrls
      })

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Sell Your Board</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Photos */}
          <div className="form-group">
            <label className="form-label">Photos (max 5)</label>
            <div className="photo-upload-grid">
              {photos.map((photo, i) => (
                <div key={i} className="photo-upload-item">
                  <img src={photo} alt="" />
                  <button type="button" onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
              {photos.length < 5 && (
                <button 
                  type="button" 
                  className="photo-upload-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  +
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoAdd}
              style={{ display: 'none' }}
            />
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g., Channel Islands Sampler 6'2"
              className="form-input"
            />
          </div>

          {/* Board Type & Size */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Board Type *</label>
              <select
                value={formData.board_type}
                onChange={e => handleChange('board_type', e.target.value)}
                className="form-select"
              >
                {BOARD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={e => handleChange('size', e.target.value)}
                placeholder="e.g., 6'2"
                className="form-input"
              />
            </div>
          </div>

          {/* Price & Condition */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (€) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={e => handleChange('price', e.target.value)}
                placeholder="350"
                min="1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Condition *</label>
              <select
                value={formData.condition}
                onChange={e => handleChange('condition', e.target.value)}
                className="form-select"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g., Ericeira, Lisboa"
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Add details about the board..."
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Listing Detail Modal
function ListingDetailModal({ listing, currentUser, currentUsername, onClose, onInterestSent }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const condition = CONDITIONS.find(c => c.value === listing.condition)
  const isOwner = listing.user_id === currentUser?.id

  const handleInterest = async () => {
    setSending(true)
    try {
      await expressInterest(listing.id, currentUser.id, currentUsername, message)
      onInterestSent()
    } catch (err) {
      console.error('Error expressing interest:', err)
    }
    setSending(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <button className="modal-close-float" onClick={onClose}>×</button>
        
        <div className="listing-detail">
          {/* Photos */}
          <div className="listing-detail-photos">
            {listing.photos?.length > 0 ? (
              <>
                <div className="listing-main-photo">
                  <img src={listing.photos[currentPhotoIndex]} alt={listing.title} />
                </div>
                {listing.photos.length > 1 && (
                  <div className="listing-photo-thumbs">
                    {listing.photos.map((photo, i) => (
                      <button
                        key={i}
                        className={`listing-thumb ${i === currentPhotoIndex ? 'active' : ''}`}
                        onClick={() => setCurrentPhotoIndex(i)}
                      >
                        <img src={photo} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="listing-no-photo">
                <SurfboardIcon size={80} color="var(--driftwood)" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="listing-detail-info">
            <div className="listing-detail-header">
              <h2>{listing.title}</h2>
              <span className="listing-detail-price">{formatPrice(listing.price)}</span>
            </div>

            <div className="listing-detail-tags">
              <span className="listing-tag">{BOARD_TYPES.find(t => t.value === listing.board_type)?.label}</span>
              {listing.size && <span className="listing-tag">{listing.size}</span>}
              <span className="listing-tag" style={{ background: condition?.color, color: '#fff' }}>
                {condition?.label}
              </span>
            </div>

            {listing.location && (
              <div className="listing-detail-location">
                <PinIcon size={16} color="var(--seafoam)" />
                <span>{listing.location}</span>
              </div>
            )}

            {listing.description && (
              <p className="listing-detail-description">{listing.description}</p>
            )}

            <div className="listing-detail-seller">
              <div className="listing-seller-avatar">
                {listing.username?.charAt(0).toUpperCase()}
              </div>
              <div className="listing-seller-info">
                <Link to={`/profile/${listing.user_id}`} className="listing-seller-name">
                  {listing.username}
                </Link>
                <span className="listing-seller-date">Listed {formatDate(listing.created_at)}</span>
              </div>
            </div>

            {!isOwner && (
              <div className="listing-interest-form">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a message (optional)..."
                  className="form-textarea"
                  rows={3}
                />
                <button 
                  className="btn-primary btn-block"
                  onClick={handleInterest}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : "I'm Interested"}
                </button>
              </div>
            )}

            {isOwner && (
              <div className="listing-owner-actions">
                <button className="btn-secondary">Edit Listing</button>
                <button className="btn-danger">Mark as Sold</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
