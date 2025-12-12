import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, AdminUser } from '@/lib/supabase'

interface AuthContextType {
  admin: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored admin session
    const storedAdmin = localStorage.getItem('admin-session')
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin))
      } catch {
        localStorage.removeItem('admin-session')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password_hash', password)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      // Log activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: data.id,
        admin_email: data.email,
        action: 'login',
        details: { timestamp: new Date().toISOString() }
      })

      setAdmin(data)
      localStorage.setItem('admin-session', JSON.stringify(data))
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  const logout = async () => {
    if (admin) {
      // Log activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: admin.id,
        admin_email: admin.email,
        action: 'logout',
        details: { timestamp: new Date().toISOString() }
      })
    }
    setAdmin(null)
    localStorage.removeItem('admin-session')
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

