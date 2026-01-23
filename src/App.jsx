import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { NotificationProvider } from './lib/NotificationContext'
import { AlertChecker } from './lib/AlertChecker'
import { OfflineBanner, InstallPrompt } from './components/PWA'
import Auth from './pages/Auth'
import Feed from './pages/Feed'
import Crews from './pages/Crews'
import CrewDetail from './pages/CrewDetail'
import Map from './pages/Map'
import Market from './pages/Market'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Join from './pages/Join'
import './index.css'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/auth" />
  }
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AlertChecker />
          <OfflineBanner />
          <InstallPrompt />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/join/:code?" element={<Join />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } />
            <Route path="/crews" element={
              <ProtectedRoute>
                <Crews />
              </ProtectedRoute>
            } />
            <Route path="/crews/:crewId" element={
              <ProtectedRoute>
                <CrewDetail />
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute>
                <Map />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/market" element={
              <ProtectedRoute>
                <Market />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
