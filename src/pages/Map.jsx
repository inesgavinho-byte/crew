import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../lib/AuthContext'
import { useNotifications } from '../lib/NotificationContext'
import { supabase, getSpots, getMyCrews, getSignalsFeed } from '../lib/supabase'
import { getForecast, degreesToDirection } from '../lib/forecast'
import { WaveIcon, PinIcon, WindIcon, RatingDots, BellIcon } from '../components/Icons'
import { ConditionIcon } from '../components/Icons'
import Layout from '../components/Layout'
import SpotDetail from '../components/SpotDetail'
import CreateAlertModal from '../components/CreateAlertModal'
import CheckInModal from '../components/CheckInModal'
import TideChart from '../components/TideChart'
import 'leaflet/dist/leaflet.css'

// Condition colors for map markers
const markerColors = {
  glassy: '#2D8C8C',
  clean: '#1A1A1A',
  choppy: '#E88C3A',
  blown: '#E85D3B',
  flat: '#888888'
}

// Default marker icon (no signal today)
const defaultIcon = L.divIcon({
  className: 'signal-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #2D4A55;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
})

// Condition-based marker icon with colored dot
const createConditionIcon = (condition) => {
  const color = markerColors[condition] || '#2D4A55'
  return L.divIcon({
    className: 'signal-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  })
}

// Component to fit map bounds
function FitBounds({ spots }) {
  const map = useMap()
  
  useEffect(() => {
    if (spots.length > 0) {
      const bounds = L.latLngBounds(spots.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [spots, map])
  
  return null
}

// Component to track map center for tides
function MapCenterTracker({ onCenterChange }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter()
      onCenterChange({ lat: center.lat, lng: center.lng })
    },
    load: () => {
      const center = map.getCenter()
      onCenterChange({ lat: center.lat, lng: center.lng })
    }
  })
  
  // Get initial center
  useEffect(() => {
    const center = map.getCenter()
    onCenterChange({ lat: center.lat, lng: center.lng })
  }, [map, onCenterChange])
  
  return null
}

export default function Map() {
  const { user, profile, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const [spots, setSpots] = useState([])
  const [signals, setSignals] = useState([])
  const [crews, setCrews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [showSpotDetail, setShowSpotDetail] = useState(null)
  const [showCreateAlert, setShowCreateAlert] = useState(null) // spot name for alert
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [forecast, setForecast] = useState(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 39.5, lng: -8.5 })
  const [showTide, setShowTide] = useState(false)
  const crewIdsRef = useRef([])

  // Portugal center
  const defaultCenter = [39.5, -8.5]
  const defaultZoom = 7

  useEffect(() => {
    loadData()
  }, [])

  // Load forecast when spot is selected
  useEffect(() => {
    if (selectedSpot && selectedSpot.latitude && selectedSpot.longitude) {
      loadForecast(selectedSpot)
    } else {
      setForecast(null)
    }
  }, [selectedSpot])

  const loadForecast = async (spot) => {
    setForecastLoading(true)
    const data = await getForecast(spot.latitude, spot.longitude)
    if (data.success) {
      setForecast(data.processed)
    }
    setForecastLoading(false)
  }

  // Real-time subscription for map updates
  useEffect(() => {
    if (crewIdsRef.current.length === 0) return

    const channel = supabase
      .channel('map-signals-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals'
        },
        async (payload) => {
          if (!crewIdsRef.current.includes(payload.new.crew_id)) return
          
          const { data } = await supabase
            .from('signals_feed')
            .select('*')
            .eq('id', payload.new.id)
            .single()
          
          if (data) {
            setSignals(prev => [data, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spots])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: spotsData, error: spotsError } = await getSpots()
      if (spotsError) throw spotsError
      if (spotsData) setSpots(spotsData)
      
      const { data: crewsData } = await getMyCrews()
      if (crewsData) {
        setCrews(crewsData)
        const crewIds = crewsData.map(c => c.crew_id)
        crewIdsRef.current = crewIds
        if (crewIds.length > 0) {
          const { data: signalsData } = await getSignalsFeed(crewIds)
          if (signalsData) setSignals(signalsData)
        }
      }
    } catch (err) {
      console.error('Error loading map data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter spots with coordinates
  const spotsWithCoords = spots.filter(s => s.latitude && s.longitude)

  // Get latest signal for each spot (today only)
  const getLatestSignal = (spotName) => {
    const today = new Date().toDateString()
    const spotSignals = signals.filter(s => {
      const signalDate = new Date(s.created_at).toDateString()
      return s.spot_name?.toLowerCase() === spotName.toLowerCase() && signalDate === today
    })
    return spotSignals.length > 0 ? spotSignals[0] : null
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const conditionColors = {
    glassy: '#2D8C8C',
    clean: '#1A1A1A',
    choppy: '#E88C3A',
    blown: '#E85D3B',
    flat: '#888888'
  }

  const legendExtra = (
    <div className="sidebar-legend">
      <h4 style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Conditions
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(conditionColors).map(([name, color]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: color,
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
            <span style={{ color: '#aaa', fontSize: '13px', textTransform: 'capitalize' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const rightSidebarContent = selectedSpot ? (
    <div className="forecast-panel">
      <div className="forecast-header">
        <button
          className="forecast-back"
          onClick={() => setSelectedSpot(null)}
        >
          ← Back
        </button>
        <h3 className="forecast-spot-name">{selectedSpot.name}</h3>
        {selectedSpot.location && (
          <p className="forecast-location">{selectedSpot.location}</p>
        )}
      </div>

      {forecastLoading ? (
        <div className="forecast-loading">
          <div className="forecast-loading-spinner" />
          Loading forecast...
        </div>
      ) : forecast ? (
        <>
          <div className="forecast-days">
            <h4 className="forecast-section-title">3-Day Forecast</h4>
            <div className="forecast-days-grid">
              {forecast.daily.map((day, i) => (
                <div key={i} className="forecast-day-card">
                  <span className="forecast-day-name">{day.dayName}</span>
                  <RatingDots rating={day.rating} size={12} />
                  <span className="forecast-day-wave">{day.maxWave}m</span>
                  <span className="forecast-day-wind">{day.avgWind} km/h</span>
                  <span className="forecast-day-period">{day.avgPeriod}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="forecast-hourly">
            <h4 className="forecast-section-title">Next Hours</h4>
            <div className="forecast-hourly-list">
              {forecast.hourly.slice(0, 12).map((hour, i) => (
                <div key={i} className="forecast-hour-row">
                  <span className="forecast-hour-time">
                    {hour.hour.toString().padStart(2, '0')}:00
                  </span>
                  <span className="forecast-hour-wave">
                    {hour.waveHeight.toFixed(1)}m
                  </span>
                  <span className="forecast-hour-period">
                    {hour.wavePeriod.toFixed(0)}s
                  </span>
                  <span className="forecast-hour-wind">
                    {hour.windSpeed.toFixed(0)} km/h {degreesToDirection(hour.windDirection)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const latestSignal = getLatestSignal(selectedSpot.name)
            if (!latestSignal) return null
            return (
              <div className="forecast-current">
                <h4 className="forecast-section-title">Crew Report</h4>
                <div className="forecast-signal-card">
                  <div className="forecast-signal-condition" style={{
                    background: conditionColors[latestSignal.condition],
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ConditionIcon condition={latestSignal.condition} size={14} />
                    {latestSignal.condition}
                  </div>
                  <div className="forecast-signal-details">
                    {latestSignal.size && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <WaveIcon size={14} color="var(--seafoam)" />
                        {latestSignal.size}
                      </span>
                    )}
                    {latestSignal.wind && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <WindIcon size={14} color="var(--driftwood)" />
                        {latestSignal.wind}
                      </span>
                    )}
                    {latestSignal.crowd && (
                      <span className={`forecast-crowd forecast-crowd-${latestSignal.crowd}`}>
                        {latestSignal.crowd}
                      </span>
                    )}
                  </div>
                  {latestSignal.note && (
                    <p className="forecast-signal-note">"{latestSignal.note}"</p>
                  )}
                  <p className="forecast-signal-meta">
                    {latestSignal.username} • {formatTime(latestSignal.created_at)}
                  </p>
                </div>
              </div>
            )
          })()}
        </>
      ) : (
        <div className="forecast-error">
          Unable to load forecast
        </div>
      )}
    </div>
  ) : (
    <div className="sidebar-section">
      <h3 className="sidebar-title">Spots ({spots.length})</h3>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
        Click a spot for forecast
      </p>
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {spots.map(spot => (
          <div
            key={spot.id}
            className="spot-item spot-item-clickable"
            onClick={() => spot.latitude && setSelectedSpot(spot)}
            style={{ cursor: spot.latitude ? 'pointer' : 'default' }}
          >
            <PinIcon size={14} />
            <span className="spot-item-name">
              {spot.name}
              <span style={{ color: spot.latitude ? '#2D8C8C' : '#ccc', marginLeft: '4px' }}>
                {spot.latitude ? '✓' : '✗'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Layout
      sidebarExtra={legendExtra}
      rightSidebar={rightSidebarContent}
      mainStyle={{ padding: 0, position: 'relative' }}
    >
        {loading ? (
          <div className="loading">Loading map...</div>
        ) : error ? (
          <div className="loading" style={{ color: 'var(--coral)' }}>Error: {error}</div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ width: '100%', height: '100vh' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            <MapCenterTracker onCenterChange={setMapCenter} />
            {spotsWithCoords.length > 0 && <FitBounds spots={spotsWithCoords} />}
            
            {spotsWithCoords.map(spot => {
              const latestSignal = getLatestSignal(spot.name)
              const icon = latestSignal ? createConditionIcon(latestSignal.condition) : defaultIcon
              
              return (
                <Marker
                  key={spot.id}
                  position={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedSpot(spot)
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '180px' }}>
                      <h3 style={{ 
                        fontFamily: "'Permanent Marker', cursive", 
                        fontSize: '16px', 
                        margin: '0 0 4px 0' 
                      }}>
                        {spot.name}
                      </h3>
                      {spot.location && (
                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#666' }}>
                          {spot.location}
                        </p>
                      )}
                      
                      {latestSignal ? (
                        <div>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '4px 12px', 
                            borderRadius: '20px',
                            background: conditionColors[latestSignal.condition] || '#888',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            marginBottom: '8px'
                          }}>
                            {latestSignal.condition}
                          </div>
                          
                          {(latestSignal.size || latestSignal.wind || latestSignal.crowd) && (
                            <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--driftwood)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              {latestSignal.size && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <WaveIcon size={14} color="var(--seafoam)" />
                                  {latestSignal.size}
                                </span>
                              )}
                              {latestSignal.size && latestSignal.wind && <span style={{ color: 'var(--sand-dark)' }}> • </span>}
                              {latestSignal.wind && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <WindIcon size={14} color="var(--driftwood)" />
                                  {latestSignal.wind}
                                </span>
                              )}
                              {(latestSignal.size || latestSignal.wind) && latestSignal.crowd && <span style={{ color: 'var(--sand-dark)' }}> • </span>}
                              {latestSignal.crowd && (
                                <span style={{ 
                                  color: latestSignal.crowd === 'empty' ? 'var(--seafoam)' : 
                                         latestSignal.crowd === 'chill' ? 'var(--sun-bleached)' : 'var(--faded-coral)',
                                  fontWeight: 500
                                }}>
                                  {latestSignal.crowd}
                                </span>
                              )}
                            </p>
                          )}
                          
                          {latestSignal.note && (
                            <p style={{ 
                              margin: '8px 0', 
                              fontSize: '13px', 
                              fontFamily: 'var(--font-script)',
                              color: 'var(--driftwood)',
                              borderLeft: '2px solid var(--sand-dark)',
                              paddingLeft: '8px'
                            }}>
                              "{latestSignal.note}"
                            </p>
                          )}
                          
                          <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--driftwood)' }}>
                            {latestSignal.username} • {formatTime(latestSignal.created_at)}
                          </p>
                        </div>
                      ) : (
                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--driftwood)' }}>
                          No signals today
                        </p>
                      )}
                      
                      <button 
                        className="btn-secondary btn-small"
                        onClick={() => setShowSpotDetail(spot.name)}
                        style={{ marginTop: '12px', width: '100%' }}
                      >
                        View Reviews & Details
                      </button>
                      <button 
                        className="btn-ghost btn-small"
                        onClick={() => setShowCreateAlert(spot.name)}
                        style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <BellIcon size={14} />
                        Set Alert
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}

        {/* Stats overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'white',
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Today</div>
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '22px' }}>
            {signals.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length} signals
          </div>
        </div>

        {/* Floating Legend - Mobile only */}
        <div className="floating-legend">
          {Object.entries(conditionColors).map(([name, color]) => (
            <div key={name} className="legend-item">
              <div className="legend-dot" style={{ background: color }} />
              <span>{name}</span>
            </div>
          ))}
        </div>

        {/* Tide Toggle Button */}
        {!showTide && (
          <button 
            className="tide-toggle"
            onClick={() => setShowTide(true)}
          >
            <WaveIcon size={18} color="var(--seafoam)" />
            <span>Marés</span>
          </button>
        )}

        {/* Tide Panel */}
        {showTide && (
          <div className="map-tide-panel">
            <TideChart lat={mapCenter.lat} lng={mapCenter.lng} />
            <button 
              onClick={() => setShowTide(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        )}
      {/* Spot Detail Modal */}
      {showSpotDetail && (
        <SpotDetail 
          spotName={showSpotDetail}
          onClose={() => setShowSpotDetail(null)}
        />
      )}

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <CreateAlertModal
          spotName={showCreateAlert}
          onClose={() => setShowCreateAlert(null)}
          onSuccess={() => {
            // Could show a toast here
          }}
        />
      )}

      {/* FAB Signal Button */}
      {crews.length > 0 && (
        <button 
          className="fab-signal"
          onClick={() => setShowCheckIn(true)}
          title="Send Signal"
        >
          <PinIcon size={24} color="#F4F1E8" />
        </button>
      )}

      {/* Check-In Modal */}
      {showCheckIn && (
        <CheckInModal 
          crews={crews}
          spots={spots}
          onClose={() => setShowCheckIn(false)}
          onSuccess={(newSignal) => {
            setShowCheckIn(false)
            setSignals(prev => [newSignal, ...prev])
          }}
          userId={user?.id}
          addNotification={addNotification}
        />
      )}
    </Layout>
  )
}
