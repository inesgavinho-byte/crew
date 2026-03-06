import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { NotificationProvider } from './lib/NotificationContext'
import { AlertChecker } from './lib/AlertChecker'
import { OfflineBanner, InstallPrompt } from './components/PWA'
import './index.css'

const Auth = lazy(() => import('./pages/Auth'))
const Feed = lazy(() => import('./pages/Feed'))
const Crews = lazy(() => import('./pages/Crews'))
const CrewDetail = lazy(() => import('./pages/CrewDetail'))
const Map = lazy(() => import('./pages/Map'))
const Market = lazy(() => import('./pages/Market'))
const Profile = lazy(() => import('./pages/Profile'))
const Messages = lazy(() => import('./pages/Messages'))
const Join = lazy(() => import('./pages/Join'))

const PageLoader = () => (
  <div className="loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    Loading...
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
