import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Star, Scissors, Leaf, Users, Home, User, LogOut, X, LifeBuoy, FlaskConical, Bell } from "lucide-react";
import { useAuth } from "@/App";
import { supabase } from "@/lib/supabase";
import { notificationService } from "@/services/notificationService";
import { realtimeSyncService } from "@/services/realtimeSyncService";
import ReportButton from "@/components/ReportButton";

const HomePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notification count with real-time updates
  useEffect(() => {
    if (user?.id) {
      const fetchUnreadCount = async () => {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadNotifications(count);
      };
      
      // Initial fetch
      fetchUnreadCount();
      
      // Subscribe to real-time notification changes
      const unsubscribe = realtimeSyncService.subscribeToNotifications(user.id, (payload) => {
        // When notification is added or updated, refresh count
        if (payload.type === 'INSERT' || payload.type === 'UPDATE') {
          fetchUnreadCount();
        }
      });

      // Fallback: Still poll every 60 seconds as backup (in case real-time fails)
      const interval = setInterval(fetchUnreadCount, 60000);
      
      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [user?.id]);

  // Fetch products from Supabase with real-time updates
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products_carousel')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } else {
        // Transform Supabase data to match component structure
        const formattedProducts = (data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          image: product.media_type === 'video' ? product.video_url : product.image_url,
          link: product.product_link || '#'
        }));
        setProducts(formattedProducts.length > 0 ? formattedProducts : []);
      }
    } catch (error) {
      console.error('Error:', error);
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Subscribe to real-time product changes
    const unsubscribe = realtimeSyncService.subscribeToProducts((payload) => {
      console.log('Products real-time update received:', payload);
      // Always refresh on any change (INSERT, UPDATE, DELETE)
      // This ensures we get the latest data with proper filtering
      if (payload.type === 'INSERT' || payload.type === 'UPDATE' || payload.type === 'DELETE') {
        console.log('Refreshing products due to real-time change:', payload.type);
        // Small delay to ensure database is updated
        setTimeout(() => {
          fetchProducts();
        }, 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchProducts]);

  // Auto-move product carousel every 3 seconds
  useEffect(() => {
    if (products.length === 0) return; // Don't set interval if no products
    
    const interval = setInterval(() => {
      setCurrentProductIndex((prevIndex) => 
        prevIndex === products.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  const goToProduct = (index: number) => {
    setCurrentProductIndex(index);
  };

  // Touch/swipe functionality for products
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next product
      setCurrentProductIndex((prevIndex) => 
        prevIndex === products.length - 1 ? 0 : prevIndex + 1
      );
    } else if (isRightSwipe) {
      // Swipe right - previous product
      setCurrentProductIndex((prevIndex) => 
        prevIndex === 0 ? products.length - 1 : prevIndex - 1
      );
    }
  };

  const services = [
    {
      title: "Know Your Skin",
      icon: <Leaf className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-green-100 to-green-200",
      iconBg: "bg-green-500",
      textColor: "text-green-700",
      onClick: () => navigate("/know-your-skin")
    },
    {
      title: "Gold Meet",
      icon: <Users className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-amber-100 to-amber-200",
      iconBg: "bg-amber-500",
      textColor: "text-amber-800",
      onClick: () => navigate("/gold-meet")
    },
    {
      title: "Know Your Ingredients",
      icon: <FlaskConical className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-blue-100 to-blue-200",
      iconBg: "bg-blue-500",
      textColor: "text-blue-700",
      onClick: () => navigate("/know-your-ingredients")
    },
    {
      title: "Plants Collective AI",
      icon: <Leaf className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-green-100 to-green-200",
      iconBg: "bg-green-500",
      textColor: "text-green-700",
      onClick: () => navigate("/ask-plants-collective")
    },
    {
      title: "Community",
      icon: <Users className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-orange-100 to-orange-200",
      iconBg: "bg-orange-500",
      textColor: "text-orange-700",
      onClick: () => navigate("/community")
    },
    {
      title: "Help & Feedback",
      icon: <LifeBuoy className="w-6 h-6" />,
      bgColor: "bg-gradient-to-br from-slate-100 to-slate-200",
      iconBg: "bg-slate-600",
      textColor: "text-slate-800",
      onClick: () => navigate("/help")
    }
  ];


  return (
    <div className="min-h-screen bg-white edge-to-edge">
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-6 pb-4 safe-area-top nav-safe-area" style={{ paddingTop: 'env(safe-area-inset-top, 1.5rem)', paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))', paddingRight: 'max(1rem, env(safe-area-inset-right, 1rem))' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            title="Open menu"
            className="flex-shrink-0 z-10"
            style={{ marginLeft: 'max(0.5rem, env(safe-area-inset-left, 0.5rem))' }}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
          <img 
            src="https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/Icon.png" 
            alt="Plants Collective Logo"
            className="w-12 h-12 flex-shrink-0"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="flex items-center gap-1">
          <ReportButton section="Home" variant="icon" />
          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-1"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="page-shell">
        {/* Greeting */}
        <div className="pt-2 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Hello, {user?.name || "Riya"} 👋
          </h1>
        </div>

        {/* Product Carousel */}
        {products.length > 0 && (
          <div className="mb-8">
            <div 
              className="bg-white rounded-2xl p-4 relative overflow-hidden shadow-lg"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Product Image */}
              <div className="w-full h-64 md:h-72 lg:h-80 mb-4 relative">
                <img
                  src={products[currentProductIndex]?.image || "https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/360_F_513544427_nQPUX288GG8WkEAokc1WSD8IVZBjHMPa.jpg"}
                  alt={products[currentProductIndex]?.name || "Product"}
                  className="w-full h-full object-contain rounded-lg"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // Fallback to default image if image fails to load
                    e.currentTarget.src = "https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/360_F_513544427_nQPUX288GG8WkEAokc1WSD8IVZBjHMPa.jpg";
                  }}
                />
              </div>
              
              {/* Carousel Dots - Hidden on mobile */}
              {products.length > 1 && (
                <div className="hidden md:flex justify-center space-x-2">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToProduct(index)}
                      aria-label={`Go to product ${index + 1}`}
                      title={`Go to product ${index + 1}`}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        index === currentProductIndex ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Services</h2>
          <div className="services-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 items-stretch justify-items-stretch">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.onClick}
                className={`service-card ${service.bgColor} rounded-2xl p-4 sm:p-5 text-center h-full flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition`}
              >
                <div className={`${service.iconBg} w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto`}>
                  <div className="text-white w-full h-full flex items-center justify-center">
                    {service.icon}
                  </div>
                </div>
                <div className={`${service.textColor} font-semibold text-sm`}>
                  {service.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Blog Card Section */}
        <div className="mb-8">
          <div
            onClick={() => navigate('/blogs')}
            className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=800&h=600&fit=crop"
                alt="Blogs"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&h=600&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow-md">
                  Featured
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white text-xl font-bold mb-2 group-hover:text-green-300 transition-colors">
                  Explore Our Blog
                </h3>
                <p className="text-white text-sm opacity-90 mb-3">
                  Discover expert tips, skincare advice, and wellness insights
                </p>
                <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium group-hover:bg-green-700 transition-colors">
                  <span>View All Posts</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl safe-area-top" style={{ paddingTop: 'env(safe-area-inset-top, 1rem)', paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))', marginRight: 'max(0.5rem, env(safe-area-inset-right, 0.5rem))' }}>
                <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                  title="Close menu"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-1">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  Home
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Profile
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3 relative">
                    <Bell className="w-4 h-4 text-white" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </div>
                  Notifications
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                    <LogOut className="w-4 h-4 text-white" />
                  </div>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;