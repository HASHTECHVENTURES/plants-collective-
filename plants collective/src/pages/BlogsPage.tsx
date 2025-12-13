import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { realtimeSyncService } from "@/services/realtimeSyncService";
import ReportButton from "@/components/ReportButton";

const BlogsPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      
      setBlogs(data || []);
    } catch (err: any) {
      console.error('Error fetching blogs:', err);
      setError(err.message || 'Failed to load blogs. Please try again.');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();

    // Subscribe to real-time blog changes
    const unsubscribe = realtimeSyncService.subscribeToBlogs((payload) => {
      if (payload.type === 'INSERT' && payload.new) {
        // New blog published - add to list
        setBlogs(prev => {
          // Check if already exists (avoid duplicates)
          if (prev.some(b => b.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        });
      } else if (payload.type === 'UPDATE' && payload.new) {
        // Blog updated - update in list
        setBlogs(prev => 
          prev.map(blog => blog.id === payload.new.id ? payload.new : blog)
        );
      } else if (payload.type === 'DELETE' && payload.old) {
        // Blog deleted or unpublished - remove from list
        setBlogs(prev => prev.filter(blog => blog.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchBlogs]);

  const categories = ["All", ...Array.from(new Set(blogs.map(blog => blog.category).filter(Boolean)))];
  
  const filteredBlogs = selectedCategory === "All" 
    ? blogs 
    : blogs.filter(blog => blog.category === selectedCategory);

  const handleBlogClick = async (blog: any) => {
    // If blog has external link, open it properly (Android/iOS compatible)
    if (blog.external_link) {
      const { openExternalLink } = await import('@/lib/externalLinkHandler');
      openExternalLink(blog.external_link);
    } else {
      // Fallback to detail page if no external link
      navigate(`/blog/${blog.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">Blog</h1>
              <p className="text-sm text-gray-500">Latest insights on skincare & wellness</p>
            </div>
            <ReportButton section="Blogs" variant="icon" />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Blogs</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchBlogs}
              className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Category Filter - only show if we have blogs */}
      {!error && blogs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6 gesture-safe-bottom android-safe-container">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blog Grid */}
      {!error && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Blogs Yet</h3>
              <p className="text-gray-600">Check back soon for new content!</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No blogs found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => handleBlogClick(blog)}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
                >
                  {/* Blog Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {blog.featured_image ? (
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                        <BookOpen className="w-12 h-12 text-green-400" />
                      </div>
                    )}
                    {blog.category && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow-md">
                          {blog.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {blog.excerpt}
                    </p>

                    {/* Author & External Link Indicator */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <p className="font-medium text-gray-700">{blog.author_name || 'Plants Collective'}</p>
                        <p className="text-gray-500">
                          {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      {blog.external_link && (
                        <div className="flex items-center gap-1 text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-xs">External</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
