import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { createAlert, updateAlert } from '../lib/supabase'
import { PinIcon } from './Icons'

const SWELL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const WIND_OPTIONS = [
  { value: 'any', label: 'Any wind' },
  { value: 'offshore', label: 'Offshore only' }
]

export default function CreateAlertModal({ spotName, onClose, onSuccess, editAlert = null }) {
  const { user } = useAuth()
  
  const [form, setForm] = useState({
    wave_min: editAlert?.wave_min || '',
    wave_max: editAlert?.wave_max || '',
    wind_max: editAlert?.wind_max || '',
    wind_direction: editAlert?.wind_direction || 'any',
    swell_direction: editAlert?.swell_direction || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // At least one condition must be set
    if (!form.wave_min && !form.wave_max && !form.wind_max && !form.swell_direction) {
      setError('Set at least one condition')
      return
    }

    setLoading(true)
    setError('')

    try {
      const alertData = {
        user_id: user.id,
        spot_name: spotName,
        wave_min: form.wave_min ? parseFloat(form.wave_min) : null,
        wave_max: form.wave_max ? parseFloat(form.wave_max) : null,
        wind_max: form.wind_max ? parseInt(form.wind_max) : null,
        wind_direction: form.wind_direction || null,
        swell_direction: form.swell_direction || null
      }

      if (editAlert) {
        await updateAlert(editAlert.id, alertData)
      } else {
        await createAlert(alertData)
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
          <h3 className="modal-title">
            {editAlert ? 'Edit Alert' : 'Create Alert'}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Spot */}
          <div className="alert-spot-header">
            <PinIcon size={20} color="var(--faded-coral)" />
            <span>{spotName}</span>
          </div>

          <p className="alert-description">
            Get notified when conditions match at this spot
          </p>

          {/* Wave Size */}
          <div className="form-group">
            <label className="form-label">Wave Size (meters)</label>
            <div className="range-inputs">
              <div className="range-input">
                <label>Min</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.wave_min}
                  onChange={e => setForm({ ...form, wave_min: e.target.value })}
                  placeholder="0.5"
                  className="form-input"
                />
              </div>
              <span className="range-separator">to</span>
              <div className="range-input">
                <label>Max</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.wave_max}
                  onChange={e => setForm({ ...form, wave_max: e.target.value })}
                  placeholder="2.0"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Wind */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Wind Speed (km/h)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.wind_max}
                onChange={e => setForm({ ...form, wind_max: e.target.value })}
                placeholder="15"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wind Type</label>
              <select
                value={form.wind_direction}
                onChange={e => setForm({ ...form, wind_direction: e.target.value })}
                className="form-select"
              >
                {WIND_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swell Direction */}
          <div className="form-group">
            <label className="form-label">Swell Direction</label>
            <div className="swell-buttons">
              <button
                type="button"
                className={`swell-btn ${!form.swell_direction ? 'active' : ''}`}
                onClick={() => setForm({ ...form, swell_direction: '' })}
              >
                Any
              </button>
              {SWELL_DIRECTIONS.map(dir => (
                <button
                  key={dir}
                  type="button"
                  className={`swell-btn ${form.swell_direction === dir ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, swell_direction: dir })}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="alert-summary">
            <strong>Alert when:</strong>
            <ul>
              {form.wave_min && <li>Waves ≥ {form.wave_min}m</li>}
              {form.wave_max && <li>Waves ≤ {form.wave_max}m</li>}
              {form.wind_max && <li>Wind ≤ {form.wind_max} km/h</li>}
              {form.wind_direction === 'offshore' && <li>Wind is offshore</li>}
              {form.swell_direction && <li>Swell from {form.swell_direction}</li>}
            </ul>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editAlert ? 'Update Alert' : 'Create Alert')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
