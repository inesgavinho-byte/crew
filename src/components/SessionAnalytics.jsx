import { useState, useEffect } from 'react'
import { getSessionAnalytics } from '../lib/supabase'
import { WaveIcon, PinIcon, SurfboardIcon, StarIcon } from './Icons'

export default function SessionAnalytics({ userId }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [userId])

  const loadAnalytics = async () => {
    setLoading(true)
    const { data } = await getSessionAnalytics(userId)
    if (data) setAnalytics(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="loading">Carregando analytics...</div>
  }

  if (!analytics || analytics.totalSessions === 0) {
    return (
      <div className="analytics-empty">
        <WaveIcon size={48} color="var(--driftwood)" />
        <p>Sem sessões registadas. Começa a registar as tuas sessões para veres as estatísticas!</p>
      </div>
    )
  }

  const maxMonthlyCount = Math.max(...analytics.monthlyData.map(m => m.count), 1)

  return (
    <div className="session-analytics">
      {/* Summary Stats */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon">
            <WaveIcon size={28} color="var(--seafoam)" />
          </div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{analytics.totalSessions}</div>
            <div className="analytics-stat-label">Total Sessions</div>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon" style={{ fontSize: '28px', color: 'var(--deep-ocean)' }}>
            ⏱️
          </div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{analytics.totalHours}h</div>
            <div className="analytics-stat-label">Horas Surfadas</div>
          </div>
        </div>

        {analytics.avgRating > 0 && (
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon">
              <StarIcon size={28} color="var(--sun-bleached)" />
            </div>
            <div className="analytics-stat-content">
              <div className="analytics-stat-value">{analytics.avgRating}</div>
              <div className="analytics-stat-label">Rating Médio</div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Chart */}
      {analytics.monthlyData.length > 0 && (
        <div className="analytics-section">
          <h4 className="analytics-section-title">
            <WaveIcon size={18} color="var(--deep-ocean)" />
            <span>Sessões nos Últimos 12 Meses</span>
          </h4>
          <div className="analytics-chart">
            {analytics.monthlyData.map((item, i) => (
              <div key={i} className="analytics-chart-bar">
                <div
                  className="analytics-chart-bar-fill"
                  style={{
                    height: `${(item.count / maxMonthlyCount) * 100}%`,
                    background: 'var(--seafoam)'
                  }}
                >
                  {item.count > 0 && (
                    <span className="analytics-chart-bar-value">{item.count}</span>
                  )}
                </div>
                <div className="analytics-chart-bar-label">{item.month.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Spots */}
      {analytics.favoriteSpots.length > 0 && (
        <div className="analytics-section">
          <h4 className="analytics-section-title">
            <PinIcon size={18} color="var(--deep-ocean)" />
            <span>Spots Favoritos</span>
          </h4>
          <div className="analytics-list">
            {analytics.favoriteSpots.map((item, i) => (
              <div key={i} className="analytics-list-item">
                <div className="analytics-list-rank">#{i + 1}</div>
                <div className="analytics-list-name">{item.spot}</div>
                <div className="analytics-list-count">{item.count} {item.count === 1 ? 'sessão' : 'sessões'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Board Usage */}
      {analytics.boardUsage.length > 0 && (
        <div className="analytics-section">
          <h4 className="analytics-section-title">
            <SurfboardIcon size={18} color="var(--deep-ocean)" />
            <span>Pranchas Mais Usadas</span>
          </h4>
          <div className="analytics-list">
            {analytics.boardUsage.map((item, i) => (
              <div key={i} className="analytics-list-item">
                <div className="analytics-list-rank">#{i + 1}</div>
                <div className="analytics-list-name">{item.board}</div>
                <div className="analytics-list-count">{item.count} {item.count === 1 ? 'vez' : 'vezes'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
