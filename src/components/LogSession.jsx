import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { createSession, updateSession } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { SurfboardIcon } from './Icons'

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

const WIND_OPTIONS = [
  { value: 'offshore', label: 'Offshore' },
  { value: 'onshore', label: 'Onshore' },
  { value: 'cross', label: 'Cross' },
  { value: 'none', label: 'No wind' }
]

const TIDE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'mid', label: 'Mid' },
  { value: 'high', label: 'High' }
]

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4+ hours' }
]

// Common surf spots
const COMMON_SPOTS = [
  'Coxos', 'Ribeira d\'Ilhas', 'Foz do Lizandro', 'São Lourenço',
  'Praia Grande', 'Guincho', 'Costa da Caparica', 'Carcavelos',
  'Supertubos', 'Baleal', 'Peniche', 'Ericeira', 'Nazaré'
]

export default function LogSession({ onClose, onSuccess, signal = null, editSession = null }) {
  const { user, profile } = useAuth()
  
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    spot_name: signal?.spot_name || editSession?.spot_name || '',
    session_date: editSession?.session_date || new Date().toISOString().split('T')[0],
    start_time: editSession?.start_time?.slice(0, 5) || '',
    duration_minutes: editSession?.duration_minutes || 90,
    board_id: editSession?.board_id || '',
    wave_size: editSession?.wave_size || '',
    wind: editSession?.wind || '',
    tide: editSession?.tide || '',
    rating: editSession?.rating || 0,
    notes: editSession?.notes || ''
  })

  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    const { data } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', user.id)
    if (data) setBoards(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.spot_name.trim()) {
      setError('Spot name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedBoard = boards.find(b => b.id === form.board_id)
      
      const sessionData = {
        user_id: user.id,
        username: profile.username,
        signal_id: signal?.id || null,
        spot_name: form.spot_name.trim(),
        session_date: form.session_date,
        start_time: form.start_time || null,
        duration_minutes: form.duration_minutes || null,
        board_id: form.board_id || null,
        board_name: selectedBoard?.name || null,
        wave_size: form.wave_size ? parseFloat(form.wave_size) : null,
        wind: form.wind || null,
        tide: form.tide || null,
        rating: form.rating || null,
        notes: form.notes.trim() || null
      }

      if (editSession) {
        await updateSession(editSession.id, sessionData)
      } else {
        await createSession(sessionData)
      }

      onSuccess?.()
      onClose()
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
          <h3 className="modal-title">{editSession ? 'Edit Session' : 'Log Session'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Spot */}
          <div className="form-group">
            <label className="form-label">Spot *</label>
            <input
              type="text"
              list="spots-list"
              value={form.spot_name}
              onChange={e => setForm({ ...form, spot_name: e.target.value })}
              placeholder="e.g., Coxos"
              className="form-input"
            />
            <datalist id="spots-list">
              {COMMON_SPOTS.map(spot => (
                <option key={spot} value={spot} />
              ))}
            </datalist>
          </div>

          {/* Date and Time */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={form.session_date}
                onChange={e => setForm({ ...form, session_date: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Duration and Board */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <select
                value={form.duration_minutes}
                onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                className="form-select"
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Board Used</label>
              <select
                value={form.board_id}
                onChange={e => setForm({ ...form, board_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select board...</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.name} ({board.size})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="form-group">
            <label className="form-label">Conditions</label>
            <div className="conditions-row">
              <div className="condition-input">
                <label>Wave Size (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.wave_size}
                  onChange={e => setForm({ ...form, wave_size: e.target.value })}
                  placeholder="1.5"
                  className="form-input"
                />
              </div>
              <div className="condition-input">
                <label>Wind</label>
                <select
                  value={form.wind}
                  onChange={e => setForm({ ...form, wind: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select...</option>
                  {WIND_OPTIONS.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
              <div className="condition-input">
                <label>Tide</label>
                <select
                  value={form.tide}
                  onChange={e => setForm({ ...form, tide: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select...</option>
                  {TIDE_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label">How was it?</label>
            <StarRating 
              rating={form.rating} 
              size={32} 
              interactive 
              onChange={r => setForm({ ...form, rating: r })}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="How was the session? Any memorable waves?"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editSession ? 'Update' : 'Log Session')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
