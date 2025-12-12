// Supabase Edge Function: ask-plants-collective
// Deploy this to Supabase Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Create Supabase client to fetch knowledge
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch knowledge documents from database
    const { data: knowledgeDocs } = await supabase
      .from("knowledge_documents")
      .select("name, category, content")
      .eq("status", "ready")
      .limit(10);

    // Build knowledge context
    let knowledgeContext = "";
    if (knowledgeDocs && knowledgeDocs.length > 0) {
      knowledgeContext = "\n\n--- KNOWLEDGE BASE ---\n";
      knowledgeDocs.forEach((doc: any) => {
        knowledgeContext += `\n[${doc.category || "General"}] ${doc.name}:\n${doc.content}\n`;
      });
      knowledgeContext += "\n--- END KNOWLEDGE BASE ---\n";
    }

    // Build system prompt
    let systemPrompt = `You are Plants Collective AI, a knowledgeable and empathetic virtual assistant specializing in skincare, haircare, beauty, and holistic wellness.

Your personality:
- Warm, friendly, and encouraging
- Professional but approachable
- Evidence-based advice with natural remedies
- Always supportive and non-judgmental

Your expertise includes:
- Skin analysis and personalized skincare routines
- Hair health and haircare solutions
- Product ingredient analysis and recommendations
- Lifestyle and wellness tips
- Natural and Ayurvedic remedies
- Beauty trends and techniques

Guidelines:
- Give concise, helpful answers (2-4 paragraphs max)
- Use bullet points for lists
- Personalize based on user context when available
- Recommend consulting a dermatologist for serious concerns
- Be encouraging and positive
- Use emojis sparingly for warmth 🌿
${knowledgeContext}`;

    // Add user context if available
    if (userContext) {
      systemPrompt += "\n\nUser Information:";
      if (userContext.name) systemPrompt += `\n- Name: ${userContext.name}`;
      if (userContext.gender) systemPrompt += `\n- Gender: ${userContext.gender}`;
      if (userContext.age) systemPrompt += `\n- Age: ${userContext.age}`;
      if (userContext.skinType) systemPrompt += `\n- Skin Type: ${userContext.skinType}`;
      systemPrompt += "\n\nPersonalize your responses based on this information.";
    }

    // Build conversation history for context
    const messages: any[] = [];
    
    if (conversationHistory && conversationHistory.length > 0) {
      // Get last 6 messages for context
      const recentHistory = conversationHistory.slice(-6);
      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.is_user_message ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current user message
    messages.push({
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
        contents: messages,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      };

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    const startTime = Date.now();

    // Call Gemini API with retry logic
    const geminiResponse = await callGeminiAPI();

    const geminiData = await geminiResponse.json();
    const responseTime = Date.now() - startTime;

    // Extract response text
    let responseText = "";
    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts) {
      responseText = geminiData.candidates[0].content.parts
        .map((part: any) => part.text)
        .join("");
    }

    if (!responseText) {
      responseText = "I apologize, but I couldn't generate a response. Please try asking your question again.";
    }

    // Clean up response
    responseText = responseText
      .replace(/\*\*\*+/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return new Response(
      JSON.stringify({
        text: responseText,
        metadata: {
          model: "gemini-1.5-flash",
          response_time: responseTime,
          knowledge_docs_used: knowledgeDocs?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    const errorMessage = error.message || "An error occurred while processing your request.";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
