import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";

const CommunityPage = () => {
  const navigate = useNavigate();

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
              <h1 className="text-xl font-bold text-gray-800">Community</h1>
              <p className="text-sm text-gray-500">Connect with beauty enthusiasts</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white gesture-safe-bottom android-safe-container">
        {/* WhatsApp Community Card */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Join Our Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-sm">
              Connect with fellow beauty enthusiasts and get expert tips on our WhatsApp community.
            </p>
            <a
              href="https://chat.whatsapp.com/Ii8kAiBCdR13qEakwklCbw?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              Join WhatsApp Community
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityPage;
