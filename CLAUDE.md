# CLAUDE.md - AI Assistant Guide for CREW Surf App

> **Last Updated**: 2026-01-23
> **Purpose**: This document provides comprehensive guidance for AI assistants working with the CREW codebase, including architecture, conventions, patterns, and workflows.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Directory Structure](#directory-structure)
4. [Key Conventions](#key-conventions)
5. [Development Workflows](#development-workflows)
6. [Common Patterns](#common-patterns)
7. [Database Schema](#database-schema)
8. [API Integration Patterns](#api-integration-patterns)
9. [Component Guidelines](#component-guidelines)
10. [Styling System](#styling-system)
11. [Testing & Debugging](#testing--debugging)
12. [Deployment](#deployment)

---

## Project Overview

**CREW** is a Progressive Web App (PWA) for surfers to organize crews, share surf conditions, coordinate sessions, and build a surf community. Think of it as a specialized social network for the surf tribe.

### Core Features

- **Crews Management**: Create/join surf crews with invite codes
- **Check-ins (Signals)**: Share real-time surf conditions at spots
- **Real-time Chat**: Crew chat and direct messages via Supabase Realtime
- **Surf Analytics**: Tide charts, wave forecasts, session logs
- **Social Features**: Follow system, feed, profiles
- **Marketplace**: Board buying/selling
- **Condition Alerts**: Get notified when conditions match preferences
- **PWA Features**: Offline support, install prompts, service worker

### Language & Localization

- **Primary Language**: Portuguese (pt-PT)
- **All UI text**: Portuguese
- **Code comments**: Portuguese
- **Date/time formatting**: European format with `toLocaleDateString('pt-PT')`

---

## Architecture & Tech Stack

### Frontend

```json
{
  "React": "18.2.0",
  "React Router": "6.20.0",
  "Vite": "5.0.0",
  "Leaflet": "1.9.4 (maps)",
  "React Leaflet": "4.2.1"
}
```

### Backend

- **Supabase**: PostgreSQL database, Authentication, Realtime, Storage
- **External APIs**:
  - Open-Meteo Marine API (wave forecasts, free)
  - Custom tide calculations (harmonic approximation)

### PWA

- **vite-plugin-pwa**: Service worker auto-generation
- **Manifest**: Defined in `vite.config.js`
- **Offline**: Banner detection, install prompts

### State Management

- **Context API**: Auth, Notifications (no Redux/Zustand)
- **Local State**: `useState` in components
- **Real-time**: Supabase subscriptions with `useEffect` cleanup

---

## Directory Structure

```
/home/user/crew/
├── public/                 # Static assets (icons, images)
├── src/
│   ├── components/         # 9 reusable UI components
│   │   ├── ChatSidebar.jsx
│   │   ├── CheckInModal.jsx
│   │   ├── CreateAlertModal.jsx
│   │   ├── Icons.jsx       # 40+ hand-drawn SVG icons
│   │   ├── InvitePanel.jsx
│   │   ├── LogSession.jsx
│   │   ├── PWA.jsx         # OfflineBanner, InstallPrompt
│   │   ├── SpotDetail.jsx
│   │   └── TideChart.jsx
│   │
│   ├── lib/                # Utilities and contexts
│   │   ├── AlertChecker.jsx      # Component: checks alerts on login
│   │   ├── alertChecker.js       # Logic: alert checking
│   │   ├── AuthContext.jsx       # Auth state provider
│   │   ├── forecast.js           # Open-Meteo API integration
│   │   ├── NotificationContext.jsx  # In-app notifications
│   │   ├── supabase.js           # Supabase client + 88 helpers
│   │   └── tides.js              # Tide calculations
│   │
│   ├── pages/              # 9 route pages
│   │   ├── Auth.jsx        # Login/signup
│   │   ├── CrewDetail.jsx  # Individual crew + chat
│   │   ├── Crews.jsx       # Crew list & management
│   │   ├── Feed.jsx        # Main signals feed (home)
│   │   ├── Join.jsx        # Join crew by code
│   │   ├── Map.jsx         # Leaflet spots map
│   │   ├── Market.jsx      # Board marketplace
│   │   ├── Messages.jsx    # Direct messages
│   │   └── Profile.jsx     # User profile & stats
│   │
│   ├── App.jsx             # Root: routes + context providers
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles (~1200 lines)
│
├── supabase/               # Database setup (run in order)
│   ├── step1-cleanup-safe.sql
│   ├── step2-tables.sql    # 13 table definitions
│   ├── step3-rls.sql       # Row Level Security policies
│   └── step4-functions.sql # PostgreSQL functions (RPC)
│
├── .env.example            # Template for env variables
├── vite.config.js          # Vite + PWA config
├── netlify.toml            # Netlify deployment config
├── package.json
└── index.html
```

---

## Key Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase, `.jsx` | `CheckInModal.jsx` |
| Pages | PascalCase, `.jsx` | `Feed.jsx` |
| Utilities | camelCase, `.js` | `supabase.js`, `forecast.js` |
| Contexts | PascalCase + "Context", `.jsx` | `AuthContext.jsx` |
| Styles | Global CSS in `index.css` | - |

### Component Structure

All components are **functional components** using hooks. No class components.

```jsx
// Standard component pattern
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue)
  const { user } = useAuth()

  useEffect(() => {
    // Side effects with cleanup
    const subscription = subscribeToData(callback)
    return () => unsubscribe(subscription)
  }, [dependencies])

  const handleAction = async () => {
    try {
      const { data, error } = await supabaseHelper()
      if (error) throw error
      setState(data)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return <div>...</div>
}
```

### Import Order

1. React and React libraries
2. Third-party libraries
3. Local components
4. Local utilities/contexts
5. Styles (if using CSS modules, but this project uses global CSS)

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer } from 'react-leaflet'
import ChatSidebar from '../components/ChatSidebar'
import { useAuth } from '../lib/AuthContext'
import { getSignalsFeed } from '../lib/supabase'
```

### Environment Variables

**Always use** `import.meta.env` (Vite convention, not `process.env`):

```javascript
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
```

Required variables in `.env`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:5173
```

---

## Development Workflows

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run SQL files in order in SQL Editor:
   - `step1-cleanup-safe.sql`
   - `step2-tables.sql`
   - `step3-rls.sql`
   - `step4-functions.sql`
3. Copy Project URL and anon key to `.env`
4. Enable Realtime on tables: `signals`, `chat_messages`, `crew_votes`, `direct_messages`

### Adding a New Feature

1. **Plan**: Identify required components, pages, database changes
2. **Database First**: Update Supabase schema if needed
3. **Helper Functions**: Add to `/src/lib/supabase.js` (keep all DB logic there)
4. **Components**: Build reusable UI in `/src/components/`
5. **Pages**: Integrate into pages in `/src/pages/`
6. **Routing**: Update `/src/App.jsx` if new route needed
7. **Styling**: Add CSS to `/src/index.css` following BEM-like naming
8. **Test**: Test in browser, check Realtime subscriptions cleanup

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/nome-da-feature

# Make changes, commit frequently
git add .
git commit -m "Descrição clara em português"

# Push to remote
git push -u origin feature/nome-da-feature

# Create PR via GitHub
```

---

## Common Patterns

### 1. Data Fetching Pattern

```javascript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

const loadData = async () => {
  setLoading(true)
  try {
    const { data, error } = await getDataFromSupabase()
    if (error) throw error
    if (data) setData(data)
  } catch (err) {
    console.error('Error:', err)
    addNotification({ type: 'error', message: err.message })
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  loadData()
}, [])

// Render
if (loading) return <div className="loading">Carregando...</div>
if (data.length === 0) return <div className="empty-state">Sem dados</div>
return data.map(item => <ItemCard key={item.id} {...item} />)
```

### 2. Real-time Subscription Pattern

```javascript
useEffect(() => {
  if (!crewId) return  // Guard clause

  const channel = supabase
    .channel(`chat:${crewId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `crew_id=eq.${crewId}`
    }, (payload) => {
      handleNewMessage(payload.new)
    })
    .subscribe()

  // CRITICAL: Always cleanup
  return () => supabase.removeChannel(channel)
}, [crewId])
```

### 3. Modal Component Pattern

```jsx
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Título</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  )
}
```

### 4. Protected Route Pattern

```jsx
// Already implemented in App.jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  if (!user) return <Navigate to="/auth" />
  return children
}

// Usage
<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />
```

### 5. Form Handling Pattern

```jsx
const [formData, setFormData] = useState({ name: '', description: '' })

const handleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }))
}

const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    const { error } = await createSomething(formData)
    if (error) throw error
    addNotification({ type: 'success', message: 'Criado com sucesso!' })
    onClose()
  } catch (err) {
    addNotification({ type: 'error', message: err.message })
  }
}
```

### 6. Time Formatting

```javascript
// Relative time (preferred for recent items)
const formatTimeAgo = (dateString) => {
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// Absolute time (for older items)
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

### 7. Three-Column Layout Pattern

Most pages follow this structure:

```jsx
<div className="app">
  {/* Left sidebar: Navigation */}
  <aside className="sidebar-left">
    <div className="sidebar-header">
      <h2>CREW</h2>
      <UserProfile />
    </div>
    <nav className="nav">
      <NavLink to="/">Feed</NavLink>
      <NavLink to="/crews">Crews</NavLink>
      {/* ... */}
    </nav>
  </aside>

  {/* Main content */}
  <main className="main-content">
    <div className="page-header">
      <h1>Page Title</h1>
    </div>
    {/* Page content */}
  </main>

  {/* Right sidebar: Contextual info */}
  <aside className="sidebar-right">
    <TideChart />
    <ChatSidebar />
    {/* ... */}
  </aside>
</div>
```

---

## Database Schema

### 13 Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | `id`, `username`, `full_name`, `avatar_url`, `bio`, `location` |
| `spots` | Surf spots | `name`, `lat`, `lng`, `type`, `difficulty`, `description` |
| `crews` | Crews | `name`, `emoji`, `description`, `sport`, `invite_code`, `is_public`, `created_by` |
| `crew_members` | Crew membership | `crew_id`, `user_id`, `role` (admin/member), `status` (active/pending) |
| `crew_invites` | Pending invites | `crew_id`, `invited_user_id`, `invited_by`, `status` |
| `signals` | Check-ins | `crew_id`, `user_id`, `spot_name`, `condition`, `size`, `wind`, `crowd`, `note` |
| `boards` | User boards | `user_id`, `name`, `brand`, `model`, `size`, `volume`, `type` |
| `sessions` | Session logs | `user_id`, `spot_name`, `session_date`, `duration`, `board_id`, `rating`, `notes` |
| `condition_alerts` | Alerts | `user_id`, `spot_name`, `wave_min`, `wave_max`, `wind_max`, `swell_direction`, `is_active` |
| `chat_messages` | Crew chat | `crew_id`, `user_id`, `type` (text/photo/poll), `content`, `photo_url`, `poll_question` |
| `conversations` | DM threads | `user1_id`, `user2_id`, `last_message_at` |
| `direct_messages` | DMs | `conversation_id`, `sender_id`, `content`, `read_at` |
| `board_listings` | Marketplace | `user_id`, `title`, `description`, `price`, `category`, `condition`, `status`, `images` |

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

- **profiles**: Public read, users update own
- **crews**: Members can read, admins can update
- **signals**: Crew members can read/insert
- **chat_messages**: Crew members can read/insert
- **direct_messages**: Conversation participants only

### Database Functions (RPC)

Located in `supabase/step4-functions.sql`:

```sql
-- Join crew by invite code
join_crew_by_code(p_invite_code, p_user_id, p_username)

-- Check if users share a crew
users_share_crew(user_a, user_b)

-- Get crew leaderboard
get_crew_leaderboard(p_crew_id, p_period)
```

---

## API Integration Patterns

### Supabase Helper Functions

**Location**: `/src/lib/supabase.js` (1311 lines, 88 functions)

**CRITICAL RULE**: Always use helper functions from `supabase.js`. Never write raw Supabase queries in components.

#### Organization by Domain

```javascript
// ============ AUTH (7 functions) ============
signUp(email, password, username)
signIn(email, password)
signOut()
getCurrentUser()
getProfile(userId)
updateProfile(userId, updates)

// ============ CREWS (11 functions) ============
getMyCrews()                    // Returns crews with nested crew data
createCrew(name, emoji, description, sport)
getCrewMembers(crewId)          // Uses crew_members_view
inviteToCrew(crewId, userId)
getCrewInviteCode(crewId)
regenerateInviteCode(crewId)
joinCrewByCode(inviteCode, userId, username)  // Uses RPC
searchUsers(query)
getPendingInvites(userId)
acceptInvite(inviteId, crewId, userId, username)
declineInvite(inviteId)

// ============ SIGNALS/CHECK-INS (4 functions) ============
getSignalsFeed(crewIds)         // Merges with profiles + crew data
getFollowingSignalsFeed(crewIds)  // Filtered by follows
createSignal(crewId, spotName, condition, size, wind, crowd, note)
subscribeToSignals(crewIds, callback)  // Real-time

// ============ CHAT (6 functions) ============
getChatMessages(crewId, limit)
sendChatMessage(crewId, userId, username, message)
sendPhotoMessage(crewId, userId, username, photoUrl, caption)
sendLocationMessage(crewId, userId, username, spotName)
sendPollMessage(crewId, userId, username, question)
subscribeToChatMessages(crewId, callback)  // Real-time

// ============ DIRECT MESSAGES (7 functions) ============
getOrCreateConversation(otherUserId)
getConversations()              // With unread counts
getMessages(conversationId)
sendDirectMessage(conversationId, content)
markMessagesAsRead(conversationId)
getUnreadCount()

// ============ MARKET (9 functions) ============
getListings(filters)
createListing(listing)
updateListing(listingId, updates)
deleteListing(listingId)
markListingAsSold(listingId)
expressInterest(listingId, userId, username, message)

// ============ SESSIONS & ALERTS (12 functions) ============
getUserSessions(userId, limit)
createSession(session)
updateSession(sessionId, updates)
deleteSession(sessionId)
getUserAlerts(userId)
createAlert(alert)
toggleAlert(alertId, isActive)
markAlertTriggered(alertId)

// ============ SOCIAL (13 functions) ============
requestFollow(followingId)
unfollow(followingId)
acceptFollowRequest(followerId)
declineFollowRequest(followerId)
getFollowers(userId)
getFollowing(userId)
getFollowStatus(targetUserId)
getFollowingIds()              // For feed filtering

// ============ STORAGE (2 functions) ============
uploadImage(file, folder)       // Returns public URL
deleteImage(url)
```

#### Usage Example

```javascript
// In a component
import { getSignalsFeed, createSignal } from '../lib/supabase'

const Feed = () => {
  const [signals, setSignals] = useState([])

  useEffect(() => {
    const loadSignals = async () => {
      const { data, error } = await getSignalsFeed(crewIds)
      if (data) setSignals(data)
    }
    loadSignals()
  }, [crewIds])

  const handleCheckIn = async (formData) => {
    const { error } = await createSignal(
      formData.crewId,
      formData.spotName,
      formData.condition,
      formData.size,
      formData.wind,
      formData.crowd,
      formData.note
    )
    if (!error) addNotification({ type: 'success', message: 'Check-in enviado!' })
  }
}
```

### External APIs

#### 1. Open-Meteo Marine API

**File**: `/src/lib/forecast.js`

```javascript
// Fetch wave forecast for coordinates
const getForecast = async (lat, lng) => {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_period,wave_direction,wind_wave_height&timezone=auto&forecast_days=3`
  const response = await fetch(url)
  return await response.json()
}
```

**Usage**: Map page, spot details, condition alerts

#### 2. Tide Calculations

**File**: `/src/lib/tides.js`

Uses harmonic approximation (no external API):

```javascript
// Calculate tide height at given time
const getTideHeight = (date, lat, lng) => {
  // Simplified harmonic calculation
  // Returns height in meters
}

// Get tide times for next 48 hours
const getTideTimes = (lat, lng, startDate) => {
  // Returns array of { time, type: 'high'|'low', height }
}
```

### Error Handling Best Practices

```javascript
try {
  const { data, error } = await supabaseFunction()

  // Supabase returns errors in response, not thrown
  if (error) throw error

  // Check for empty data
  if (!data || data.length === 0) {
    console.log('No data found')
    return
  }

  // Process data
  setData(data)

} catch (err) {
  console.error('Error:', err)

  // User-friendly notifications
  addNotification({
    type: 'error',
    message: err.message || 'Erro ao carregar dados'
  })
}
```

---

## Component Guidelines

### Icons Component

**File**: `/src/components/Icons.jsx`

40+ hand-drawn SVG icons in vintage surf style.

```jsx
// All icons accept: { size = 24, color = 'currentColor' }
import { WaveIcon, SurfboardIcon, CheckIcon } from '../components/Icons'

<WaveIcon size={32} color="#5B8A72" />
```

**Available Icons**: `WaveIcon`, `SurfboardIcon`, `CalendarIcon`, `MapPinIcon`, `UsersIcon`, `MessageIcon`, `BellIcon`, `SettingsIcon`, `WindIcon`, `TideIcon`, `SunIcon`, `MoonIcon`, `StarIcon`, `CheckIcon`, `XIcon`, `PlusIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `HeartIcon`, `ShareIcon`, `FilterIcon`, `SearchIcon`, `MenuIcon`, `LogoutIcon`, `CameraIcon`, `ImageIcon`, `LinkIcon`, `TrashIcon`, `EditIcon`, `SendIcon`, `BookmarkIcon`, and more.

### Notification System

**File**: `/src/lib/NotificationContext.jsx`

```jsx
const { addNotification, notifications, unreadCount, dismissToast } = useNotifications()

// Add notification
addNotification({
  type: 'signal',      // signal | success | error | info | achievement
  title: 'Nova sessão!',
  message: 'Gonçalo está em Carcavelos',
  toast: true,         // Show as toast (auto-dismiss 5s)
  data: { signalId }   // Optional metadata
})

// Types and their styles
// - signal: Green, for surf conditions
// - success: Blue, for completed actions
// - error: Red, for errors
// - info: Gray, for general info
// - achievement: Gold, for milestones
```

### AuthContext Usage

```jsx
const { user, profile, loading, signOut } = useAuth()

if (loading) return <div>Carregando...</div>
if (!user) return <Navigate to="/auth" />

// user: Supabase auth user { id, email, ... }
// profile: Custom profile from profiles table { username, full_name, ... }
```

### PWA Components

**File**: `/src/components/PWA.jsx`

```jsx
// Offline detection banner
<OfflineBanner />

// Install app prompt (shows once per 7 days)
<InstallPrompt />

// Both auto-included in App.jsx
```

---

## Styling System

**File**: `/src/index.css` (~1200 lines)

### CSS Variables

```css
:root {
  /* Colors - Vintage Surf Palette */
  --deep-ocean: #1C3D5A;      /* Primary dark blue */
  --navy: #2A4A5E;            /* Secondary blue */
  --seafoam: #5B8A72;         /* Primary green */
  --sage: #7A9B8A;            /* Light green */
  --sand: #E8DCC4;            /* Cream/beige */
  --wax: #F5F0E6;             /* Off-white */
  --rust: #A65D3F;            /* Accent orange */
  --sunset: #D4A574;          /* Light orange */

  /* Typography */
  --font-display: 'Permanent Marker', cursive;  /* Headings */
  --font-script: 'Caveat', cursive;             /* Handwritten */
  --font-condensed: 'Barlow Condensed', sans-serif;  /* Subheadings */
  --font-body: 'DM Sans', sans-serif;           /* Body text */

  /* Layout */
  --sidebar-width: 280px;
  --max-content-width: 700px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

### Typography Scale

```css
h1 {
  font-family: var(--font-display);
  font-size: 36px;
  line-height: 1.2;
}

h2 {
  font-family: var(--font-condensed);
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

h3 {
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 600;
}

body {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
}
```

### Component Classes (BEM-like)

```css
/* Card pattern */
.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-header { /* ... */ }
.card-content { /* ... */ }
.card-footer { /* ... */ }

/* Signal-specific cards */
.signal-card { /* ... */ }
.signal-header { /* ... */ }
.signal-new { /* Highlight new signals */ }
```

### Button System

```css
.btn {
  /* Base button styles */
  padding: 10px 20px;
  border-radius: 8px;
  font-family: var(--font-condensed);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--seafoam);
  color: white;
}

.btn-ghost {
  background: transparent;
  border: 2px solid var(--deep-ocean);
  color: var(--deep-ocean);
}

.btn-signal {
  background: linear-gradient(135deg, #5B8A72, #4A7B63);
  color: white;
}
```

### Badge System (Condition Colors)

```css
.badge-glassy { background: #5B8A72; color: white; }  /* Green - Perfect */
.badge-clean { background: #1C3D5A; color: white; }   /* Blue - Good */
.badge-choppy { background: #D4A574; color: white; }  /* Orange - Fair */
.badge-blown { background: #8B7355; color: white; }   /* Brown - Poor */
.badge-flat { background: #888; color: white; }       /* Gray - Flat */
```

### Responsive Breakpoints

```css
/* Desktop-first approach */

@media (max-width: 1024px) {
  /* Tablet: collapse right sidebar */
  .sidebar-right { display: none; }
}

@media (max-width: 768px) {
  /* Mobile: stack layout */
  .app {
    flex-direction: column;
  }

  .sidebar-left {
    width: 100%;
    position: fixed;
    bottom: 0;
    /* Bottom navigation bar */
  }
}
```

### Adding New Styles

1. **Check existing classes first** - Avoid duplicates
2. **Use CSS variables** for colors and spacing
3. **Follow BEM-like naming**: `.component-element--modifier`
4. **Group related styles** together with comments
5. **Mobile-friendly**: Test responsive behavior

```css
/* ============ NEW FEATURE ============ */

.feature-card {
  /* Base styles */
}

.feature-card-header {
  /* Element styles */
}

.feature-card--highlighted {
  /* Modifier styles */
}
```

---

## Testing & Debugging

### Browser Testing

```bash
npm run dev
# Test at http://localhost:5173
```

**Key Test Scenarios**:

1. **Authentication Flow**
   - Sign up new user
   - Sign in existing user
   - Sign out
   - Check session persistence (refresh page)

2. **Crew Management**
   - Create crew
   - Generate invite code
   - Join crew via code (incognito window)
   - Check voting system (if implemented)

3. **Real-time Features**
   - Open same crew chat in 2 tabs
   - Send message in tab 1
   - Verify instant update in tab 2
   - Close tab 2, verify subscription cleanup

4. **Check-ins (Signals)**
   - Create signal
   - Verify appears in feed
   - Check filtering by crew
   - Test condition badges

5. **Direct Messages**
   - Start conversation
   - Send messages
   - Check unread counts
   - Mark as read

### Debugging Real-time Issues

```javascript
// Check if subscription is active
useEffect(() => {
  console.log('Subscribing to:', crewId)

  const channel = supabase
    .channel(`chat:${crewId}`)
    .on('postgres_changes', config, (payload) => {
      console.log('Received:', payload)
      // Process...
    })
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  return () => {
    console.log('Cleaning up subscription:', crewId)
    supabase.removeChannel(channel)
  }
}, [crewId])
```

**Common Issues**:

- **Messages not appearing**: Check RLS policies, ensure Realtime enabled on table
- **Memory leaks**: Verify cleanup in `useEffect` return
- **Multiple subscriptions**: Check dependencies array

### Supabase Debugging

```javascript
// Enable verbose logging
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  auth: { debug: true }  // Log auth events
})

// Check RLS policies
// In Supabase dashboard: Authentication > Policies
// Verify policies allow current user's actions
```

### Network Debugging

```javascript
// Check API responses
const { data, error } = await getSignalsFeed(crewIds)
console.log('Feed data:', data)
console.log('Feed error:', error)

// Check Supabase connection
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
```

---

## Deployment

### Netlify (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git push origin main
   ```

2. **Connect on Netlify**
   - Go to [netlify.com](https://netlify.com)
   - "Add new site" > "Import from Git"
   - Select repository
   - Build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

3. **Environment Variables**
   - In Netlify dashboard: Site settings > Environment variables
   - Add:
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGc...
     VITE_APP_URL=https://your-site.netlify.app
     ```

4. **Configure Supabase Redirect URLs**
   - In Supabase: Authentication > URL Configuration
   - Add Netlify URL to "Redirect URLs": `https://your-site.netlify.app/**`

5. **Deploy**
   - Netlify auto-deploys on git push
   - Check deploy logs for errors

### Netlify Configuration

**File**: `netlify.toml` (already configured)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel (Alternative)

Similar to Netlify but auto-detects Vite config:

1. Import repo on [vercel.com](https://vercel.com)
2. Add environment variables
3. Deploy

### Pre-deployment Checklist

- [ ] All environment variables set
- [ ] Supabase RLS policies configured
- [ ] Supabase Realtime enabled on required tables
- [ ] `npm run build` succeeds locally
- [ ] PWA icons in `/public/` (icon-192.png, icon-512.png)
- [ ] Test production build: `npm run preview`
- [ ] Update `VITE_APP_URL` to production URL
- [ ] Configure Supabase redirect URLs

---

## Advanced Topics

### Adding a New Database Table

1. **Create table in Supabase SQL Editor**
   ```sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT now(),
     -- other fields
   );

   -- Enable RLS
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

   -- Add policies
   CREATE POLICY "Users can read own data"
     ON new_table FOR SELECT
     TO authenticated
     USING (auth.uid() = user_id);
   ```

2. **Add helper functions to `/src/lib/supabase.js`**
   ```javascript
   export const getNewTableData = async (userId) => {
     return await supabase
       .from('new_table')
       .select('*')
       .eq('user_id', userId)
   }
   ```

3. **Use in components**
   ```javascript
   import { getNewTableData } from '../lib/supabase'
   ```

### Adding Real-time to Existing Feature

1. **Enable in Supabase**
   - Database > Replication
   - Enable for table
   - Choose events: INSERT, UPDATE, DELETE

2. **Add subscription helper**
   ```javascript
   export const subscribeToNewTable = (callback) => {
     return supabase
       .channel('new_table_changes')
       .on('postgres_changes', {
         event: '*',
         schema: 'public',
         table: 'new_table'
       }, callback)
       .subscribe()
   }
   ```

3. **Use in component**
   ```javascript
   useEffect(() => {
     const channel = subscribeToNewTable((payload) => {
       console.log('Change:', payload)
       // Update state
     })
     return () => supabase.removeChannel(channel)
   }, [])
   ```

### Image Upload Pattern

```javascript
import { uploadImage, createListing } from '../lib/supabase'

const handleImageUpload = async (file) => {
  try {
    const imageUrl = await uploadImage(file, 'listings')

    // Use URL in database record
    await createListing({
      title: 'My Board',
      images: [imageUrl]
    })

    addNotification({ type: 'success', message: 'Imagem enviada!' })
  } catch (err) {
    addNotification({ type: 'error', message: 'Erro ao enviar imagem' })
  }
}

// In JSX
<input
  type="file"
  accept="image/*"
  onChange={(e) => handleImageUpload(e.target.files[0])}
/>
```

---

## Quick Reference

### Must-Know Files

| File | Purpose |
|------|---------|
| `/src/App.jsx` | Routing + context providers |
| `/src/lib/supabase.js` | All database operations (88 functions) |
| `/src/lib/AuthContext.jsx` | Authentication state |
| `/src/lib/NotificationContext.jsx` | In-app notifications |
| `/src/index.css` | All styles |
| `/src/components/Icons.jsx` | 40+ SVG icons |

### Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Git
git status
git add .
git commit -m "message"
git push -u origin branch-name
```

### Useful Supabase Functions

```javascript
// Most-used helpers
import {
  // Auth
  signIn, signOut, getCurrentUser, getProfile,

  // Crews
  getMyCrews, createCrew, joinCrewByCode,

  // Signals
  getSignalsFeed, createSignal, subscribeToSignals,

  // Chat
  getChatMessages, sendChatMessage, subscribeToChatMessages,

  // Social
  requestFollow, getFollowers, getFollowing
} from '../lib/supabase'
```

### Component Template

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNotifications } from '../lib/NotificationContext'
import { getSomeData } from '../lib/supabase'

const MyComponent = () => {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await getSomeData()
        if (error) throw error
        setData(data)
      } catch (err) {
        addNotification({ type: 'error', message: err.message })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="my-component">
      {/* Content */}
    </div>
  )
}

export default MyComponent
```

---

## Troubleshooting

### "Invalid API key"
- Check `.env` file exists and has correct values
- Verify `VITE_SUPABASE_ANON_KEY` starts with `eyJ`
- Restart dev server after `.env` changes

### "Table does not exist"
- Run all SQL files in Supabase SQL Editor in order
- Check for SQL errors in execution log

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Real-time not working
- Check Realtime enabled in Supabase for table
- Verify RLS policies allow SELECT on table
- Check subscription cleanup in `useEffect`
- Look for errors in browser console

### Images not uploading
- Check Storage bucket "uploads" exists in Supabase
- Verify bucket is public or has correct policies
- Check file size limit (default 50MB)

---

## Contributing Guidelines for AI Assistants

When making changes to this codebase:

1. **Always read before writing**: Use Read tool to check existing code
2. **Follow existing patterns**: Match the style and structure already in place
3. **Use helper functions**: Never write raw Supabase queries in components
4. **Test real-time features**: Verify subscription cleanup
5. **Portuguese text**: All UI text in Portuguese
6. **CSS in index.css**: Don't create component-level CSS files
7. **Error handling**: Always try/catch with user-friendly notifications
8. **Comments in Portuguese**: Keep code comments in Portuguese
9. **Mobile-friendly**: Test responsive behavior
10. **Security**: Never expose sensitive data, check RLS policies

### Code Review Checklist

- [ ] Uses existing helper functions from `supabase.js`
- [ ] Real-time subscriptions have cleanup
- [ ] Error handling with notifications
- [ ] Portuguese UI text
- [ ] Follows existing component patterns
- [ ] CSS added to `index.css` with appropriate naming
- [ ] No security vulnerabilities (XSS, injection, etc.)
- [ ] Mobile responsive
- [ ] Tested in browser

---

**End of CLAUDE.md** 🌊

> For questions or updates, refer to this document and the main README.md.
> This guide is maintained as the source of truth for AI assistants working on the CREW codebase.
