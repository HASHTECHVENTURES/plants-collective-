import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { BannersPage } from '@/pages/BannersPage'
import { BlogsPage } from '@/pages/BlogsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { KnowledgePage } from '@/pages/KnowledgePage'
import { ConfigPage } from '@/pages/ConfigPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { GoldMeetPage } from '@/pages/GoldMeetPage'
import { FeedbackPage } from '@/pages/FeedbackPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { admin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/banners" element={<BannersPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/gold-meet" element={<GoldMeetPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
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

