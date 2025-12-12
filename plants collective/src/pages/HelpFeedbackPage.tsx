import { useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/App";

const categories = [
  { value: "issue", label: "Report an issue" },
  { value: "feedback", label: "App feedback" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Other" },
];

const HelpFeedbackPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState("issue");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) {
      alert("Please enter a subject and details.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback_submissions').insert({
        user_id: user?.id || null,
        user_name: user?.name || null,
        user_email: user?.email || null,
        user_phone: user?.phone_number || null,
        category: category,
        subject: subject,
        details: details,
        status: 'new'
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40 safe-area-top nav-safe-area">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              aria-label="Go back"
              title="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-800">Help & Feedback</h1>
              <p className="text-sm text-gray-500">Tell us what you need</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6 gesture-safe-bottom android-safe-container">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">We’re here to help</h2>
              <p className="text-sm text-gray-600">
                Share issues, feedback, or feature ideas. We’ll review and get back if needed.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              Thanks for sharing! We’ve recorded your message.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the issue or feedback..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? "Sending..." : "Send"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpFeedbackPage;


