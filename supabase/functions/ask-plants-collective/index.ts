import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory, userContext } = await req.json();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "userMessage is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch knowledge documents from admin panel
    let knowledgeContext = "";
    let knowledgeDocsUsed: string[] = [];
    try {
      const { data: knowledgeDocs, error } = await supabase
        .from("knowledge_documents")
        .select("name, category, content")
        .eq("status", "ready")
        .limit(10);

      console.log("Knowledge docs fetched:", knowledgeDocs?.length || 0);

      if (!error && knowledgeDocs && knowledgeDocs.length > 0) {
        knowledgeContext = "\n\n--- PLANTS COLLECTIVE KNOWLEDGE BASE ---\n";
        knowledgeContext += "Use this information to answer user questions accurately:\n";
        knowledgeDocs.forEach((doc: any) => {
          knowledgeContext += `\n[${doc.category || "General"}] ${doc.name}:\n${doc.content}\n`;
          knowledgeDocsUsed.push(doc.name);
        });
        knowledgeContext += "\n--- END KNOWLEDGE BASE ---\n";
      }
    } catch (e) {
      console.log("Could not fetch knowledge docs:", e);
    }

    // Build system prompt
    let systemPrompt = `You are Plants Collective AI, a friendly and knowledgeable assistant for the Plants Collective app. 

Your expertise includes:
- Plant care and gardening tips
- Ayurvedic and natural remedies
- Skincare using natural ingredients
- Health and wellness advice
- Sustainable living practices

Guidelines:
- Be warm, friendly, and conversational
- Provide accurate, helpful information
- When discussing health topics, remind users to consult healthcare professionals for serious concerns
- Use emojis sparingly to be friendly 🌿
- Keep responses concise but informative
- If you don't know something, be honest about it
${knowledgeContext}`;

    // Add user context if available
    if (userContext) {
      systemPrompt += `\n\nUser Context:`;
      if (userContext.name) systemPrompt += `\n- User's name: ${userContext.name}`;
      if (userContext.location) systemPrompt += `\n- Location: ${userContext.location}`;
      if (userContext.preferences) systemPrompt += `\n- Preferences: ${userContext.preferences}`;
    }

    // Build conversation history for Gemini
    const contents: any[] = [];
    
    // Add recent conversation history (last 10 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    // Helper function to parse Gemini API error
    const parseGeminiError = (errorText: string, status: number): string => {
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          return errorJson.error.message;
        }
        if (errorJson.error?.code === 503) {
          return "The AI service is temporarily overloaded. Please try again in a moment.";
        }
        return errorJson.error?.message || errorText;
      } catch {
        // If parsing fails, return user-friendly message based on status
        if (status === 503) {
          return "The AI service is temporarily overloaded. Please try again in a moment.";
        }
        if (status === 429) {
          return "Too many requests. Please wait a moment and try again.";
        }
        if (status === 400) {
          return "Invalid request. Please check your input and try again.";
        }
        return "An error occurred while generating the response. Please try again.";
      }
    };

    // Helper function to call Gemini API with retry logic
    const callGeminiAPI = async (retries = 2): Promise<Response> => {
      const requestBody = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      };

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            }
          );

          if (geminiResponse.ok) {
            return geminiResponse;
          }

          // If it's a 503 error and we have retries left, wait and retry
          if (geminiResponse.status === 503 && attempt < retries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
            console.log(`Gemini API returned 503, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          // If not retryable or out of retries, throw error
          const errorText = await geminiResponse.text();
          const userFriendlyError = parseGeminiError(errorText, geminiResponse.status);
          throw new Error(userFriendlyError);
        } catch (error: any) {
          // If it's our custom error, re-throw it
          if (error.message && !error.message.includes("fetch")) {
            throw error;
          }
          // If it's a network error and we have retries, try again
          if (attempt < retries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`Network error, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          // Out of retries, throw error
          throw new Error("Unable to connect to the AI service. Please check your connection and try again.");
        }
      }

      throw new Error("Failed to generate response after multiple attempts.");
    };

    // Call Gemini API with retry logic
    const geminiResponse = await callGeminiAPI();

    const geminiData = await geminiResponse.json();

    // Extract response text
    let responseText = "";
    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = geminiData.candidates[0].content.parts[0].text;
    } else {
      responseText = "I apologize, but I couldn't generate a response. Please try again.";
    }

    // Clean up response
    responseText = responseText.trim();

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        model: "gemini-2.5-flash",
        timestamp: new Date().toISOString(),
        knowledgeUsed: knowledgeDocsUsed,
        knowledgeCount: knowledgeDocsUsed.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});



