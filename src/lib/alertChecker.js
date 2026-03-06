import { getActiveAlerts, markAlertTriggered } from './supabase'
import { getForecast, degreesToDirection } from './forecast'

// Spot coordinates for forecast lookup
const SPOT_COORDS = {
  'Coxos': { lat: 38.9833, lon: -9.4167 },
  'Ribeira d\'Ilhas': { lat: 38.9875, lon: -9.4208 },
  'Foz do Lizandro': { lat: 38.9417, lon: -9.4167 },
  'São Lourenço': { lat: 38.9583, lon: -9.4167 },
  'Praia Grande': { lat: 38.8167, lon: -9.4833 },
  'Guincho': { lat: 38.7333, lon: -9.4833 },
  'Costa da Caparica': { lat: 38.6333, lon: -9.2333 },
  'Carcavelos': { lat: 38.6833, lon: -9.3333 },
  'Supertubos': { lat: 39.35, lon: -9.3667 },
  'Baleal': { lat: 39.3833, lon: -9.35 },
  'Peniche': { lat: 39.3667, lon: -9.3833 },
  'Ericeira': { lat: 38.9667, lon: -9.4167 },
  'Nazaré': { lat: 39.6, lon: -9.0667 }
}

// Default coords if spot not found
const DEFAULT_COORDS = { lat: 38.9667, lon: -9.4167 } // Ericeira

// Check if wind is offshore based on direction and spot
// Simplified: West coast of Portugal, offshore is generally E/NE
const isOffshore = (windDirection) => {
  const offshoreDirections = ['E', 'ENE', 'NE', 'ESE']
  return offshoreDirections.includes(windDirection)
}

// Check if a single alert matches current conditions
const checkAlertConditions = (alert, forecast) => {
  if (!forecast) return false

  const {
    waveHeight,
    windSpeed,
    windDirection,
    swellDirection
  } = forecast

  // Check wave min
  if (alert.wave_min !== null && waveHeight < alert.wave_min) {
    return false
  }

  // Check wave max
  if (alert.wave_max !== null && waveHeight > alert.wave_max) {
    return false
  }

  // Check wind max
  if (alert.wind_max !== null && windSpeed > alert.wind_max) {
    return false
  }

  // Check wind direction (offshore)
  if (alert.wind_direction === 'offshore' && !isOffshore(windDirection)) {
    return false
  }

  // Check swell direction
  if (alert.swell_direction) {
    // Allow some tolerance (adjacent directions)
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const alertIdx = directions.indexOf(alert.swell_direction)
    const actualIdx = directions.indexOf(swellDirection)
    
    if (alertIdx === -1 || actualIdx === -1) {
      return false
    }
    
    // Allow exact match or adjacent direction
    const diff = Math.abs(alertIdx - actualIdx)
    if (diff > 1 && diff < 7) {
      return false
    }
  }

  return true
}

// Get forecast data for a spot
const getSpotForecast = async (spotName) => {
  const coords = SPOT_COORDS[spotName] || DEFAULT_COORDS
  const result = await getForecast(coords.lat, coords.lon)

  if (!result || !result.success || !result.processed) return null

  // Use the first available hourly entry (current/next hour conditions)
  const current = result.processed.hourly?.[0]
  if (!current) return null

  return {
    waveHeight: current.waveHeight,
    windSpeed: current.windSpeed,
    windDirection: degreesToDirection(current.windDirection),
    swellDirection: degreesToDirection(current.swellDirection),
    raw: result
  }
}

// Main function to check all user alerts
export const checkUserAlerts = async (userId, addNotification) => {
  try {
    // Get active alerts
    const { data: alerts } = await getActiveAlerts(userId)
    
    if (!alerts || alerts.length === 0) {
      return { checked: 0, triggered: 0, results: [] }
    }

    const results = []
    const spotForecasts = {} // Cache forecasts by spot
    
    for (const alert of alerts) {
      // Get forecast (cached)
      if (!spotForecasts[alert.spot_name]) {
        spotForecasts[alert.spot_name] = await getSpotForecast(alert.spot_name)
      }
      
      const forecast = spotForecasts[alert.spot_name]
      
      if (!forecast) {
        results.push({ alert, matched: false, error: 'No forecast data' })
        continue
      }

      const matched = checkAlertConditions(alert, forecast)
      
      results.push({
        alert,
        matched,
        forecast
      })

      if (matched) {
        // Mark as triggered
        await markAlertTriggered(alert.id)
        
        // Build notification message
        const conditions = []
        if (forecast.waveHeight) conditions.push(`${forecast.waveHeight}m waves`)
        if (forecast.windSpeed) conditions.push(`${Math.round(forecast.windSpeed)}km/h wind`)
        if (forecast.swellDirection) conditions.push(`${forecast.swellDirection} swell`)
        
        // Send notification
        if (addNotification) {
          addNotification({
            type: 'signal',
            title: `🔔 ${alert.spot_name} is ON!`,
            message: conditions.join(' • ')
          })
        }

        // Try push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🏄 ${alert.spot_name} Alert!`, {
              body: `Conditions match: ${conditions.join(', ')}`,
              icon: '/favicon.svg',
              tag: `alert-${alert.id}`
            })
          } catch (e) {
            console.log('Push notification failed:', e)
          }
        }
      }
    }

    const triggered = results.filter(r => r.matched).length
    
    return {
      checked: alerts.length,
      triggered,
      results
    }
  } catch (err) {
    console.error('Error checking alerts:', err)
    return { checked: 0, triggered: 0, error: err.message }
  }
}

// Format alert conditions for display
export const formatAlertConditions = (alert) => {
  const parts = []
  
  if (alert.wave_min && alert.wave_max) {
    parts.push(`${alert.wave_min}-${alert.wave_max}m`)
  } else if (alert.wave_min) {
    parts.push(`≥${alert.wave_min}m`)
  } else if (alert.wave_max) {
    parts.push(`≤${alert.wave_max}m`)
  }
  
  if (alert.wind_max) {
    parts.push(`wind ≤${alert.wind_max}km/h`)
  }
  
  if (alert.wind_direction === 'offshore') {
    parts.push('offshore')
  }
  
  if (alert.swell_direction) {
    parts.push(`${alert.swell_direction} swell`)
  }
  
  return parts.join(' • ')
}
