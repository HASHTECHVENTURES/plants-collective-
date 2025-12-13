import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

interface ReportButtonProps {
  section: string;  // e.g., "Home", "Gold Meet", "Skin Analysis", etc.
  context?: string; // Additional context like video ID, blog ID, etc.
  variant?: 'icon' | 'text' | 'floating';
  className?: string;
}

const reportReasons = [
  { value: 'bug', label: '🐛 Bug / Error' },
  { value: 'content', label: '📝 Wrong Content' },
  { value: 'loading', label: '⏳ Loading Issue' },
  { value: 'crash', label: '💥 App Crashed' },
  { value: 'ui', label: '🎨 UI Problem' },
  { value: 'other', label: '❓ Other' },
];

export const ReportButton = ({ section, context, variant = 'icon', className = '' }: ReportButtonProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('bug');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback_submissions').insert({
        user_id: user?.id || null,
        user_name: user?.name || null,
        user_email: user?.email || null,
        user_phone: user?.phone_number || null,
        category: 'issue',
        subject: `[${section}] ${reportReasons.find(r => r.value === reason)?.label || reason}`,
        details: `Section: ${section}\nReason: ${reason}\nContext: ${context || 'N/A'}\n\nDetails:\n${details || 'No description provided'}`,
        status: 'new'
      });

      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setDetails('');
        setReason('bug');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const buttonContent = () => {
    switch (variant) {
      case 'text':
        return (
          <button
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors ${className}`}
          >
            <Flag className="w-4 h-4" />
            Report Issue
          </button>
        );
      case 'floating':
        return (
          <button
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-20 right-4 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors z-40 ${className}`}
            aria-label="Report an issue"
          >
            <Flag className="w-5 h-5" />
          </button>
        );
      default:
        return (
          <button
            onClick={() => setIsOpen(true)}
            className={`p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ${className}`}
            aria-label="Report an issue"
            title="Report an issue"
          >
            <Flag className="w-4 h-4" />
          </button>
        );
    }
  };

  const modal = isOpen ? (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Report Issue</h3>
              <p className="text-xs text-gray-500">{section}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Report Submitted!</h4>
              <p className="text-gray-500 text-sm">Thank you for helping us improve.</p>
            </div>
          ) : (
            <>
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's the issue?</label>
                <div className="grid grid-cols-2 gap-2">
                  {reportReasons.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={`p-3 rounded-xl text-sm text-left transition-all ${
                        reason === r.value
                          ? 'bg-red-50 border-2 border-red-500 text-red-700'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the issue
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What happened? What were you trying to do?"
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {buttonContent()}
      {createPortal(modal, document.body)}
    </>
  );
};

export default ReportButton;
