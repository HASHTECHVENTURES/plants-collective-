import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Report } from '@/types';

const getSeverityColor = (severity: 'Mild' | 'Medium' | 'Severe' | 'N/A') => {
  switch (severity) {
    case 'Mild': return 'bg-yellow-400 text-yellow-800';
    case 'Medium': return 'bg-orange-400 text-orange-800';
    case 'Severe': return 'bg-red-500 text-red-100';
    default: return 'bg-green-400 text-green-800';
  }
};

const getRatingColor = (rating: number) => {
  if (rating <= 3) return 'bg-green-500';
  if (rating <= 6) return 'bg-yellow-500';
  if (rating <= 8) return 'bg-orange-500';
  return 'bg-red-500';
};

const EnhancedSkinAnalysisResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (location.state && location.state.report) {
      setReport(location.state.report);
    } else {
      // Handle case where there is no report in state (e.g., direct navigation)
      // Maybe navigate back or show an error message
      navigate('/know-your-skin');
    }
  }, [location.state, navigate]);

  if (!report) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading report...</p>
      </div>
    );
  }

  const { result, userData, date, faceImages } = report;

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top">
      <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-8" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}>
        <header className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <div className="flex items-center gap-4">
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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-teal-600">Your Skin Analysis Report</h1>
              </div>
          </div>
        </header>

        {/* Overall Summary */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Overall Summary</h2>
          <div className={`inline-block text-sm font-bold px-3 py-1 rounded-full mb-4 ${getSeverityColor(result.overallSeverity)}`}>
            Overall Concern: {result.overallSeverity}
          </div>
          <p className="text-slate-600 leading-relaxed">{result.summary}</p>
        </div>

        {/* Captured Images */}
        {faceImages && faceImages.length === 3 && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Images Used for Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {faceImages.map((image, index) => (
                  <div key={index} className="text-center">
                    <img 
                      src={image} 
                      alt={['Front Face', 'Right Side', 'Left Side'][index]} 
                      className="rounded-lg shadow-md border border-slate-200 aspect-square object-cover w-full" 
                    />
                    <p className="text-sm font-semibold text-slate-600 mt-2">
                      {['Front Face', 'Right Side', 'Left Side'][index]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
        )}

        {/* Detailed Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Detailed Analysis</h2>
          <div className="space-y-6">
            {result.parameters.map((paramData) => {
              if (!paramData) return null;
              return (
                <div key={paramData.category} className="pb-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-700 text-base">{paramData.category}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSeverityColor(paramData.severity)}`}>
                      {paramData.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${getRatingColor(paramData.rating)}`} style={{ width: `${paramData.rating * 10}%` }}></div>
                    </div>
                    <span className="font-bold text-slate-800 w-8 text-right flex-shrink-0">{paramData.rating}/10</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed break-words whitespace-normal overflow-visible min-h-[2rem]">
                    {paramData.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSkinAnalysisResultsPage;
