import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { Search, Trash2, Eye, Download, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const UsersPage = () => {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) {
      setUsers(users.filter(u => u.id !== id))
      setSelectedUser(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone_number?.includes(search) ||
    user.city?.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Gender', 'City', 'State', 'Country', 'Joined']
    const rows = users.map(u => [
      u.full_name || '',
      u.email || '',
      u.phone_number || '',
      u.gender || '',
      u.city || '',
      u.state || '',
      u.country || '',
      formatDate(u.created_at)
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportCSV} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or city..."
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {user.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-gray-500">{user.gender || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{user.phone_number || '-'}</p>
                      <p className="text-sm text-gray-500">{user.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{user.city || '-'}</p>
                      <p className="text-sm text-gray-500">{user.state}, {user.country}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium">{selectedUser.full_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{selectedUser.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{selectedUser.phone_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Gender</label>
                <p className="font-medium">{selectedUser.gender || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Birthdate</label>
                <p className="font-medium">{selectedUser.birthdate || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Location</label>
                <p className="font-medium">
                  {[selectedUser.city, selectedUser.state, selectedUser.country].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Joined</label>
                <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setSelectedUser(null)} className="flex-1 btn-secondary">
                Close
              </button>
              <button onClick={() => deleteUser(selectedUser.id)} className="flex-1 btn-danger">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

