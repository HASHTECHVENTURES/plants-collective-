import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, CalendarClock, Play, Search, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { realtimeSyncService } from "@/services/realtimeSyncService";
import ReportButton from "@/components/ReportButton";

type VideoItem = {
  id: string;
  title: string;
  speaker: string;
  category: string;
  date: string;
  duration: string;
  embedUrl: string;
  thumbnail: string;
  live?: boolean;
};

const GoldMeetPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time Gold Meet changes
    const unsubscribeSessions = realtimeSyncService.subscribeToGoldMeetSessions((payload) => {
      if (payload.type === 'INSERT' || payload.type === 'UPDATE' || payload.type === 'DELETE') {
        fetchData(); // Refresh when admin makes changes
      }
    });

    const unsubscribeCategories = realtimeSyncService.subscribeToGoldMeetCategories((payload) => {
      if (payload.type === 'INSERT' || payload.type === 'UPDATE' || payload.type === 'DELETE') {
        fetchData(); // Refresh when admin makes changes
      }
    });

    return () => {
      unsubscribeSessions();
      unsubscribeCategories();
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('gold_meet_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesData && categoriesData.length > 0) {
        setCategories(["All", ...categoriesData.map((c: any) => c.name)]);
      } else {
        setCategories(["All", "Skincare", "Haircare", "Nutrition", "Wellness", "Q&A"]);
      }

      // Fetch sessions
      const { data, error } = await supabase
        .from('gold_meet_sessions')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedVideos: VideoItem[] = (data || []).map((session: any) => ({
        id: session.id,
        title: session.title,
        speaker: session.speaker,
        category: session.category,
        date: session.session_date || '',
        duration: session.duration || '',
        embedUrl: session.youtube_url,
        thumbnail: session.thumbnail_url || `https://img.youtube.com/vi/default/hqdefault.jpg`,
        live: session.is_live
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to default
      setCategories(["All", "Skincare", "Haircare", "Nutrition", "Wellness", "Q&A"]);
      setVideos([{
        id: "default",
        title: "Welcome to Gold Meet",
        speaker: "Plants Collective",
        category: "Skincare",
        date: "Coming Soon",
        duration: "Live",
        embedUrl: "https://www.youtube.com/embed/AKeUssuu3Is",
        thumbnail: "https://img.youtube.com/vi/AKeUssuu3Is/hqdefault.jpg",
        live: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    const term = search.toLowerCase();
    return videos.filter((video) => {
      const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
      const matchesSearch =
        !term ||
        video.title.toLowerCase().includes(term) ||
        video.speaker.toLowerCase().includes(term) ||
        video.category.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory, videos]);

  const primaryVideo = filteredVideos[0] ?? videos[0];
  const upcoming = filteredVideos.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Daily Live & Recorded Video Sessions</h1>
            <p className="text-sm text-gray-500">Watch live sessions and recordings</p>
          </div>
          <ReportButton section="Gold Meet" variant="icon" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions, experts, topics..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? "bg-green-500 text-white border-green-500 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Youtube className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Available</h3>
            <p className="text-gray-500">Check back soon for live and recorded sessions!</p>
          </div>
        ) : primaryVideo && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="relative aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={primaryVideo.embedUrl}
                  title={primaryVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full"
                />
                {primaryVideo.live && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarClock className="w-4 h-4" />
                  <span>{primaryVideo.date}</span>
                  <span>•</span>
                  <span>{primaryVideo.duration}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{primaryVideo.title}</h2>
                <p className="text-sm text-gray-600">With {primaryVideo.speaker}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Youtube className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-semibold text-gray-900">Upcoming & Recordings</h3>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {upcoming.length === 0 && (
                  <div className="text-sm text-gray-500">No other sessions available.</div>
                )}
                {upcoming.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearch(video.title);
                    }}
                    className="w-full text-left flex gap-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/40 p-2 transition"
                  >
                    <div className="w-20 h-16 rounded-md overflow-hidden bg-gray-100 relative">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      <span className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
                        <Play className="w-5 h-5" />
                      </span>
                      {video.live && (
                        <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{video.title}</p>
                      <p className="text-xs text-gray-600">{video.speaker}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span>{video.date}</span>
                        <span>•</span>
                        <span>{video.duration}</span>
                        <span>•</span>
                        <span className="capitalize">{video.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GoldMeetPage;
