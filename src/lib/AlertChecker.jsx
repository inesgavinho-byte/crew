import { useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'
import { checkUserAlerts } from './alertChecker'

/**
 * Component that checks user alerts on login/app load
 * Place this inside both AuthProvider and NotificationProvider
 */
export function AlertChecker() {
  const { user, profile } = useAuth()
  const { addNotification, requestPermission } = useNotifications()
  const hasChecked = useRef(false)

  useEffect(() => {
    // Only check once per session when user is logged in
    if (user && profile && !hasChecked.current) {
      hasChecked.current = true
      
      // Small delay to let the app load
      const timer = setTimeout(async () => {
        // Request notification permission
        await requestPermission()
        
        // Check alerts
        const result = await checkUserAlerts(user.id, addNotification)
        
        if (result.triggered > 0) {
          console.log(`🔔 ${result.triggered} alert(s) triggered!`)
        }
      }, 2000) // 2 second delay

      return () => clearTimeout(timer)
    }
  }, [user, profile, addNotification, requestPermission])

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      hasChecked.current = false
    }
  }, [user])

  return null // This component doesn't render anything
}
