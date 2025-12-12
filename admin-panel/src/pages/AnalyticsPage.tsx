import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, TrendingUp, MapPin, Calendar } from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  usersToday: number
  usersThisWeek: number
  usersThisMonth: number
  usersByGender: { gender: string; count: number }[]
  usersByCountry: { country: string; count: number }[]
  usersByCity: { city: string; count: number }[]
}

export const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)

    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: users } = await supabase.from('profiles').select('*')

    if (users) {
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()

      // Calculate stats
      const totalUsers = users.length
      const usersToday = users.filter(u => u.created_at >= todayStart).length
      const usersThisWeek = users.filter(u => new Date(u.created_at) >= weekAgo).length
      const usersThisMonth = users.filter(u => new Date(u.created_at) >= monthAgo).length

      // Group by gender
      const genderCounts: Record<string, number> = {}
      users.forEach(u => {
        const gender = u.gender || 'Not specified'
        genderCounts[gender] = (genderCounts[gender] || 0) + 1
      })
      const usersByGender = Object.entries(genderCounts)
        .map(([gender, count]) => ({ gender, count }))
        .sort((a, b) => b.count - a.count)

      // Group by country
      const countryCounts: Record<string, number> = {}
      users.forEach(u => {
        const country = u.country || 'Unknown'
        countryCounts[country] = (countryCounts[country] || 0) + 1
      })
      const usersByCountry = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Group by city
      const cityCounts: Record<string, number> = {}
      users.forEach(u => {
        const city = u.city || 'Unknown'
        cityCounts[city] = (cityCounts[city] || 0) + 1
      })
      const usersByCity = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setData({
        totalUsers,
        usersToday,
        usersThisWeek,
        usersThisMonth,
        usersByGender,
        usersByCountry,
        usersByCity
      })
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">Failed to load analytics</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">User insights and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.totalUsers}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.usersToday}</p>
              <p className="text-sm text-gray-500">Today</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.usersThisWeek}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.usersThisMonth}</p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Gender */}
        <div className="card">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Users by Gender</h2>
          </div>
          <div className="p-5 space-y-3">
            {data.usersByGender.map((item) => (
              <div key={item.gender} className="flex items-center justify-between">
                <span className="text-gray-600">{item.gender}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(item.count / data.totalUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users by Country */}
        <div className="card">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Top Countries</h2>
          </div>
          <div className="p-5 space-y-3">
            {data.usersByCountry.length === 0 ? (
              <p className="text-gray-500 text-sm">No data</p>
            ) : (
              data.usersByCountry.map((item, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                    <span className="text-gray-600">{item.country}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users by City */}
        <div className="card">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Top Cities</h2>
          </div>
          <div className="p-5 space-y-3">
            {data.usersByCity.length === 0 ? (
              <p className="text-gray-500 text-sm">No data</p>
            ) : (
              data.usersByCity.map((item, index) => (
                <div key={item.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                    <span className="text-gray-600">{item.city}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

