import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Video, Play, Radio, GripVertical, Settings, X } from 'lucide-react'

interface GoldMeetSession {
  id: string
  title: string
  speaker: string
  category: string
  session_date: string
  duration: string
  youtube_url: string
  thumbnail_url: string | null
  is_live: boolean
  is_active: boolean
  display_order: number
  created_at: string
}

interface Category {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export const GoldMeetPage = () => {
  const [sessions, setSessions] = useState<GoldMeetSession[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingSession, setEditingSession] = useState<GoldMeetSession | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    category: '',
    session_date: '',
    duration: '',
    youtube_url: '',
    is_live: false,
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from('gold_meet_sessions')
      .select('*')
      .order('display_order', { ascending: true })

    if (sessionsData) setSessions(sessionsData)
    
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('gold_meet_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (categoriesData && categoriesData.length > 0) {
      setCategories(categoriesData)
      if (!formData.category) {
        setFormData(prev => ({ ...prev, category: categoriesData[0].name }))
      }
    } else {
      // Fallback default categories
      setCategories([
        { id: '1', name: 'Skincare', display_order: 0, is_active: true },
        { id: '2', name: 'Haircare', display_order: 1, is_active: true },
        { id: '3', name: 'Nutrition', display_order: 2, is_active: true },
        { id: '4', name: 'Wellness', display_order: 3, is_active: true },
        { id: '5', name: 'Q&A', display_order: 4, is_active: true },
      ])
    }
    
    setLoading(false)
  }

  // Category Management
  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    
    const { error } = await supabase.from('gold_meet_categories').insert({
      name: newCategoryName.trim(),
      display_order: categories.length,
      is_active: true
    })
    
    if (!error) {
      setNewCategoryName('')
      fetchData()
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Sessions with this category will keep their category name.')) return
    await supabase.from('gold_meet_categories').delete().eq('id', id)
    fetchData()
  }

  const toggleCategoryActive = async (id: string, is_active: boolean) => {
    await supabase.from('gold_meet_categories').update({ is_active: !is_active }).eq('id', id)
    fetchData()
  }

  const updateCategoryName = async (id: string, name: string) => {
    await supabase.from('gold_meet_categories').update({ name }).eq('id', id)
    fetchData()
  }

  const extractYouTubeId = (input: string) => {
    // Check for embed iframe code
    const iframeMatch = input.match(/src=["']([^"']+)["']/)
    if (iframeMatch) {
      const srcUrl = iframeMatch[1]
      const embedMatch = srcUrl.match(/youtube\.com\/embed\/([^?&"]+)/)
      if (embedMatch) return embedMatch[1]
    }
    
    // Check for various YouTube URL formats
    const patterns = [
      /youtube\.com\/embed\/([^?&\s]+)/,           // embed URL
      /youtube\.com\/watch\?v=([^&\s]+)/,          // watch URL
      /youtu\.be\/([^?&\s]+)/,                     // short URL
      /youtube\.com\/v\/([^?&\s]+)/,               // old embed URL
      /youtube\.com\/shorts\/([^?&\s]+)/,          // shorts URL
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  const saveSession = async () => {
    if (!formData.title || !formData.youtube_url) return

    const videoId = extractYouTubeId(formData.youtube_url)
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : formData.youtube_url
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null

    const sessionData = {
      title: formData.title,
      speaker: formData.speaker,
      category: formData.category,
      session_date: formData.session_date,
      duration: formData.is_live ? 'Live' : formData.duration,
      youtube_url: embedUrl,
      thumbnail_url: thumbnail,
      is_live: formData.is_live,
      is_active: formData.is_active,
      display_order: editingSession ? editingSession.display_order : sessions.length
    }

    if (editingSession) {
      await supabase.from('gold_meet_sessions').update(sessionData).eq('id', editingSession.id)
    } else {
      await supabase.from('gold_meet_sessions').insert(sessionData)
    }

    setShowForm(false)
    setEditingSession(null)
    setFormData({ title: '', speaker: '', category: categories[0]?.name || '', session_date: '', duration: '', youtube_url: '', is_live: false, is_active: true })
    fetchData()
  }

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return
    await supabase.from('gold_meet_sessions').delete().eq('id', id)
    fetchData()
  }

  const toggleLive = async (id: string, is_live: boolean) => {
    // If setting to live, first turn off all other live sessions
    if (!is_live) {
      await supabase.from('gold_meet_sessions').update({ is_live: false }).neq('id', id)
    }
    await supabase.from('gold_meet_sessions').update({ is_live: !is_live, duration: !is_live ? 'Live' : '' }).eq('id', id)
    fetchData()
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('gold_meet_sessions').update({ is_active: !is_active }).eq('id', id)
    fetchData()
  }

  const openEditForm = (session: GoldMeetSession) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      speaker: session.speaker,
      category: session.category,
      session_date: session.session_date || '',
      duration: session.duration || '',
      youtube_url: session.youtube_url,
      is_live: session.is_live,
      is_active: session.is_active
    })
    setShowForm(true)
  }

  const activeCategories = categories.filter(c => c.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gold Meet Sessions</h1>
          <p className="text-gray-500">Manage live & recorded video sessions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryManager(true)} className="btn-secondary flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Categories
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Session
          </button>
        </div>
      </div>

      {/* Current Categories Preview */}
      <div className="flex flex-wrap gap-2">
        {activeCategories.map((cat) => (
          <span key={cat.id} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {cat.name}
          </span>
        ))}
      </div>

      {/* Sessions List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No sessions yet. Add your first video session!</p>
          </div>
        ) : (
          <div className="divide-y">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="text-gray-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {session.thumbnail_url ? (
                    <img src={session.thumbnail_url} alt={session.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  {session.is_live && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {session.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {session.speaker} • {session.session_date} • {session.duration}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLive(session.id, session.is_live)}
                    className={`p-2 rounded-lg ${
                      session.is_live ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title={session.is_live ? 'Turn off live' : 'Set as live'}
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(session.id, session.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {session.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => openEditForm(session)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => deleteSession(session.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingSession ? 'Edit Session' : 'Add Session'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Daily Live Session"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Speaker</label>
                <input
                  type="text"
                  value={formData.speaker}
                  onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  className="input"
                  placeholder="Dr. A. Sharma"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="input"
                    placeholder="Today, Tomorrow, Friday..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL or Embed Code *</label>
                <textarea
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="input font-mono text-sm"
                  rows={3}
                  placeholder='Paste YouTube URL or embed code:

https://www.youtube.com/watch?v=xxxxx
OR
<iframe src="https://www.youtube.com/embed/xxxxx"...'
                />
                <p className="text-xs text-gray-500 mt-1">
                  ✓ YouTube URL (watch, share, embed, shorts) 
                  ✓ Embed iframe code from YouTube
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_live"
                    checked={formData.is_live}
                    onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="is_live" className="text-sm text-gray-700 flex items-center gap-1">
                    <Radio className="w-4 h-4 text-red-500" />
                    Live Session
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                </div>
              </div>
              {!formData.is_live && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input"
                    placeholder="35 min"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingSession(null); }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={saveSession} className="flex-1 btn-primary">
                {editingSession ? 'Save Changes' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Manage Categories</h2>
              <button onClick={() => setShowCategoryManager(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Add New Category */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                placeholder="New category name..."
                className="input flex-1"
              />
              <button onClick={addCategory} className="btn-primary px-4">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              {categories.map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  <input
                    type="text"
                    defaultValue={cat.name}
                    onBlur={(e) => {
                      if (e.target.value !== cat.name) {
                        updateCategoryName(cat.id, e.target.value)
                      }
                    }}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => toggleCategoryActive(cat.id, cat.is_active)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              💡 Click on category name to edit. Changes save automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
