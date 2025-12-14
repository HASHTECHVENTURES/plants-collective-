import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import PhotoCapture from "../../components/PhotoCapture";
import { analyzeSkin } from "../../services/geminiService";
import { useAuth } from "../../App";
import { UserData, Report } from "../../types";
import { storage } from "@/lib/config";

const KnowYourSkinPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<any | undefined>(undefined);
  const [localMode, setLocalMode] = useState<'camera' | 'analyzing' | 'error'>('camera');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        setUserProfile(user);
      }
      setLoadingProfile(false);
    };

    initialize();
  }, [user]);

  const useLocalMcq = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get('local') === '1' || !import.meta.env.VITE_KNOW_YOUR_SKIN_URL;
  }, [location.search]);

  const src = useMemo(() => {
    const base = import.meta.env.VITE_KNOW_YOUR_SKIN_URL || "";
    let params = new URLSearchParams();
    try {
      const raw = storage.get('plants-collective-user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name) params.set('name', u.name);
        if (u.gender) params.set('gender', u.gender);
        if (u.birthdate) {
          const years = Math.floor((Date.now() - new Date(u.birthdate).getTime()) / (365.25*24*60*60*1000));
          if (!isNaN(years)) params.set('age', String(years));
        }
        if (u.country) params.set('country', u.country);
        if (u.state) params.set('state', u.state);
        if (u.city) params.set('city', u.city);
      }
    } catch {}
    // Start step based on local mode when using local fallback, else default to MCQ
    if (!params.has('start')) params.set('start', useLocalMcq ? (localMode === 'camera' ? 'camera' : 'mcq') : 'mcq');
    const qs = params.toString();
    return base ? (qs ? `${base}?${qs}` : base) : "";
  }, [useLocalMcq, localMode]);

  const handleAnalysis = async (images: string[]) => {
    if (!userProfile) {
      setError("User data is missing.");
      setLocalMode('error');
      return;
    }

    setLocalMode('analyzing');

    try {
      const birthdate = userProfile.birthdate || userProfile.date_of_birth;
      if (!birthdate) {
        throw new Error("Birthdate is missing from user profile.");
      }
      
      const age = Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      const userDataForApi: UserData = {
        name: userProfile.name || 'Anonymous',
        age: age,
        gender: userProfile.gender || 'Not specified',
        city: userProfile.city || '',
        state: userProfile.state || '',
        country: userProfile.country || '',
        profession: 'Not specified',
        workingTime: 'Not specified',
        acUsage: 'no',
        smoking: 'non-smoker',
        waterQuality: 'good',
      };

      const result = await analyzeSkin(userDataForApi, images, userProfile.id);

      const report: Report = {
        id: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        result,
        userData: userDataForApi,
        faceImages: images,
      };
      
      navigate('/skin-analysis-results', { state: { report } });

    } catch (err) {
      console.error("Analysis failed:", err);
      
      // Extract and clean error message
      let errorMessage = "An error occurred while analyzing your skin. Please try again.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Clean up technical error messages
        errorMessage = errorMessage
          .replace(/Failed to analyze skin via Edge Function\./g, '')
          .replace(/Error processing request/g, 'An error occurred while processing your request')
          .replace(/\{[\s\S]*?"message"[\s\S]*?"([^"]+)"[\s\S]*?\}/g, '$1')
          .trim();
        
        // If error message is too technical or long, use a generic one
        if (errorMessage.length > 150 || errorMessage.includes('fetch') || errorMessage.includes('network')) {
          errorMessage = "Unable to connect to the analysis service. Please check your internet connection and try again.";
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Ensure we have a user-friendly message
      if (!errorMessage || errorMessage.length === 0) {
        errorMessage = "An error occurred while analyzing your skin. Please try again.";
      }
      
      setError(errorMessage);
      setLocalMode('error');
    }
  };

  const renderContent = () => {
    if (loadingProfile) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <LoaderCircle className="w-16 h-16 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-600">Loading user profile...</p>
        </div>
      );
    }

    switch (localMode) {
      case 'camera':
        return <PhotoCapture onComplete={handleAnalysis} />;
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <LoaderCircle className="w-16 h-16 text-teal-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Analyzing Your Skin...</h2>
            <p className="text-slate-600 mt-2">This may take a moment. Our AI is looking at your photos and information.</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-2xl font-bold text-red-700 mb-2">Analysis Failed</h2>
            <p className="text-red-600 mt-2 mb-4">{error || "Error processing request"}</p>
            <button 
              onClick={() => {
                setError(null);
                setLocalMode('camera');
              }} 
              className="mt-4 bg-red-500 text-white font-semibold py-2 px-6 rounded-full hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return <PhotoCapture onComplete={handleAnalysis} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
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
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Know Your Skin</h1>
          </div>
        </div>
      </div>

      {useLocalMcq ? (
        <div className="max-w-4xl mx-auto px-4 py-6 gesture-safe-bottom android-safe-container">
          {renderContent()}
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-60px)]">
          <iframe
            title="Know Your Skin"
            src={src}
            className="w-full h-full border-0"
            allow="camera; microphone; clipboard-read; clipboard-write"
          />
        </div>
      )}
    </div>
  );
};

export default KnowYourSkinPage;