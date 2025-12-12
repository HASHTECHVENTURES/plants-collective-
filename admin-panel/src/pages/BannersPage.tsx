import { useEffect, useState } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { Plus, Trash2, Edit2, GripVertical, Image, Video, ExternalLink } from 'lucide-react'

export const BannersPage = () => {
  const [banners, setBanners] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    video_url: '',
    media_type: 'image' as 'image' | 'video',
    product_link: '',
    is_active: true
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products_carousel')
      .select('*')
      .order('display_order', { ascending: true })

    if (data) setBanners(data)
    setLoading(false)
  }

  const saveBanner = async () => {
    if (!formData.name) return

    const bannerData = {
      ...formData,
      display_order: editingBanner ? editingBanner.display_order : banners.length
    }

    if (editingBanner) {
      await supabase.from('products_carousel').update(bannerData).eq('id', editingBanner.id)
    } else {
      await supabase.from('products_carousel').insert(bannerData)
    }

    setShowForm(false)
    setEditingBanner(null)
    setFormData({ name: '', description: '', image_url: '', video_url: '', media_type: 'image', product_link: '', is_active: true })
    fetchBanners()
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    await supabase.from('products_carousel').delete().eq('id', id)
    fetchBanners()
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('products_carousel').update({ is_active: !is_active }).eq('id', id)
    fetchBanners()
  }

  const openEditForm = (banner: Product) => {
    setEditingBanner(banner)
    setFormData({
      name: banner.name,
      description: banner.description || '',
      image_url: banner.image_url || '',
      video_url: banner.video_url || '',
      media_type: banner.media_type,
      product_link: banner.product_link || '',
      is_active: banner.is_active
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-500">Manage home screen banners</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {/* Banners List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No banners yet. Add your first banner!
          </div>
        ) : (
          <div className="divide-y">
            {banners.map((banner) => (
              <div key={banner.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="text-gray-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {banner.media_type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  ) : banner.image_url ? (
                    <img src={banner.image_url} alt={banner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{banner.name}</p>
                    {banner.product_link && (
                      <a href={banner.product_link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{banner.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(banner.id, banner.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {banner.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => openEditForm(banner)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => deleteBanner(banner.id)} className="p-2 hover:bg-red-50 rounded-lg">
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
              {editingBanner ? 'Edit Banner' : 'Add Banner'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Summer Sale Banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Banner description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <select
                  value={formData.media_type}
                  onChange={(e) => setFormData({ ...formData, media_type: e.target.value as 'image' | 'video' })}
                  className="input"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              {formData.media_type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="input"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input
                  type="url"
                  value={formData.product_link}
                  onChange={(e) => setFormData({ ...formData, product_link: e.target.value })}
                  className="input"
                  placeholder="https://shop.com/sale"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible in app)</label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingBanner(null); }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={saveBanner} className="flex-1 btn-primary">
                {editingBanner ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

