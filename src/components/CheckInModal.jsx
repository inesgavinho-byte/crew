import { useState } from 'react'
import { createSignal } from '../lib/supabase'

export default function CheckInModal({ crews, spots, onClose, onSuccess, userId, addNotification }) {
  const [selectedCrew, setSelectedCrew] = useState(crews[0]?.crew_id || '')
  const [spotName, setSpotName] = useState('')
  const [condition, setCondition] = useState('')
  const [size, setSize] = useState('')
  const [wind, setWind] = useState('')
  const [crowd, setCrowd] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const conditions = ['glassy', 'clean', 'choppy', 'blown', 'flat']
  const conditionLabels = {
    glassy: 'glassy',
    clean: 'clean',
    choppy: 'choppy',
    blown: 'blown',
    flat: 'flat'
  }
  const sizes = ['0.3-0.5m', '0.5-0.8m', '0.8-1.2m', '1.2-1.5m', '1.5-2m', '2m+']
  const winds = ['offshore', 'light', 'side', 'onshore']
  const crowds = ['empty', 'chill', 'packed']
  const crowdLabels = {
    empty: 'empty',
    chill: 'chill',
    packed: 'packed'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCrew || !spotName || !condition) {
      setError('Select crew, spot and conditions')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: signalData, error } = await createSignal(selectedCrew, spotName, condition, size || null, wind || null, crowd || null, note || null)
      if (error) throw error

      onSuccess(signalData)
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
          <h3 className="modal-title">Signal Your Crew</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Crew</label>
            <select className="form-select" value={selectedCrew} onChange={(e) => setSelectedCrew(e.target.value)}>
              {crews.map(c => (
                <option key={c.crew_id} value={c.crew_id}>
                  {c.crews.name} ({c.crews.sport})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Spot</label>
            <input
              type="text"
              className="form-input"
              placeholder="Where are you?"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              list="spots-list"
            />
            <datalist id="spots-list">
              {spots.map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Conditions</label>
            <div className="condition-options">
              {conditions.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`condition-option ${condition === c ? 'selected' : ''}`}
                  onClick={() => setCondition(c)}
                >
                  {conditionLabels[c]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Size</label>
              <select className="form-select" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="">—</option>
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Wind</label>
              <select className="form-select" value={wind} onChange={(e) => setWind(e.target.value)}>
                <option value="">—</option>
                {winds.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Crowd</label>
            <div className="condition-options">
              {crowds.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`condition-option crowd-option ${crowd === c ? 'selected' : ''} crowd-${c}`}
                  onClick={() => setCrowd(c)}
                >
                  {crowdLabels[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Any extra info for the crew..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Signal'}
          </button>
        </form>
      </div>
    </div>
  )
}
