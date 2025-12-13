import { useEffect, useState, useRef } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { Plus, Trash2, Edit2, GripVertical, Image, Video } from 'lucide-react'

export const BannersPage = () => {
  const [banners, setBanners] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    media_type: 'image' as 'image' | 'video',
    is_active: true
  })
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('')
  const uploadInProgressRef = useRef(false)

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

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Prevent multiple simultaneous uploads
    if (uploadInProgressRef.current) {
      console.log('Upload already in progress, ignoring new file')
      return
    }

    uploadInProgressRef.current = true

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = formData.media_type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File is too large. Maximum size: ${formData.media_type === 'image' ? '10MB' : '50MB'}`)
      uploadInProgressRef.current = false
      return
    }

    // Validate file type
    if (formData.media_type === 'image' && !file.type.startsWith('image/')) {
      alert('Please select an image file')
      uploadInProgressRef.current = false
      return
    }
    if (formData.media_type === 'video' && !file.type.startsWith('video/')) {
      alert('Please select a video file')
      uploadInProgressRef.current = false
      return
    }

    setUploading(true)
    setUploadedFileUrl('') // Clear previous upload

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `banners/${fileName}`

      // Try to upload to Supabase Storage (bucket: 'image')
      const { error } = await supabase.storage
        .from('image')
        .upload(filePath, file, { upsert: false })

      if (error) {
        // If storage fails (RLS policy, bucket not found, etc.), use base64 as fallback
        console.warn('⚠️ Storage upload failed, using base64 fallback:', error.message)
        console.warn('💡 Tip: Fix RLS policies in Supabase to use proper storage. See FIX_STORAGE_RLS.sql')
        
        // Use Promise to handle FileReader properly (prevents freezing)
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string)
            } else {
              reject(new Error('Failed to read file'))
            }
          }
          reader.onerror = () => reject(new Error('File read error'))
          reader.readAsDataURL(file)
        })
        
        setUploadedFileUrl(base64Url)
        setUploading(false)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('image')
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        console.log('✅ File uploaded successfully to Supabase Storage:', urlData.publicUrl)
        setUploadedFileUrl(urlData.publicUrl)
      } else {
        throw new Error('Failed to get public URL after upload')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      // Non-blocking alert
      setTimeout(() => {
        alert('Failed to upload file: ' + (error.message || 'Unknown error'))
      }, 0)
      
      // Fallback to base64 if all else fails
      try {
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string)
            } else {
              reject(new Error('Failed to read file'))
            }
          }
          reader.onerror = () => reject(new Error('File read error'))
          reader.readAsDataURL(file)
        })
        setUploadedFileUrl(base64Url)
      } catch (fallbackError) {
        console.error('Base64 fallback failed:', fallbackError)
        setTimeout(() => {
          alert('Failed to process file. Please try again.')
        }, 0)
      }
    } finally {
      setUploading(false)
      uploadInProgressRef.current = false
    }
  }

  const saveBanner = async () => {
    // Validate: must have uploaded file for new banners, or existing file for edits
    if (!uploadedFileUrl && !editingBanner) {
      alert('Please upload an image or video')
      return
    }

    // For editing, allow saving without new upload (uses existing file)
    const finalFileUrl = uploadedFileUrl || (editingBanner 
      ? (formData.media_type === 'image' ? editingBanner.image_url : editingBanner.video_url)
      : '')

    if (!finalFileUrl) {
      alert('Please upload an image or video')
      return
    }

    const bannerData: any = {
      name: formData.name || `Banner ${Date.now()}`,
      media_type: formData.media_type,
      is_active: formData.is_active,
      display_order: editingBanner ? editingBanner.display_order : banners.length
    }

    // Set image_url or video_url based on media type
    if (formData.media_type === 'image') {
      bannerData.image_url = finalFileUrl
      bannerData.video_url = null // Clear video_url when switching to image
    } else {
      bannerData.video_url = finalFileUrl
      bannerData.image_url = null // Clear image_url when switching to video
    }

    try {
      if (editingBanner) {
        const { error } = await supabase
          .from('products_carousel')
          .update(bannerData)
          .eq('id', editingBanner.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products_carousel')
          .insert(bannerData)
        if (error) throw error
      }

      // Reset form and close modal
      setShowForm(false)
      setEditingBanner(null)
      setFormData({ name: '', media_type: 'image', is_active: true })
      setUploadedFileUrl('')
      
      // Refresh banners list
      await fetchBanners()
      
      // Show success message
      alert(editingBanner ? 'Banner updated successfully!' : 'Banner added successfully!')
    } catch (error: any) {
      console.error('Error saving banner:', error)
      alert('Failed to save banner: ' + (error.message || 'Unknown error'))
    }
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
      name: banner.name || '',
      media_type: banner.media_type,
      is_active: banner.is_active
    })
    // Don't set uploadedFileUrl for editing - let user choose to upload new file or keep existing
    setUploadedFileUrl('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingBanner(null)
    setFormData({ name: '', media_type: 'image', is_active: true })
    setUploadedFileUrl('')
    setUploading(false)
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
                    <img src={banner.image_url} alt={banner.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{banner.name || `Banner ${banner.id.slice(0, 8)}`}</p>
                  <p className="text-sm text-gray-500">{banner.media_type === 'image' ? 'Image' : 'Video'}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <select
                  value={formData.media_type}
                  onChange={(e) => {
                    setFormData({ ...formData, media_type: e.target.value as 'image' | 'video' })
                    setUploadedFileUrl('') // Clear uploaded file when switching type
                  }}
                  className="input"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload {formData.media_type === 'image' ? 'Image' : 'Video'} *
                </label>
                <input
                  type="file"
                  accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // Immediately allow UI to continue - process file asynchronously
                    // Use requestAnimationFrame to ensure UI is responsive
                    requestAnimationFrame(() => {
                      // Then use setTimeout to process in next event loop
                      setTimeout(() => {
                        handleFileUpload(file).catch((error) => {
                          console.error('File upload error:', error)
                          setTimeout(() => {
                            alert('Failed to process file. Please try again.')
                          }, 0)
                          setUploading(false)
                          uploadInProgressRef.current = false
                        })
                      }, 0)
                    })

                    // Reset input after file processing starts (not immediately)
                    setTimeout(() => {
                      const input = e.target as HTMLInputElement
                      if (input) {
                        input.value = ''
                      }
                    }, 500) // Longer delay to avoid interfering with file selection
                  }}
                  className="input"
                  disabled={uploading}
                />
                {uploading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading file...</span>
                  </div>
                )}
                {uploadedFileUrl && !uploading && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                    {formData.media_type === 'image' ? (
                      <img src={uploadedFileUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-gray-200" loading="eager" decoding="async" />
                    ) : (
                      <video src={uploadedFileUrl} controls className="w-full h-32 rounded-lg border border-gray-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => setUploadedFileUrl('')}
                      className="mt-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {editingBanner && !uploadedFileUrl && !uploading && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Current file:</p>
                    {formData.media_type === 'image' && editingBanner.image_url ? (
                      <img src={editingBanner.image_url} alt="Current" className="w-full h-32 object-cover rounded-lg border border-gray-200" loading="eager" decoding="async" />
                    ) : formData.media_type === 'video' && editingBanner.video_url ? (
                      <video src={editingBanner.video_url} controls className="w-full h-32 rounded-lg border border-gray-200" />
                    ) : (
                      <p className="text-xs text-gray-400">No {formData.media_type} file</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Name <span className="text-gray-400">(Optional)</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Auto-generated if empty"
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
                onClick={closeForm}
                className="flex-1 btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                onClick={saveBanner} 
                className={`flex-1 btn-primary ${(uploading || (!uploadedFileUrl && !editingBanner)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={uploading || (!uploadedFileUrl && !editingBanner)}
              >
                {uploading ? 'Uploading...' : editingBanner ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

