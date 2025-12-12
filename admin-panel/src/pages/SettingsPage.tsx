import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Lock, Save } from 'lucide-react'

export const SettingsPage = () => {
  const { admin } = useAuth()
  const [name, setName] = useState(admin?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const updateProfile = async () => {
    if (!admin) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('admin_users')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', admin.id)

    if (error) {
      setMessage('Failed to update profile')
    } else {
      setMessage('Profile updated successfully!')
      // Update local storage
      const updatedAdmin = { ...admin, name }
      localStorage.setItem('admin-session', JSON.stringify(updatedAdmin))
    }
    setSaving(false)
  }

  const changePassword = async () => {
    if (!admin) return
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    setMessage('')

    // Verify current password
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', admin.id)
      .eq('password_hash', currentPassword)
      .single()

    if (!data) {
      setMessage('Current password is incorrect')
      setSaving(false)
      return
    }

    // Update password
    const { error } = await supabase
      .from('admin_users')
      .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
      .eq('id', admin.id)

    if (error) {
      setMessage('Failed to change password')
    } else {
      setMessage('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your admin account</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500">Update your profile information</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={admin?.email || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={admin?.role || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed capitalize"
              />
            </div>
            <button
              onClick={updateProfile}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">Update your password</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={changePassword}
              disabled={saving || !currentPassword || !newPassword}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

