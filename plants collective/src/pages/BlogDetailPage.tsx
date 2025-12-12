import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User, Calendar, Share2, Heart, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  // Fetch blog post from Supabase
  const fetchBlogPost = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      
      setPost(data);
    } catch (err: any) {
      console.error('Error fetching blog post:', err);
      setError(err.message || 'Failed to load blog post. Please try again.');
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBlogPost();
    }
  }, [id]);

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/blogs')}
                aria-label="Go back"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div className="text-center flex-1">
                <h1 className="text-xl font-bold text-gray-800">Blog</h1>
              </div>
              <div className="w-10" />
            </div>
          </div>
        </div>
        
        {/* Error State */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Blog Post</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchBlogPost}
                className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => navigate('/blogs')}
                className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
              >
                Back to Blogs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-4">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/blogs')} className="bg-green-500 hover:bg-green-600">
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/blogs');
                }
              }}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-800">Blog</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                aria-label={liked ? "Unlike this post" : "Like this post"}
                title={liked ? "Unlike this post" : "Like this post"}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${liked ? 'text-red-500' : 'text-gray-600'}`}
              >
                <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share this post"
                title="Share this post"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 gesture-safe-bottom">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hero Image */}
          {post.featured_image && (
            <div className="aspect-[16/9] overflow-hidden bg-gray-100">
              <img 
                src={post.featured_image} 
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-6">
            {/* Category Badge */}
            {post.category && (
              <div className="mb-4">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  {post.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold mb-6 leading-tight text-gray-900" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: '700',
              lineHeight: '1.2'
            }}>{post.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-600">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{post.author_name}</span>
                </div>
              )}
              {post.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.published_at)}</span>
                </div>
              )}
            </div>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none">
              {post.content ? (
                <div 
                  className="text-gray-800 leading-relaxed text-base font-sans"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    lineHeight: '1.7',
                    fontSize: '16px'
                  }}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No content available for this blog post.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
