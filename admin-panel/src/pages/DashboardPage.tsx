import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, FileText, Image, Bell, TrendingUp, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Stats {
  totalUsers: number
  totalBlogs: number
  totalProducts: number
  totalNotifications: number
  recentUsers: any[]
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBlogs: 0,
    totalProducts: 0,
    totalNotifications: 0,
    recentUsers: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get counts
      const [usersRes, blogsRes, productsRes, notificationsRes, recentUsersRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('products_carousel').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalBlogs: blogsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalNotifications: notificationsRes.count || 0,
        recentUsers: recentUsersRes.data || []
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500' },
    { icon: FileText, label: 'Blog Posts', value: stats.totalBlogs, color: 'bg-green-500' },
    { icon: Image, label: 'Banners', value: stats.totalProducts, color: 'bg-purple-500' },
    { icon: Bell, label: 'Notifications', value: stats.totalNotifications, color: 'bg-orange-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to Plants Collective Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="divide-y">
            {stats.recentUsers.length === 0 ? (
              <div className="p-5 text-center text-gray-500">No users yet</div>
            ) : (
              stats.recentUsers.map((user) => (
                <div key={user.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.full_name || 'No name'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email || user.phone_number || 'No contact'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(user.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            <a href="/blogs" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Create Blog Post</p>
                  <p className="text-sm text-gray-500">Write and publish new content</p>
                </div>
              </div>
            </a>
            <a href="/banners" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Add Banner</p>
                  <p className="text-sm text-gray-500">Add to home screen banner</p>
                </div>
              </div>
            </a>
            <a href="/notifications" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Send Notification</p>
                  <p className="text-sm text-gray-500">Notify all users</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

