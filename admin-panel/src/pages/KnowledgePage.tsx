import { useEffect, useState, useRef } from 'react'
import { supabase, KnowledgeDocument } from '@/lib/supabase'
import { Plus, Trash2, FileText, Upload, CheckCircle, AlertCircle, Clock, File, X, Loader2, FileType, Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker - using local file for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export const KnowledgePage = () => {
  const { admin } = useAuth()
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    content: ''
  })
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDocument | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    console.log('Fetching knowledge documents...')
    
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Fetch result:', { data, error })
    
    if (error) {
      console.error('Error fetching documents:', error)
    }
    
    if (data) {
      console.log('Documents found:', data.length)
      setDocuments(data)
    }
    setLoading(false)
  }

  // Small delay to allow UI to update
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Sanitize text to remove problematic Unicode characters
  const sanitizeText = (text: string): string => {
    return text
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove other control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Replace problematic Unicode escape sequences
      .replace(/\\u[0-9a-fA-F]{4}/g, '')
      // Remove surrogate pairs that might cause issues
      .replace(/[\uD800-\uDFFF]/g, '')
      // Replace multiple spaces with single space
      .replace(/  +/g, ' ')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    setUploadProgress('Loading PDF...')
    setCurrentPage(0)
    setTotalPages(0)
    await delay(100) // Allow UI to render
    
    const arrayBuffer = await file.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)
    
    setUploadProgress('Parsing PDF...')
    await delay(100) // Allow UI to render
    
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise
    
    let fullText = ''
    const numPages = pdf.numPages
    setTotalPages(numPages)
    await delay(50) // Allow UI to render
    
    for (let i = 1; i <= numPages; i++) {
      setCurrentPage(i)
      setUploadProgress(`Extracting text from page ${i} of ${numPages}...`)
      await delay(10) // Small delay to show progress for each page
      
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n\n'
    }
    
    setUploadProgress('Processing complete!')
    await delay(500) // Show completion message briefly
    return fullText.trim()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    if (!['pdf', 'txt'].includes(fileExtension || '')) {
      alert('Please upload a PDF or TXT file')
      return
    }

    setUploading(true)
    setUploadProgress('Reading file...')

    try {
      let extractedText = ''

      if (fileExtension === 'pdf') {
        extractedText = await extractTextFromPDF(file)
      } else if (fileExtension === 'txt') {
        extractedText = await file.text()
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        alert('Could not extract text from the file. The file might be empty or contain only images.')
        setUploading(false)
        setUploadProgress('')
        setCurrentPage(0)
        setTotalPages(0)
        return
      }

      // Auto-fill the form with extracted content (sanitized)
      setFormData({
        ...formData,
        name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        content: sanitizeText(extractedText)
      })
      
      setUploadProgress('')
      setUploading(false)
      setCurrentPage(0)
      setTotalPages(0)
      setShowForm(true)
      
    } catch (error: any) {
      console.error('Error processing file:', error)
      alert(`Error processing file: ${error.message || 'Unknown error'}. Please try again or paste content manually.`)
      setUploading(false)
      setUploadProgress('')
      setCurrentPage(0)
      setTotalPages(0)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const saveDocument = async () => {
    if (!formData.name || !formData.content) return

    console.log('Saving document:', formData.name)
    
    // Sanitize content before saving
    const cleanContent = sanitizeText(formData.content)
    const cleanName = sanitizeText(formData.name)
    const cleanDescription = formData.description ? sanitizeText(formData.description) : null
    
    const { data, error } = await supabase.from('knowledge_documents').insert({
      name: cleanName,
      description: cleanDescription,
      category: formData.category,
      content: cleanContent,
      status: 'ready',
      created_by: admin?.id
    }).select()

    console.log('Save result:', { data, error })
    
    if (error) {
      console.error('Error saving document:', error)
      alert(`Error saving: ${error.message}`)
      return
    }

    alert('Document saved successfully!')
    setShowForm(false)
    setFormData({ name: '', description: '', category: '', content: '' })
    fetchDocuments()
  }

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete this document? The AI will no longer have access to this knowledge.')) return
    await supabase.from('knowledge_documents').delete().eq('id', id)
    fetchDocuments()
  }

  const getStatusIcon = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700'
      case 'processing': return 'bg-yellow-100 text-yellow-700'
      case 'error': return 'bg-red-100 text-red-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
          <p className="text-gray-500">Upload content for the AI to learn from</p>
        </div>
        <div className="flex gap-2">
          {/* File Upload Button */}
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <File className="w-4 h-4" />
            Upload File
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Manually
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-blue-800 font-medium">{uploadProgress}</span>
            </div>
            
            {totalPages > 0 && (
              <>
                {/* Progress Bar */}
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(currentPage / totalPages) * 100}%` }}
                  />
                </div>
                
                {/* Progress Details */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">
                    📄 Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {Math.round((currentPage / totalPages) * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {documents.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-sm text-green-600 font-medium">Total Documents</p>
            <p className="text-2xl font-bold text-green-700">{documents.length}</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Characters</p>
            <p className="text-2xl font-bold text-blue-700">
              {documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Ready for AI</p>
            <p className="text-2xl font-bold text-purple-700">
              {documents.filter(d => d.status === 'ready').length}
            </p>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">How it works</h3>
            <p className="text-sm text-blue-700 mt-1">
              Upload <strong>PDF</strong> or <strong>TXT</strong> files, or manually add your product information, FAQs, skincare guides, or any content you want the AI to know about.
              When users ask questions in the app, the AI will use this knowledge to provide accurate answers.
            </p>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <FileType className="w-4 h-4" />
                <span>PDF files</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <FileText className="w-4 h-4" />
                <span>Text files</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No knowledge documents yet</p>
            <p className="text-sm">Upload a PDF/TXT file or add your first document to train the AI</p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </span>
                    </div>
                    {doc.category && (
                      <p className="text-sm text-primary-600 mb-1">{doc.category}</p>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-2">{doc.description || doc.content?.slice(0, 100) + '...'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-gray-400">
                        Added: {formatDateTime(doc.created_at)}
                      </p>
                      {doc.content && (
                        <p className="text-xs text-gray-400">
                          {doc.content.length.toLocaleString()} characters
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                      title="View content"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Knowledge Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Knowledge Document</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {formData.content && formData.content.length > 100 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700">
                  Content extracted successfully! ({formData.content.length.toLocaleString()} characters) Review and save below.
                </span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Product Catalog 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  <option value="">Select category</option>
                  <option value="Products">Products</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Haircare">Haircare</option>
                  <option value="Plants">Plants & Gardening</option>
                  <option value="Ayurveda">Ayurveda</option>
                  <option value="Health">Health & Wellness</option>
                  <option value="FAQ">FAQ</option>
                  <option value="Company">Company Info</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="Brief description of what this document contains"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Content *</label>
                  {formData.content && (
                    <span className="text-xs text-gray-500">
                      {formData.content.length.toLocaleString()} characters
                    </span>
                  )}
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input font-mono text-sm"
                  rows={12}
                  placeholder="Paste your content here or upload a PDF/TXT file...

Example:
Product: Hair Treatment Oil
Price: ₹599
Ingredients: Bhringraj, Amla, Coconut Oil, Vitamin E
Benefits: Reduces hair fall, promotes growth, adds shine
Usage: Apply to scalp, massage gently, leave for 30 minutes before washing"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Include product details, FAQs, or any information you want the AI to know
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => {
                setShowForm(false)
                setFormData({ name: '', description: '', category: '', content: '' })
              }} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button 
                onClick={saveDocument} 
                disabled={!formData.name || !formData.content}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Add to Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingDoc.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  {viewingDoc.category && (
                    <span className="text-sm text-primary-600">{viewingDoc.category}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(viewingDoc.status)}`}>
                    {viewingDoc.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {viewingDoc.content?.length.toLocaleString()} characters
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {viewingDoc.description && (
              <p className="text-sm text-gray-600 mb-4 pb-4 border-b">
                {viewingDoc.description}
              </p>
            )}
            
            <div className="flex-1 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Document Content:</h3>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-white p-4 rounded border max-h-96 overflow-y-auto">
                  {viewingDoc.content}
                </pre>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="text-xs text-gray-400">
                Added: {formatDateTime(viewingDoc.created_at)}
              </p>
              <button onClick={() => setViewingDoc(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
