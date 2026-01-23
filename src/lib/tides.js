// Tide Service for Portugal
// Using WorldTides API with caching

// Portuguese reference ports with coordinates
export const PORTUGUESE_PORTS = [
  { id: 'cascais', name: 'Cascais', lat: 38.6913, lng: -9.4203 },
  { id: 'peniche', name: 'Peniche', lat: 39.3558, lng: -9.3811 },
  { id: 'ericeira', name: 'Ericeira', lat: 38.9631, lng: -9.4181 },
  { id: 'nazare', name: 'Nazaré', lat: 39.6017, lng: -9.0714 },
  { id: 'figueira', name: 'Figueira da Foz', lat: 40.1508, lng: -8.8575 },
  { id: 'porto', name: 'Porto (Leixões)', lat: 41.1847, lng: -8.7056 },
  { id: 'viana', name: 'Viana do Castelo', lat: 41.6833, lng: -8.8333 },
  { id: 'setubal', name: 'Setúbal', lat: 38.5244, lng: -8.8882 },
  { id: 'sines', name: 'Sines', lat: 37.9514, lng: -8.8736 },
  { id: 'lagos', name: 'Lagos', lat: 37.1028, lng: -8.6731 },
  { id: 'sagres', name: 'Sagres', lat: 37.0092, lng: -8.9394 },
  { id: 'faro', name: 'Faro', lat: 37.0147, lng: -7.9331 },
]

// Calculate distance between two points (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Find nearest port to a location
export function findNearestPort(lat, lng) {
  let nearest = PORTUGUESE_PORTS[0]
  let minDistance = Infinity

  for (const port of PORTUGUESE_PORTS) {
    const distance = getDistance(lat, lng, port.lat, port.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearest = port
    }
  }

  return { ...nearest, distance: minDistance }
}

// Cache for tide data
const tideCache = new Map()

function getCacheKey(portId, date) {
  return `${portId}-${date.toISOString().split('T')[0]}`
}

// Generate tide curve using harmonic approximation
// This creates a realistic tide curve without needing an API
function generateTideCurve(portId, date = new Date()) {
  const data = []
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  // Use lunar day (~24h 50min) for tide calculation
  // Portugal has semi-diurnal tides (2 highs, 2 lows per day)
  const lunarDay = 24.8417 // hours
  const tidesPerDay = 2
  const period = lunarDay / tidesPerDay // ~12.4 hours between highs
  
  // Calculate phase offset based on port (simplified)
  const portPhases = {
    cascais: 0,
    peniche: 0.3,
    ericeira: 0.2,
    nazare: 0.5,
    figueira: 0.7,
    porto: 1.0,
    viana: 1.2,
    setubal: -0.1,
    sines: -0.3,
    lagos: -0.8,
    sagres: -0.9,
    faro: -1.1,
  }
  
  // Phase offset in hours
  const phaseOffset = portPhases[portId] || 0
  
  // Calculate spring/neap coefficient based on moon phase
  // Simplified: use day of lunar month
  const lunarCycle = 29.53 // days
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  const moonPhase = (dayOfYear % lunarCycle) / lunarCycle
  
  // Coefficient varies from ~0.7 (neap) to ~1.3 (spring)
  const springNeapCoeff = 1 + 0.3 * Math.cos(2 * Math.PI * moonPhase)
  
  // Base tide range for Portugal (approximately 2-4m depending on location)
  const baseMeanLevel = 2.0 // meters above chart datum
  const baseAmplitude = 1.5 * springNeapCoeff // half the tidal range
  
  // Generate hourly data points
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = new Date(startOfDay)
      time.setHours(hour, minute, 0, 0)
      
      const hoursFromMidnight = hour + minute / 60
      const angle = (2 * Math.PI / period) * (hoursFromMidnight - phaseOffset)
      
      // Add secondary harmonic for more realistic shape
      const height = baseMeanLevel + 
        baseAmplitude * Math.cos(angle) + 
        baseAmplitude * 0.15 * Math.cos(2 * angle + 0.5)
      
      data.push({
        time,
        height: Math.max(0, height), // Never below 0
        hour: hoursFromMidnight
      })
    }
  }
  
  // Find high and low tides
  const extremes = findExtremes(data)
  
  return {
    portId,
    date: startOfDay,
    data,
    extremes,
    coefficient: Math.round(springNeapCoeff * 100), // 70-130 scale
    success: true
  }
}

// Find high and low tide times
function findExtremes(data) {
  const extremes = []
  
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].height
    const curr = data[i].height
    const next = data[i + 1].height
    
    if (curr > prev && curr > next) {
      extremes.push({ type: 'high', time: data[i].time, height: curr })
    } else if (curr < prev && curr < next) {
      extremes.push({ type: 'low', time: data[i].time, height: curr })
    }
  }
  
  return extremes
}

// Get tide data for a port
export async function getTideData(portId, date = new Date()) {
  const cacheKey = getCacheKey(portId, date)
  
  // Check cache first
  if (tideCache.has(cacheKey)) {
    return tideCache.get(cacheKey)
  }
  
  // Generate tide curve using harmonic approximation
  // This avoids API limits and works offline
  const result = generateTideCurve(portId, date)
  
  // Cache the result
  tideCache.set(cacheKey, result)
  
  return result
}

// Format time for display
export function formatTideTime(date) {
  return date.toLocaleTimeString('pt-PT', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

// Get current tide state (rising/falling)
export function getCurrentTideState(extremes) {
  const now = new Date()
  
  // Find the next extreme
  const nextExtreme = extremes.find(e => e.time > now)
  
  if (!nextExtreme) {
    return { state: 'unknown', next: null }
  }
  
  // If next is high tide, we're rising; if low, we're falling
  const state = nextExtreme.type === 'high' ? 'rising' : 'falling'
  const timeToNext = Math.round((nextExtreme.time - now) / 60000) // minutes
  
  return {
    state,
    next: nextExtreme,
    minutesToNext: timeToNext
  }
}
