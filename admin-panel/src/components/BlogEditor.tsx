import { useRef, useEffect, useCallback, useMemo } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { supabase } from '@/lib/supabase'

// Register image upload handler
const ImageUpload = Quill.import('formats/image')
ImageUpload.className = 'ql-image'

interface BlogEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export const BlogEditor = ({ value, onChange, placeholder = 'Write your blog content here...' }: BlogEditorProps) => {
  const quillRef = useRef<ReactQuill>(null)

  // Custom image handler with loading state
  const ImageHandler = useCallback(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) {
      console.error('Quill instance not found')
      alert('Editor not ready. Please try again.')
      return
    }

    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const range = quill.getSelection(true)
      const index = range ? range.index : quill.getLength()

      // Insert loading placeholder
      const loadingPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VcGxvYWRpbmcuLi48L3RleHQ+PC9zdmc+'
      quill.insertEmbed(index, 'image', loadingPlaceholder)
      quill.setSelection(index + 1)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `blog-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      try {
        // Try to upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.log('Storage upload error:', error)
          // If storage bucket doesn't exist, use base64 as fallback
          if (error.message?.includes('Bucket not found') || error.message?.includes('not found') || error.message?.includes('The resource was not found')) {
            console.log('Storage bucket not found, using base64 fallback')
            const reader = new FileReader()
            reader.onloadend = () => {
              quill.deleteText(index, 1)
              quill.insertEmbed(index, 'image', reader.result as string)
              quill.setSelection(index + 1)
            }
            reader.readAsDataURL(file)
            return
          }
          
          // Remove loading placeholder
          quill.deleteText(index, 1)
          throw error
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)

        // Replace loading placeholder with actual image
        quill.deleteText(index, 1)
        quill.insertEmbed(index, 'image', publicUrl)
        quill.setSelection(index + 1)
      } catch (error: any) {
        console.error('Error uploading image:', error)
        // Remove loading placeholder if still there
        try {
          quill.deleteText(index, 1)
        } catch {}
        
        // Fallback to base64 if storage fails
        try {
          const reader = new FileReader()
          reader.onloadend = () => {
            quill.insertEmbed(index, 'image', reader.result as string)
            quill.setSelection(index + 1)
          }
          reader.readAsDataURL(file)
        } catch (fallbackError) {
          const errorMsg = error?.message || 'Failed to upload image'
          alert(`Error: ${errorMsg}. Using local image instead.`)
        }
      }
    }
  }, [])

  // Custom toolbar with all features - memoized to prevent re-initialization
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'direction': 'rtl' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: ImageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), [ImageHandler])

  const formats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent', 'script',
    'direction', 'color', 'background',
    'align', 'link', 'image', 'video'
  ], [])

  return (
    <div className="blog-editor">
      <style>{`
        .blog-editor .ql-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          min-height: 400px;
        }
        .blog-editor .ql-editor {
          min-height: 400px;
          line-height: 1.8;
        }
        .blog-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        .blog-editor .ql-snow .ql-tooltip {
          z-index: 1000;
        }
        .blog-editor .ql-snow .ql-picker-label {
          color: #374151;
        }
        .blog-editor .ql-snow .ql-stroke {
          stroke: #374151;
        }
        .blog-editor .ql-snow .ql-fill {
          fill: #374151;
        }
        .blog-editor .ql-snow .ql-picker-options {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .blog-editor .ql-snow .ql-toolbar {
          border: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
          background: #f9fafb;
          padding: 12px;
        }
        .blog-editor .ql-snow .ql-container {
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .blog-editor .ql-snow .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        .blog-editor .ql-snow .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .blog-editor .ql-snow .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  )
}
