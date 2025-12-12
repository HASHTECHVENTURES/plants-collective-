import { useEffect, useState, useRef } from 'react'
import { supabase, BlogPost } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Eye, EyeOff, Search, Image, X, Tag, Upload, Loader2, FileText, ExternalLink } from 'lucide-react'
import { formatDate, generateSlug } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface BlogTag {
  id: string
  name: string
  color: string
}

const defaultTags: BlogTag[] = [
  { id: '1', name: 'Skincare', color: 'bg-green-100 text-green-700' },
  { id: '2', name: 'Haircare', color: 'bg-purple-100 text-purple-700' },
  { id: '3', name: 'Wellness', color: 'bg-blue-100 text-blue-700' },
  { id: '4', name: 'Tips', color: 'bg-yellow-100 text-yellow-700' },
  { id: '5', name: 'Science', color: 'bg-pink-100 text-pink-700' },
  { id: '6', name: 'Natural Care', color: 'bg-emerald-100 text-emerald-700' },
]

export const BlogsPage = () => {
  const { admin } = useAuth()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null)
  const [tags, setTags] = useState<BlogTag[]>(defaultTags)
  const [newTagName, setNewTagName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    featured_image: '',
    external_link: '',
    category: '',
    tags: [] as string[],
    is_published: false,
    notify_users: false
  })

  useEffect(() => {
    fetchBlogs()
    fetchTags()
  }, [])

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching blogs:', error)
        alert('Failed to load blogs: ' + error.message)
        return
      }

      if (data) {
        setBlogs(data)
        console.log('Fetched blogs:', data.length)
      }
    } catch (error: any) {
      console.error('Error fetching blogs:', error)
      alert('Failed to load blogs. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    const { data } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true })
    
    if (data && data.length > 0) {
      setTags(data)
    }
  }

  const saveBlog = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!formData.external_link.trim()) {
      alert('Please enter a blog link')
      return
    }

    // Validate URL format
    try {
      new URL(formData.external_link.trim())
    } catch {
      alert('Please enter a valid URL (e.g., https://example.com/blog-post)')
      return
    }

    setSaving(true)
    const slug = generateSlug(formData.title)
    const blogData = {
      title: formData.title.trim(),
      content: null, // No content needed for external links
      excerpt: formData.excerpt.trim() || formData.title.trim(),
      featured_image: formData.featured_image,
      external_link: formData.external_link.trim(),
      category: formData.category,
      tags: formData.tags,
      slug,
      author_id: admin?.id,
      author_name: admin?.name || admin?.email,
      is_published: formData.is_published,
      published_at: formData.is_published ? new Date().toISOString() : null
    }

    try {
      let result
      if (editingBlog) {
        result = await supabase.from('blog_posts').update(blogData).eq('id', editingBlog.id)
      } else {
        result = await supabase.from('blog_posts').insert(blogData).select()
      }

      if (result.error) {
        console.error('Error saving blog:', result.error)
        
        // Check if it's a column error (external_link might not exist)
        if (result.error.message?.includes('column') && result.error.message?.includes('external_link')) {
          alert('Database column missing. Please run the migration SQL: BLOG_EXTERNAL_LINK_MIGRATION.sql in Supabase SQL Editor.')
        } else {
          alert('Failed to save blog: ' + result.error.message)
        }
        return
      }

      console.log('Blog saved successfully:', result.data)

      // Send notification to all users if enabled
      if (formData.notify_users && formData.is_published) {
        // Get the blog data from the result
        const savedBlog = editingBlog 
          ? { id: editingBlog.id, external_link: formData.external_link }
          : (result.data?.[0] || result.data || { id: null, external_link: formData.external_link })
        
        await sendBlogNotification(formData.title, formData.category, savedBlog.external_link)
      }

      setShowForm(false)
      setEditingBlog(null)
      resetForm()
      
      // Clear search to show the new blog
      setSearch('')
      
      // Refresh the blogs list
      await fetchBlogs()
      
      // Show success message
      setTimeout(() => {
        alert(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!')
      }, 100)
    } catch (error: any) {
      console.error('Error saving blog:', error)
      alert('Failed to save blog: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // Send notification about new blog
  const sendBlogNotification = async (blogTitle: string, category: string, externalLink?: string) => {
    try {
      console.log('Sending blog notification to all users...')
      
      // Get all user IDs first
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      if (!users || users.length === 0) {
        console.log('No users found to notify')
        return
      }

      console.log(`Found ${users.length} users to notify`)

      // Create notification with required fields
      // If blog has external link, use it (will open in new tab)
      // Otherwise, link to blogs page
      const notificationLink = externalLink || '/blogs'
      
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title: '📝 New Blog Post!',
          message: `Check out our new article: "${blogTitle}"${category ? ` in ${category}` : ''}`,
          type: 'info', // Use 'info' instead of 'blog' (valid type)
          link: notificationLink, // Link to blog page - clicking notification will navigate here
          target: 'all',
          is_active: true, // Required: notifications must be active
          sent_at: new Date().toISOString(), // Required: must have sent_at timestamp
          created_by: admin?.id
        })
        .select()
        .single()

      if (notifError) {
        console.error('Error creating notification:', notifError)
        throw notifError
      }

      if (!notification) {
        console.error('Notification was not created')
        return
      }

      console.log('Notification created:', notification.id)

      // Create user_notifications for all users
      const userNotifications = users.map(user => ({
        user_id: user.id,
        notification_id: notification.id,
        is_read: false
      }))

      const { error: insertError } = await supabase
        .from('user_notifications')
        .insert(userNotifications)

      if (insertError) {
        console.error('Error creating user notifications:', insertError)
        throw insertError
      }

      console.log(`Successfully sent notification to ${userNotifications.length} users`)
    } catch (error: any) {
      console.error('Failed to send notification:', error)
      alert('Failed to send notification: ' + (error.message || 'Unknown error'))
    }
  }

  const resetForm = () => {
    setFormData({ title: '', excerpt: '', featured_image: '', external_link: '', category: '', tags: [], is_published: false, notify_users: false })
  }

  const deleteBlog = async (id: string) => {
    if (!confirm('Delete this blog post?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    fetchBlogs()
  }

  const togglePublish = async (id: string, is_published: boolean) => {
    await supabase.from('blog_posts').update({
      is_published: !is_published,
      published_at: !is_published ? new Date().toISOString() : null
    }).eq('id', id)
    fetchBlogs()
  }

  const openEditForm = (blog: BlogPost) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt || '',
      featured_image: blog.featured_image || '',
      external_link: blog.external_link || '',
      category: blog.category || '',
      tags: blog.tags || [],
      is_published: blog.is_published,
      notify_users: false
    })
    setShowForm(true)
  }

  // Tag Management
  const addTag = async () => {
    if (!newTagName.trim()) return
    
    const colors = [
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-yellow-100 text-yellow-700',
      'bg-pink-100 text-pink-700',
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    await supabase.from('blog_tags').insert({
      name: newTagName.trim(),
      color: randomColor
    })
    
    setNewTagName('')
    fetchTags()
  }

  const deleteTag = async (id: string) => {
    await supabase.from('blog_tags').delete().eq('id', id)
    fetchTags()
  }

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploadingImage(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, featured_image: reader.result as string })
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(search.toLowerCase()) ||
    blog.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-500">{blogs.length} total posts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTagManager(true)} className="btn-secondary flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </button>
          <button onClick={() => { resetForm(); setEditingBlog(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag.id} className={`px-3 py-1 rounded-full text-sm font-medium ${tag.color}`}>
            {tag.name}
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          className="input pl-10"
        />
      </div>

      {/* Blogs Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
          <p className="text-gray-500 mb-4">Create your first post</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Write Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div key={blog.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-100 relative">
                {blog.featured_image ? (
                  <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  blog.is_published ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'
                }`}>
                  {blog.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="p-4">
                {blog.category && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 mb-2 inline-block">
                    {blog.category}
                  </span>
                )}
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{blog.excerpt || 'No description'}</p>
                {blog.external_link && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-blue-600">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate text-xs">{blog.external_link}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{formatDate(blog.created_at)}</span>
                  <span>{blog.views || 0} views</span>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => togglePublish(blog.id, blog.is_published)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-1 ${
                      blog.is_published ? 'hover:bg-gray-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {blog.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {blog.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => openEditForm(blog)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => deleteBlog(blog.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blog Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingBlog ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingBlog(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                {formData.featured_image ? (
                  <div className="relative">
                    <img src={formData.featured_image} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => setFormData({ ...formData, featured_image: '' })}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-gray-500">Click to upload image</span>
                      </>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog title..."
                  className="input text-xl font-semibold"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary / Description</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description (shown in blog card preview)..."
                  rows={3}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">This will be shown in the blog card preview</p>
              </div>

              {/* External Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Link (URL) *
                  <span className="text-xs text-gray-500 ml-2">Link to the actual blog post</span>
                </label>
                <input
                  type="url"
                  value={formData.external_link}
                  onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                  placeholder="https://example.com/blog-post"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  🔗 Users will be redirected to this link when they click on the blog card
                </p>
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="">Select category</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.name}>{tag.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const newTags = formData.tags.includes(tag.name)
                            ? formData.tags.filter(t => t !== tag.name)
                            : [...formData.tags, tag.name]
                          setFormData({ ...formData, tags: newTags })
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          formData.tags.includes(tag.name)
                            ? tag.color + ' ring-2 ring-primary-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Publish & Notify */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <label htmlFor="is_published" className="font-medium text-gray-700">
                    Publish immediately
                  </label>
                </div>
                
                {formData.is_published && (
                  <div className="flex items-center gap-3 pl-8 pt-2 border-t border-gray-200">
                    <input
                      type="checkbox"
                      id="notify_users"
                      checked={formData.notify_users}
                      onChange={(e) => setFormData({ ...formData, notify_users: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <label htmlFor="notify_users" className="text-gray-700">
                      🔔 Notify all users about this blog post
                    </label>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => { setShowForm(false); setEditingBlog(null); }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveBlog} 
                  disabled={saving}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingBlog ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Manage Tags</h2>
              <button onClick={() => setShowTagManager(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="New tag name..."
                className="input flex-1"
              />
              <button onClick={addTag} className="btn-primary px-4">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${tag.color}`}>
                    {tag.name}
                  </span>
                  <button onClick={() => deleteTag(tag.id)} className="p-1 hover:bg-red-50 rounded text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
