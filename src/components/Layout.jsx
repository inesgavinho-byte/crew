import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { FinLogo, WaveIcon, CrewsIcon, MapIcon, MarketIcon, MessageIcon } from './Icons'

export default function Layout({ children, rightSidebar, sidebarExtra, unreadMsgCount, mainStyle, mainClassName }) {
  const location = useLocation()
  const { profile, signOut } = useAuth()

  const navItems = [
    { path: '/', label: 'Feed', icon: WaveIcon },
    { path: '/crews', label: 'Crews', icon: CrewsIcon, matchPaths: ['/crews'] },
    { path: '/map', label: 'Map', icon: MapIcon },
    { path: '/messages', label: 'Messages', icon: MessageIcon },
    { path: '/market', label: 'Market', icon: MarketIcon },
  ]

  const isActive = (item) => {
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p))
    }
    return location.pathname === item.path
  }

  return (
    <div className="app">
      <aside className="sidebar-left">
        <div className="logo">
          <FinLogo size={36} color="#F5F0E6" waveColor="#5B8A72" />
          <div>
            <div className="logo-title">CREW</div>
            <div className="logo-tagline">no time / no territory</div>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {item.label}
              {item.label === 'Messages' && unreadMsgCount > 0 && (
                <span className="nav-badge">{unreadMsgCount}</span>
              )}
            </Link>
          ))}
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <span className="nav-avatar">{profile?.username?.charAt(0).toUpperCase() || 'U'}</span>
            Profile
          </Link>
        </nav>

        <div className="nav-spacer" />

        {sidebarExtra}

        <div className="nav-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="avatar">{profile?.username?.charAt(0).toUpperCase()}</div>
            <span style={{ color: '#fff', fontSize: '14px' }}>{profile?.username}</span>
          </div>
          <button
            onClick={signOut}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className={mainClassName || "main-content"} style={mainStyle}>
        {children}
      </main>

      {rightSidebar && (
        <aside className="sidebar-right">
          {rightSidebar}
        </aside>
      )}
    </div>
  )
}
