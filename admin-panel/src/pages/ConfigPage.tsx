import { useEffect, useState } from 'react'
import { supabase, AppConfig } from '@/lib/supabase'
import { Settings, Save, AlertTriangle, Smartphone, Mail } from 'lucide-react'

export const ConfigPage = () => {
  const [configs, setConfigs] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [forceUpdate, setForceUpdate] = useState(false)
  const [minVersion, setMinVersion] = useState('1.0.0')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('app_config').select('*')
    
    console.log('App Config fetch:', { data, error })

    if (error) {
      console.error('Error fetching app config:', error)
    }

    if (data) {
      setConfigs(data)
      
      // Parse configs
      const maintenance = data.find(c => c.key === 'maintenance_mode')?.value
      if (maintenance) {
        setMaintenanceMode(maintenance.enabled || false)
        setMaintenanceMessage(maintenance.message || '')
      }

      const appVersion = data.find(c => c.key === 'app_version')?.value
      if (appVersion) {
        setForceUpdate(appVersion.force_update || false)
        setMinVersion(appVersion.min_version || '1.0.0')
      }

      const contact = data.find(c => c.key === 'contact_info')?.value
      if (contact) {
        setContactEmail(contact.email || '')
        setContactPhone(contact.phone || '')
        setContactWhatsapp(contact.whatsapp || '')
      }
    }
    setLoading(false)
  }

  const saveConfigs = async () => {
    setSaving(true)
    console.log('Saving configs...')

    const results = await Promise.all([
      supabase.from('app_config').upsert({
        key: 'maintenance_mode',
        value: { enabled: maintenanceMode, message: maintenanceMessage },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' }),

      supabase.from('app_config').upsert({
        key: 'app_version',
        value: { min_version: minVersion, force_update: forceUpdate, current_version: '1.0.0' },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' }),

      supabase.from('app_config').upsert({
        key: 'contact_info',
        value: { email: contactEmail, phone: contactPhone, whatsapp: contactWhatsapp },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    ])

    console.log('Save results:', results)
    
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Save errors:', errors)
      alert('Error saving: ' + errors.map(e => e.error?.message).join(', '))
    } else {
      alert('Settings saved successfully!')
    }

    setSaving(false)
    fetchConfigs()
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Configuration</h1>
          <p className="text-gray-500">Control app settings remotely</p>
        </div>
        <button onClick={saveConfigs} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Maintenance Mode</h2>
              <p className="text-sm text-gray-500">Take the app offline temporarily</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Enable Maintenance Mode</span>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  maintenanceMode ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Message</label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="input"
                rows={3}
                placeholder="We are currently under maintenance. Please check back soon."
              />
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">App Version Control</h2>
              <p className="text-sm text-gray-500">Force users to update the app</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Required Version</label>
              <input
                type="text"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                className="input"
                placeholder="1.0.0"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Force Update</span>
              <button
                onClick={() => setForceUpdate(!forceUpdate)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  forceUpdate ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                  forceUpdate ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, users with older versions will be required to update before using the app
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-500">Support contact details shown in the app</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="input"
                placeholder="support@plantscollective.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="input"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                className="input"
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

