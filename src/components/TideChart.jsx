import { useState, useEffect, useMemo } from 'react'
import { getTideData, findNearestPort, formatTideTime, getCurrentTideState } from '../lib/tides'

// Tide arrow icons
const TideUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4L6 10H10V20H14V10H18L12 4Z"/>
  </svg>
)

const TideDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 20L18 14H14V4H10V14H6L12 20Z"/>
  </svg>
)

export default function TideChart({ lat, lng, collapsed = false }) {
  const [tideData, setTideData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nearestPort, setNearestPort] = useState(null)

  useEffect(() => {
    if (lat && lng) {
      loadTideData(lat, lng)
    }
  }, [lat, lng])

  const loadTideData = async (latitude, longitude) => {
    setLoading(true)
    
    const port = findNearestPort(latitude, longitude)
    setNearestPort(port)
    
    const data = await getTideData(port.id)
    setTideData(data)
    setLoading(false)
  }

  // Current time marker position
  const currentHour = useMemo(() => {
    const now = new Date()
    return now.getHours() + now.getMinutes() / 60
  }, [])

  // Calculate tide state
  const tideState = useMemo(() => {
    if (!tideData?.extremes) return null
    return getCurrentTideState(tideData.extremes)
  }, [tideData])

  if (loading) {
    return (
      <div className="tide-chart-container">
        <div className="tide-loading">Loading tides...</div>
      </div>
    )
  }

  if (!tideData || !tideData.success) {
    return null
  }

  // SVG dimensions
  const width = 280
  const height = collapsed ? 60 : 100
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  // Scale functions
  const maxHeight = Math.max(...tideData.data.map(d => d.height))
  const minHeight = Math.min(...tideData.data.map(d => d.height))
  const heightRange = maxHeight - minHeight || 1

  const xScale = (hour) => padding.left + (hour / 24) * graphWidth
  const yScale = (h) => padding.top + graphHeight - ((h - minHeight) / heightRange) * graphHeight

  // Generate path
  const pathD = tideData.data
    .map((d, i) => {
      const x = xScale(d.hour)
      const y = yScale(d.height)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  // Fill area
  const areaD = `${pathD} L ${xScale(24)} ${yScale(minHeight)} L ${xScale(0)} ${yScale(minHeight)} Z`

  // Current time line
  const currentX = xScale(currentHour)

  // Get current height (interpolated)
  const currentDataPoint = tideData.data.find(d => d.hour >= currentHour) || tideData.data[0]
  const currentHeight = currentDataPoint?.height || 0

  return (
    <div className="tide-chart-container">
      <div className="tide-header">
        <div className="tide-title">
          <span className="tide-port">{nearestPort?.name}</span>
          <span className="tide-distance">{nearestPort?.distance.toFixed(0)}km</span>
        </div>
        <div className="tide-now">
          <span className={`tide-state ${tideState?.state}`}>
            {tideState?.state === 'rising' ? <TideUpIcon size={14} /> : <TideDownIcon size={14} />}
            {tideState?.state === 'rising' ? 'A subir' : 'A descer'}
          </span>
          <span className="tide-height">{currentHeight.toFixed(1)}m</span>
        </div>
      </div>

      <svg width={width} height={height} className="tide-svg">
        {/* Grid lines */}
        <line 
          x1={padding.left} 
          y1={yScale(maxHeight)} 
          x2={width - padding.right} 
          y2={yScale(maxHeight)} 
          stroke="rgba(91, 138, 114, 0.2)" 
          strokeDasharray="2,2"
        />
        <line 
          x1={padding.left} 
          y1={yScale(minHeight)} 
          x2={width - padding.right} 
          y2={yScale(minHeight)} 
          stroke="rgba(91, 138, 114, 0.2)" 
          strokeDasharray="2,2"
        />

        {/* Area fill */}
        <path 
          d={areaD} 
          fill="rgba(91, 138, 114, 0.15)"
        />

        {/* Tide curve */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="var(--seafoam)" 
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Current time marker */}
        <line 
          x1={currentX} 
          y1={padding.top} 
          x2={currentX} 
          y2={height - padding.bottom} 
          stroke="var(--sunset-coral)" 
          strokeWidth="2"
          strokeDasharray="4,2"
        />
        <circle 
          cx={currentX} 
          cy={yScale(currentHeight)} 
          r="4" 
          fill="var(--sunset-coral)"
        />

        {/* High/Low markers */}
        {!collapsed && tideData.extremes.map((ext, i) => {
          const x = xScale(ext.time.getHours() + ext.time.getMinutes() / 60)
          const y = yScale(ext.height)
          return (
            <g key={i}>
              <circle 
                cx={x} 
                cy={y} 
                r="3" 
                fill={ext.type === 'high' ? 'var(--seafoam)' : 'var(--deep-ocean)'}
                stroke="white"
                strokeWidth="1.5"
              />
              <text 
                x={x} 
                y={ext.type === 'high' ? y - 8 : y + 14} 
                textAnchor="middle" 
                fontSize="9" 
                fill="var(--text-muted)"
              >
                {formatTideTime(ext.time)}
              </text>
            </g>
          )
        })}

        {/* Time labels */}
        {[0, 6, 12, 18, 24].map(hour => (
          <text 
            key={hour} 
            x={xScale(hour)} 
            y={height - 4} 
            textAnchor="middle" 
            fontSize="9" 
            fill="var(--text-muted)"
          >
            {hour === 24 ? '00' : hour.toString().padStart(2, '0')}
          </text>
        ))}

        {/* Y-axis labels */}
        <text 
          x={padding.left - 4} 
          y={yScale(maxHeight) + 3} 
          textAnchor="end" 
          fontSize="9" 
          fill="var(--text-muted)"
        >
          {maxHeight.toFixed(1)}m
        </text>
        <text 
          x={padding.left - 4} 
          y={yScale(minHeight) + 3} 
          textAnchor="end" 
          fontSize="9" 
          fill="var(--text-muted)"
        >
          {minHeight.toFixed(1)}m
        </text>
      </svg>

      {/* Extremes list */}
      {!collapsed && (
        <div className="tide-extremes">
          {tideData.extremes.slice(0, 4).map((ext, i) => (
            <div key={i} className={`tide-extreme ${ext.type}`}>
              <span className="extreme-type">
                {ext.type === 'high' ? '▲' : '▼'}
              </span>
              <span className="extreme-time">{formatTideTime(ext.time)}</span>
              <span className="extreme-height">{ext.height.toFixed(1)}m</span>
            </div>
          ))}
        </div>
      )}

      {/* Coefficient */}
      <div className="tide-coef">
        Coef. {tideData.coefficient}
      </div>
    </div>
  )
}
