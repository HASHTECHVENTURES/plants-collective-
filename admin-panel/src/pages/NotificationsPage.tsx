import { useEffect, useState } from 'react'
import { supabase, Notification, Profile } from '@/lib/supabase'
import { Plus, Trash2, Bell, Info, Tag, AlertTriangle, Zap, Send, Users, User, Search, X, Check } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export const NotificationsPage = () => {
  const { admin } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as Notification['type'],
    link: ''
  })

  useEffect(() => {
    fetchNotifications()
    fetchUsers()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setNotifications(data)
    setLoading(false)
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    
    if (data) setUsers(data)
  }

  const sendNotification = async () => {
    if (!formData.title || !formData.message) return
    if (targetType === 'specific' && selectedUsers.length === 0) {
      alert('Please select at least one user')
      return
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        link: formData.link || null,
        target: targetType === 'all' ? 'all' : 'specific',
        target_filter: targetType === 'specific' ? { user_ids: selectedUsers.map(u => u.id) } : null,
        is_active: true,
        sent_at: new Date().toISOString(),
        created_by: admin?.id
      })
      .select()
      .single()

    if (error) {
      alert('Failed to send notification')
      return
    }

    // Create user_notifications entries
    if (notification) {
      let targetUsers: { id: string }[] = []
      
      if (targetType === 'all') {
        const { data } = await supabase.from('profiles').select('id')
        targetUsers = data || []
      } else {
        targetUsers = selectedUsers.map(u => ({ id: u.id }))
      }

      const userNotifications = targetUsers.map(user => ({
        user_id: user.id,
        notification_id: notification.id,
        is_read: false
      }))
      await supabase.from('user_notifications').insert(userNotifications)
    }

    setShowForm(false)
    setFormData({ title: '', message: '', type: 'info', link: '' })
    setSelectedUsers([])
    setTargetType('all')
    setSearchQuery('')
    fetchNotifications()
  }

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return
    await supabase.from('notifications').delete().eq('id', id)
    await supabase.from('user_notifications').delete().eq('notification_id', id)
    fetchNotifications()
  }

  const toggleUserSelection = (user: Profile) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone_number?.includes(searchQuery)
  )

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4" />
      case 'promo': return <Tag className="w-4 h-4" />
      case 'alert': return <AlertTriangle className="w-4 h-4" />
      case 'update': return <Zap className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-700'
      case 'promo': return 'bg-purple-100 text-purple-700'
      case 'alert': return 'bg-red-100 text-red-700'
      case 'update': return 'bg-green-100 text-green-700'
    }
  }

  const getTargetLabel = (notification: Notification) => {
    if (notification.target === 'all') return 'All Users'
    const filter = notification.target_filter as any
    if (filter?.user_ids) return `${filter.user_ids.length} user${filter.user_ids.length > 1 ? 's' : ''}`
    return 'Specific Users'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Send notifications to app users</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Send Notification
        </button>
      </div>

      {/* Notifications List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications sent yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                        {notification.target === 'all' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {getTargetLabel(notification)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Sent: {formatDateTime(notification.sent_at || notification.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Notification Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Send Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Summer Sale! 🎉"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Get 20% off on all products..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Notification['type'] })}
                  className="input"
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="promo">🏷️ Promo</option>
                  <option value="alert">⚠️ Alert</option>
                  <option value="update">⚡ Update</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setTargetType('all'); setSelectedUsers([]); }}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                      targetType === 'all' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                      targetType === 'specific' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Specific Users
                  </button>
                </div>
              </div>

              {/* User Selection */}
              {targetType === 'specific' && (
                <div>
                  {/* Selected Users */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedUsers.map(user => (
                        <span 
                          key={user.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {user.full_name || user.phone_number || 'User'}
                          <button onClick={() => removeSelectedUser(user.id)} className="hover:text-primary-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search Users */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-9 text-sm"
                      placeholder="Search users by name, email, or phone..."
                    />
                  </div>

                  {/* User List */}
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">No users found</div>
                    ) : (
                      filteredUsers.map(user => {
                        const isSelected = selectedUsers.some(u => u.id === user.id)
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleUserSelection(user)}
                            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                              isSelected ? 'bg-primary-50' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isSelected ? <Check className="w-4 h-4" /> : (user.full_name?.charAt(0) || '?')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {user.full_name || 'No name'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.phone_number || user.email || 'No contact'}
                              </p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => { 
                  setShowForm(false); 
                  setSelectedUsers([]); 
                  setTargetType('all'); 
                  setSearchQuery(''); 
                }} 
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={sendNotification} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                {targetType === 'all' ? 'Send to All' : `Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

