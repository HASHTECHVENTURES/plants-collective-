import { useEffect } from "react";
import { openExternalLink } from "@/lib/externalLinkHandler";

const KnowYourIngredientsPage = () => {
  useEffect(() => {
    // Redirect to Notion Labothecary page
    openExternalLink('https://lateral-biplane-a08.notion.site/Plants-Collective-s-Labothecary-22568ba9b2b680babcb7c385b8b42df8');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plants-cream via-background to-plants-light-gold">
      <div className="text-center p-8">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Opening Labothecary...</p>
      </div>
    </div>
  );
};

export default KnowYourIngredientsPage;
