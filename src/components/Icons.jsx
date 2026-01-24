// Fin Mark Logo
export const FinLogo = ({ size = 40, color = '#1C3D5A', waveColor = '#5B8A72' }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 40 50">
    <path d={`M20 3 Q10 13 12 35 Q14 45 20 48 Q26 45 28 35 Q30 13 20 3`} fill={color}/>
    <path d="M15 28 Q17.5 25 20 28 Q22.5 31 25 28" fill="none" stroke={waveColor} strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 34 Q18 30 22 34 Q26 38 30 34" fill="none" stroke={waveColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
)

// Wave icon - hand-drawn style
export const WaveIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M2 13 C4 9 7 11 9 9 C11 7 13 10 15 8 C17 6 20 9 22 7" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 18 C5 15 8 17 11 15 C14 13 17 16 22 13" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
)

// Crews icon (three circles) - more organic
export const CrewsIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="8" cy="9" r="3.5" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="16" cy="9" r="3.5" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M4 20 C4 16 6 14 8 14 C10 14 11 15 12 15 C13 15 14 14 16 14 C18 14 20 16 20 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Pin/Location icon - hand-drawn
export const PinIcon = ({ size = 24, color = '#A65D3F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2 C7.5 2 4 5.5 4 10 C4 16 12 22 12 22 C12 22 20 16 20 10 C20 5.5 16.5 2 12 2" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="2.5" fill="none" stroke={color} strokeWidth="2"/>
  </svg>
)

// CONDITION ICONS - Hand-drawn style

// Glassy - perfect glass, smooth lines
export const GlassyIcon = ({ size = 20, color = '#5B8A72' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M3 12 C7 11 11 11 15 12 C19 13 21 12 21 12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M5 16 C9 15 13 15 17 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <circle cx="18" cy="6" r="2" fill={color} opacity="0.8"/>
  </svg>
)

// Clean - nice waves
export const CleanIcon = ({ size = 20, color = '#1C3D5A' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M2 10 C4 7 6 9 8 7 C10 5 12 8 14 6 C16 4 18 7 20 5 C22 3 22 6 22 6" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M2 16 C6 13 10 15 14 13 C18 11 22 14 22 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
)

// Choppy - messy waves
export const ChoppyIcon = ({ size = 20, color = '#D4A574' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M2 8 L5 12 L8 7 L11 13 L14 6 L17 11 L20 8 L22 10" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 17 L7 14 L10 18 L13 15 L16 17 L19 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
)

// Blown - wind lines
export const BlownIcon = ({ size = 20, color = '#8B7355' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M3 8 C8 8 10 6 14 8 C16 9 17 7 18 8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 12 C10 12 12 10 16 12 C18 13 20 11 21 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 16 C7 16 9 14 12 16 C14 17 16 15 17 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Flat - calm water
export const FlatIcon = ({ size = 20, color = '#8B7355' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M3 12 L21 12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M5 16 L19 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M7 8 L17 8" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
  </svg>
)

// Signal/Check-in icon - hand-drawn
export const SignalIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.5"/>
    <path d="M8 12 C9 10 11 11 12 10 C13 9 15 11 16 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Wind icon - hand-drawn
export const WindIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <path d="M2 6 C5 6 7 4 9 6 C10 7 10 5 11 6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 10 C4 10 6 8 8 10 C9 11 10 9 11 10" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Arrow right - hand-drawn
export const ArrowIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <path d="M6 4 C8 6 10 8 12 10 C10 12 8 14 6 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Plus icon - hand-drawn
export const PlusIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 5 L12 19" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M5 12 L19 12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

// Header wave decoration
export const HeaderWave = () => (
  <svg className="header-wave" viewBox="0 0 400 20" preserveAspectRatio="none">
    <path d="M0 15 Q50 5 100 15 Q150 25 200 15 Q250 5 300 15 Q350 25 400 15" fill="none" stroke="#5B8A72" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Nav wave decoration
export const NavWave = () => (
  <svg width="100%" height="12" viewBox="0 0 400 12" preserveAspectRatio="none" style={{ padding: '0 20px' }}>
    <path d="M0 8 Q50 2 100 8 Q150 14 200 8 Q250 2 300 8 Q350 14 400 8" fill="none" stroke="#5B8A72" strokeWidth="2"/>
  </svg>
)

// Modal wave decoration
export const ModalWave = () => (
  <svg width="100%" height="15" viewBox="0 0 300 15" style={{ marginBottom: '20px' }}>
    <path d="M0 10 Q37 4 75 10 Q112 16 150 10 Q187 4 225 10 Q262 16 300 10" fill="none" stroke="#5B8A72" strokeWidth="2"/>
  </svg>
)

// Map icon
export const MapIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)

// Camera icon
export const CameraIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

// Edit icon
export const EditIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

// User icon
export const UserIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)

// Bell/Notification icon
export const BellIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

export const ChatIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
  </svg>
)

export const MessageIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

export const MarketIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M3 9 L12 2 L21 9"/>
    <path d="M4 9 L4 20 L20 20 L20 9"/>
    <path d="M9 20 L9 14 L15 14 L15 20"/>
  </svg>
)

export const SearchIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
)

export const StarIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15,8.5 22,9.5 17,14.5 18,21.5 12,18 6,21.5 7,14.5 2,9.5 9,8.5"/>
  </svg>
)

// Crew Type Icons - Hand-drawn style

// Surfboard icon
export const SurfboardIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2 C8 4 6 10 6 14 C6 18 8 21 12 22 C16 21 18 18 18 14 C18 10 16 4 12 2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8 L12 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
)

// Bodyboard icon
export const BodyboardIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="6" y="4" width="12" height="16" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M9 10 L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// SUP icon
export const SupIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2 C7 5 5 12 5 16 C5 19 7 22 12 22 C17 22 19 19 19 16 C19 12 17 5 12 2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="2" fill="none" stroke={color} strokeWidth="1.5"/>
  </svg>
)

// Kite icon
export const KiteIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2 C8 6 6 10 8 14 C10 18 14 18 16 14 C18 10 16 6 12 2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 14 L8 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 14 L16 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Skateboard icon
export const SkateIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 12 C4 10 6 10 8 10 L16 10 C18 10 20 10 20 12 C20 14 18 14 16 14 L8 14 C6 14 4 14 4 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="7" cy="16" r="2" fill="none" stroke={color} strokeWidth="1.5"/>
    <circle cx="17" cy="16" r="2" fill="none" stroke={color} strokeWidth="1.5"/>
  </svg>
)

// Bike icon
export const BikeIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="6" cy="16" r="3" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="18" cy="16" r="3" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M6 16 L10 8 L14 8 L18 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8 L12 16 L14 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Run icon
export const RunIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="14" cy="5" r="2.5" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M10 22 L12 14 L16 14 L14 22" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 14 L12 10 L16 12 L20 8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Generic crew/group icon
export const TribeIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="3" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="6" cy="14" r="2.5" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="18" cy="14" r="2.5" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M4 21 C4 18 5 17 6 17 C7 17 8 18 8 19" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 19 C16 18 17 17 18 17 C19 17 20 18 20 21" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 21 C9 18 10 16 12 16 C14 16 15 18 15 21" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Stat Icons - Hand-drawn style

// Streak/Fire icon
export const StreakIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2 C8 6 6 10 8 14 C9 16 10 17 10 18 C10 20 8 21 8 21 C10 21 12 20 13 18 C14 16 13 14 14 12 C15 10 18 8 18 8 C16 10 16 12 16 14 C16 16 15 18 12 22 C12 22 20 18 20 12 C20 6 12 2 12 2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Sunrise/Dawn icon
export const DawnIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2 L12 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 12 L7 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 12 L20 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M5.5 5.5 L7.5 7.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16.5 7.5 L18.5 5.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 18 C4 14 8 11 12 11 C16 11 20 14 20 18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M2 18 L22 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Compass/Explore icon
export const ExploreIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M16 8 L10 10 L8 16 L14 14 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
  </svg>
)

// Crystal ball/Prediction icon
export const PredictIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="10" r="7" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M8 19 C8 17 10 16 12 16 C14 16 16 17 16 19 L17 21 L7 21 Z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 8 C10 7 11 8 12 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
)

// Trophy icon
export const TrophyIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M6 4 L6 10 C6 13 9 16 12 16 C15 16 18 13 18 10 L18 4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 6 C4 6 3 7 3 9 C3 11 4 12 6 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 6 C20 6 21 7 21 9 C21 11 20 12 18 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 16 L12 19" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 22 L16 22 L15 19 L9 19 Z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

// Stats/Chart icon
export const StatsIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 20 L4 14" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <path d="M10 20 L10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <path d="M16 20 L16 6" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <path d="M22 20 L22 2" stroke={color} strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

// Lock icon
export const LockIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M8 11 L8 7 C8 4 10 2 12 2 C14 2 16 4 16 7 L16 11" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill={color}/>
  </svg>
)

// Rating dots component - shows quality 1-5
export const RatingDots = ({ rating = 3, size = 16 }) => {
  const dots = []
  const activeColor = rating >= 4 ? 'var(--seafoam)' : rating >= 3 ? 'var(--sun-bleached)' : 'var(--faded-coral)'
  
  for (let i = 1; i <= 5; i++) {
    dots.push(
      <circle
        key={i}
        cx={4 + (i - 1) * 8}
        cy={size / 2}
        r={3}
        fill={i <= rating ? activeColor : 'rgba(255,255,255,0.2)'}
      />
    )
  }
  
  return (
    <svg width={40} height={size} viewBox={`0 0 40 ${size}`}>
      {dots}
    </svg>
  )
}
