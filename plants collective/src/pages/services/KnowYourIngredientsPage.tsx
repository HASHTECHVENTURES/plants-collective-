import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { openExternalLink } from "@/lib/externalLinkHandler";

const KnowYourIngredientsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Notion Labothecary page
    openExternalLink('https://lateral-biplane-a08.notion.site/Plants-Collective-s-Labothecary-22568ba9b2b680babcb7c385b8b42df8');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-plants-cream via-background to-plants-light-gold">
      {/* Header with Back Button */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">Know Your Ingredients</h1>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Opening Labothecary...</p>
        </div>
      </div>
    </div>
  );
};

export default KnowYourIngredientsPage;
