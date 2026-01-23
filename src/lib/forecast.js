// Surf Forecast Service using Open-Meteo Marine API (free, no key needed)

const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine'
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'

// Fetch marine forecast for a location
export async function getForecast(lat, lng) {
  try {
    // Fetch both marine and weather data in parallel
    const [marineRes, weatherRes] = await Promise.all([
      fetch(`${MARINE_API}?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction&timezone=Europe/Lisbon&forecast_days=3`),
      fetch(`${WEATHER_API}?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wind_direction_10m,temperature_2m&timezone=Europe/Lisbon&forecast_days=3`)
    ])

    const marine = await marineRes.json()
    const weather = await weatherRes.json()

    return {
      success: true,
      marine,
      weather,
      processed: processForcast(marine, weather)
    }
  } catch (error) {
    console.error('Forecast error:', error)
    return { success: false, error: error.message }
  }
}

// Process raw data into usable format
function processForcast(marine, weather) {
  const now = new Date()
  const hourly = []

  // Get next 24 hours of data
  for (let i = 0; i < 24; i++) {
    const time = marine.hourly?.time?.[i]
    if (!time) continue

    const date = new Date(time)
    // Only include future hours
    if (date < now) continue

    hourly.push({
      time: date,
      hour: date.getHours(),
      waveHeight: marine.hourly?.wave_height?.[i] || 0,
      waveDirection: marine.hourly?.wave_direction?.[i] || 0,
      wavePeriod: marine.hourly?.wave_period?.[i] || 0,
      swellHeight: marine.hourly?.swell_wave_height?.[i] || 0,
      swellPeriod: marine.hourly?.swell_wave_period?.[i] || 0,
      swellDirection: marine.hourly?.swell_wave_direction?.[i] || 0,
      windSpeed: weather.hourly?.wind_speed_10m?.[i] || 0,
      windDirection: weather.hourly?.wind_direction_10m?.[i] || 0,
      temperature: weather.hourly?.temperature_2m?.[i] || 0
    })
  }

  // Get daily summary
  const daily = getDailySummary(marine, weather)

  return { hourly, daily }
}

function getDailySummary(marine, weather) {
  const days = []
  const hoursPerDay = 24

  for (let d = 0; d < 3; d++) {
    const startIdx = d * hoursPerDay
    const dayHours = marine.hourly?.wave_height?.slice(startIdx, startIdx + hoursPerDay) || []
    
    if (dayHours.length === 0) continue

    const date = new Date(marine.hourly?.time?.[startIdx])
    
    // Find max wave height for the day
    const maxWave = Math.max(...dayHours.filter(h => h !== null))
    const avgWave = dayHours.reduce((a, b) => a + (b || 0), 0) / dayHours.length

    // Get wind data
    const windHours = weather.hourly?.wind_speed_10m?.slice(startIdx, startIdx + hoursPerDay) || []
    const avgWind = windHours.reduce((a, b) => a + (b || 0), 0) / windHours.length

    // Get swell data
    const swellHours = marine.hourly?.swell_wave_height?.slice(startIdx, startIdx + hoursPerDay) || []
    const avgSwell = swellHours.reduce((a, b) => a + (b || 0), 0) / swellHours.length
    const swellPeriod = marine.hourly?.swell_wave_period?.slice(startIdx, startIdx + hoursPerDay) || []
    const avgPeriod = swellPeriod.reduce((a, b) => a + (b || 0), 0) / swellPeriod.length

    days.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      maxWave: maxWave.toFixed(1),
      avgWave: avgWave.toFixed(1),
      avgWind: avgWind.toFixed(0),
      avgSwell: avgSwell.toFixed(1),
      avgPeriod: avgPeriod.toFixed(0),
      rating: calculateRating(maxWave, avgWind, avgPeriod)
    })
  }

  return days
}

// Calculate surf rating based on conditions
function calculateRating(waveHeight, windSpeed, period) {
  let score = 0

  // Wave height scoring (0.5m - 2.5m is ideal)
  if (waveHeight >= 0.5 && waveHeight <= 1) score += 2
  else if (waveHeight > 1 && waveHeight <= 2) score += 3
  else if (waveHeight > 2 && waveHeight <= 2.5) score += 2
  else if (waveHeight > 2.5) score += 1

  // Wind scoring (lower is better)
  if (windSpeed < 10) score += 3
  else if (windSpeed < 15) score += 2
  else if (windSpeed < 20) score += 1

  // Period scoring (longer is better)
  if (period >= 12) score += 3
  else if (period >= 8) score += 2
  else if (period >= 5) score += 1

  // Convert to 1-5 rating
  if (score >= 8) return 5
  if (score >= 6) return 4
  if (score >= 4) return 3
  if (score >= 2) return 2
  return 1
}

// Convert degrees to cardinal direction
export function degreesToDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

// Get emoji for rating
export function getRatingEmoji(rating) {
  switch (rating) {
    case 5: return '🔥'
    case 4: return '🤙'
    case 3: return '👌'
    case 2: return '😐'
    default: return '☕'
  }
}

// Convert meters to feet
export function metersToFeet(meters) {
  return (meters * 3.28084).toFixed(1)
}
