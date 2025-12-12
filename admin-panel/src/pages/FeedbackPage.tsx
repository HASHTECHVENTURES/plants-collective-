import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Trash2, Eye, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Feedback {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  category: string
  subject: string
  details: string
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  admin_notes: string | null
  created_at: string
}

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: XCircle }
}

const categoryLabels: Record<string, string> = {
  issue: 'Report an Issue',
  feedback: 'App Feedback',
  feature: 'Feature Request',
  other: 'Other'
}

export const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('feedback_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setFeedbacks(data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('feedback_submissions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    fetchFeedbacks()
    if (selectedFeedback?.id === id) {
      setSelectedFeedback({ ...selectedFeedback, status: status as Feedback['status'] })
    }
  }

  const saveNotes = async () => {
    if (!selectedFeedback) return
    await supabase
      .from('feedback_submissions')
      .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
      .eq('id', selectedFeedback.id)
    
    fetchFeedbacks()
    alert('Notes saved!')
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm('Delete this feedback?')) return
    await supabase.from('feedback_submissions').delete().eq('id', id)
    fetchFeedbacks()
    if (selectedFeedback?.id === id) {
      setSelectedFeedback(null)
    }
  }

  const openFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setAdminNotes(feedback.admin_notes || '')
    // Mark as in_progress if new
    if (feedback.status === 'new') {
      updateStatus(feedback.id, 'in_progress')
    }
  }

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = 
      f.subject.toLowerCase().includes(search.toLowerCase()) ||
      f.details.toLowerCase().includes(search.toLowerCase()) ||
      f.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.user_email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    inProgress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback & Support</h1>
          <p className="text-gray-500">Manage user feedback and support requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
          <p className="text-sm text-gray-500">New</p>
        </div>
        <div className="card p-4 border-l-4 border-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-sm text-gray-500">Resolved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No feedback submissions yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredFeedbacks.map((feedback) => {
              const status = statusConfig[feedback.status]
              const StatusIcon = status.icon
              return (
                <div key={feedback.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => openFeedback(feedback)}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-gray-900">{feedback.subject}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {categoryLabels[feedback.category] || feedback.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{feedback.details}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{feedback.user_name || feedback.user_email || feedback.user_phone || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatDateTime(feedback.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openFeedback(feedback); }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFeedback(feedback.id); }}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedFeedback.subject}</h2>
                <p className="text-sm text-gray-500">
                  {categoryLabels[selectedFeedback.category]} • {formatDateTime(selectedFeedback.created_at)}
                </p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">User Info</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="text-gray-900">{selectedFeedback.user_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="text-gray-900">{selectedFeedback.user_email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>{' '}
                  <span className="text-gray-900">{selectedFeedback.user_phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Details</h3>
              <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {selectedFeedback.details}
              </p>
            </div>

            {/* Status */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="flex gap-2">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => updateStatus(selectedFeedback.id, key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      selectedFeedback.status === key 
                        ? config.color + ' ring-2 ring-offset-2 ring-gray-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input"
                rows={3}
                placeholder="Add internal notes..."
              />
              <button onClick={saveNotes} className="btn-secondary mt-2">
                Save Notes
              </button>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => setSelectedFeedback(null)} className="flex-1 btn-secondary">
                Close
              </button>
              <button onClick={() => deleteFeedback(selectedFeedback.id)} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
