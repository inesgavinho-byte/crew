import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext({})

// Notification Icons
const SignalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 19 C6 14 10 10 12 6 C14 10 18 14 20 19"/>
    <path d="M2 19 L22 19"/>
  </svg>
)

const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 12 L11 15 L16 9"/>
  </svg>
)

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M15 9 L9 15"/>
    <path d="M9 9 L15 15"/>
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16 L12 12"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  </svg>
)

const AchievementIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 4 L6 10 C6 13 9 16 12 16 C15 16 18 13 18 10 L18 4"/>
    <path d="M6 6 C4 6 3 7 3 9 C3 11 4 12 6 12"/>
    <path d="M18 6 C20 6 21 7 21 9 C21 11 20 12 18 12"/>
    <path d="M12 16 L12 19"/>
    <path d="M8 22 L16 22 L15 19 L9 19 Z"/>
  </svg>
)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep last 50
    setUnreadCount(prev => prev + 1)

    // Auto-dismiss toast after 5 seconds
    if (notification.toast !== false) {
      setTimeout(() => {
        dismissToast(id)
      }, 5000)
    }

    // Browser notification if permitted
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(notification.title || 'CREW', {
        body: notification.message,
        icon: '/favicon.svg'
      })
    }

    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      dismissToast,
      markAllRead,
      clearAll,
      requestPermission
    }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {notifications
          .filter(n => !n.dismissed && !n.read)
          .slice(0, 3)
          .map(notification => (
            <Toast 
              key={notification.id} 
              notification={notification}
              onDismiss={() => dismissToast(notification.id)}
            />
          ))
        }
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

// Get icon based on notification type
function getNotificationIcon(type) {
  switch(type) {
    case 'signal': return <SignalIcon />
    case 'success': return <SuccessIcon />
    case 'achievement': return <AchievementIcon />
    case 'error': return <ErrorIcon />
    default: return <InfoIcon />
  }
}

// Toast Component
function Toast({ notification, onDismiss }) {
  return (
    <div className={`toast toast-${notification.type || 'info'}`}>
      <div className="toast-icon">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="toast-content">
        <div className="toast-text">
          {notification.title && <strong className="toast-title">{notification.title}</strong>}
          <span className="toast-message">{notification.message}</span>
        </div>
      </div>
      <button className="toast-close" onClick={onDismiss}>×</button>
    </div>
  )
}
