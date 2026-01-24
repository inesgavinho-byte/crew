import { Link, useLocation } from 'react-router-dom'
import { WaveIcon, CrewsIcon, MapIcon, MessageIcon, MarketIcon, UserIcon } from './Icons'

export default function MobileNav({ unreadMessages = 0, profile }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-content">
        <Link
          to="/"
          className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <WaveIcon size={24} />
          <span>Feed</span>
        </Link>

        <Link
          to="/crews"
          className={`mobile-nav-item ${isActive('/crews') ? 'active' : ''}`}
        >
          <CrewsIcon size={24} />
          <span>Crews</span>
        </Link>

        <Link
          to="/map"
          className={`mobile-nav-item ${isActive('/map') ? 'active' : ''}`}
        >
          <MapIcon size={24} />
          <span>Map</span>
        </Link>

        <Link
          to="/messages"
          className={`mobile-nav-item ${isActive('/messages') ? 'active' : ''}`}
        >
          <MessageIcon size={24} />
          <span>Messages</span>
          {unreadMessages > 0 && (
            <span className="mobile-nav-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
          )}
        </Link>

        <Link
          to="/market"
          className={`mobile-nav-item ${isActive('/market') ? 'active' : ''}`}
        >
          <MarketIcon size={24} />
          <span>Market</span>
        </Link>

        <Link
          to="/profile"
          className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
        >
          <UserIcon size={24} />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  )
}
