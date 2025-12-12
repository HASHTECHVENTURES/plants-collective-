import { UserData, AnalysisResult } from '../types';

// Use the deployed Edge Function; allow override via env if needed
const EDGE_FUNCTION_URL = import.meta.env.VITE_SKIN_ANALYZE_URL || "https://vwdrevguebayhyjfurag.supabase.co/functions/v1/skin-analyze";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const analyzeSkin = async (userData: UserData, faceImages: string[], userId?: string): Promise<AnalysisResult> => {
  if (!EDGE_FUNCTION_URL) {
    throw new Error("Skin analysis function URL is not configured.");
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error("Supabase anon key is not configured.");
  }

  // Append apikey as query param to satisfy Supabase gateway even if headers are blocked
  const urlWithKey = `${EDGE_FUNCTION_URL}?apikey=${SUPABASE_ANON_KEY}`;

  const resp = await fetch(urlWithKey, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      userData,
      images: faceImages,
      user_id: userId,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    let errorMessage = "Failed to analyze skin. Please try again.";
    
    try {
      // Try to parse the error response as JSON
      const errorData = JSON.parse(text);
      if (errorData.error) {
        // Use the actual error message from the function
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // If parsing fails, check if it's a readable error message
      if (text && text.length < 200 && !text.includes('{')) {
        errorMessage = text;
      }
    }
    
    // Provide user-friendly messages based on status code, but preserve actual error for 500s
    if (resp.status === 503 || resp.status === 429) {
      errorMessage = "The analysis service is temporarily busy. Please try again in a moment.";
    } else if (resp.status === 400) {
      // Keep the actual error message for 400s (validation errors)
      if (!errorMessage.includes("Invalid request")) {
        // Don't override if we already have a specific error
      } else {
        errorMessage = "Invalid request. Please check your photos and try again.";
      }
    } else if (resp.status === 401 || resp.status === 403) {
      errorMessage = "Authentication failed. Please refresh the page and try again.";
    } else if (resp.status >= 500) {
      // For 500 errors, show the actual error message from the function if available
      // This will help debug issues like "GEMINI_API_KEY not configured" etc.
      if (errorMessage === "Failed to analyze skin. Please try again.") {
        errorMessage = "The analysis service encountered an error. Please try again later.";
      }
      // Otherwise, keep the specific error message from the function
    }
    
    console.error("Skin analysis error:", {
      status: resp.status,
      errorMessage: errorMessage,
      responseText: text.substring(0, 500) // Log first 500 chars for debugging
    });
    
    throw new Error(errorMessage);
  }

  const analysis = await resp.json() as AnalysisResult;
  return analysis;
};
