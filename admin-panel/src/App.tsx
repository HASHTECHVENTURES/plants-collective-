import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })))
const BannersPage = lazy(() => import('@/pages/BannersPage').then(m => ({ default: m.BannersPage })))
const BlogsPage = lazy(() => import('@/pages/BlogsPage').then(m => ({ default: m.BlogsPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const KnowledgePage = lazy(() => import('@/pages/KnowledgePage').then(m => ({ default: m.KnowledgePage })))
const ConfigPage = lazy(() => import('@/pages/ConfigPage').then(m => ({ default: m.ConfigPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const GoldMeetPage = lazy(() => import('@/pages/GoldMeetPage').then(m => ({ default: m.GoldMeetPage })))
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage').then(m => ({ default: m.FeedbackPage })))

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { admin, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!admin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const AppRoutes = () => {
  const { admin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <LoginPage />} />
      
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardPage />
          </Suspense>
        } />
        <Route path="/users" element={
          <Suspense fallback={<LoadingSpinner />}>
            <UsersPage />
          </Suspense>
        } />
        <Route path="/banners" element={
          <Suspense fallback={<LoadingSpinner />}>
            <BannersPage />
          </Suspense>
        } />
        <Route path="/blogs" element={
          <Suspense fallback={<LoadingSpinner />}>
            <BlogsPage />
          </Suspense>
        } />
        <Route path="/notifications" element={
          <Suspense fallback={<LoadingSpinner />}>
            <NotificationsPage />
          </Suspense>
        } />
        <Route path="/knowledge" element={
          <Suspense fallback={<LoadingSpinner />}>
            <KnowledgePage />
          </Suspense>
        } />
        <Route path="/config" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ConfigPage />
          </Suspense>
        } />
        <Route path="/analytics" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AnalyticsPage />
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsPage />
          </Suspense>
        } />
        <Route path="/gold-meet" element={
          <Suspense fallback={<LoadingSpinner />}>
            <GoldMeetPage />
          </Suspense>
        } />
        <Route path="/feedback" element={
          <Suspense fallback={<LoadingSpinner />}>
            <FeedbackPage />
          </Suspense>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App

