// Supabase Edge Function: skin-analyze
// Deploy this to Supabase Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { userData, images, user_id } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Build system prompt for skin analysis
    const systemPrompt = `You are an expert dermatologist and skincare AI assistant. Analyze the provided skin images and user information to provide a comprehensive skin analysis.

User Information:
- Name: ${userData.name || 'Not provided'}
- Age: ${userData.age || 'Not provided'}
- Gender: ${userData.gender || 'Not provided'}
- Location: ${userData.city || ''}, ${userData.state || ''}, ${userData.country || ''}
- Lifestyle: ${userData.profession || 'Not specified'}, AC Usage: ${userData.acUsage || 'no'}, Smoking: ${userData.smoking || 'non-smoker'}, Water Quality: ${userData.waterQuality || 'good'}

Analyze the skin images and provide a detailed analysis in the following JSON format:
{
  "summary": "A 2-3 sentence overall summary of the skin condition",
  "overallSeverity": "Mild" | "Medium" | "Severe",
  "parameters": [
    {
      "category": "Skin Type",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Texture",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Tone",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Hydration",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Pores",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Wrinkles/Fine Lines",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Dark Spots/Pigmentation",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Acne/Blemishes",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Redness/Sensitivity",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    },
    {
      "category": "Elasticity",
      "rating": 1-10,
      "severity": "Mild" | "Medium" | "Severe" | "N/A",
      "description": "Detailed description"
    }
  ],
  "routine": {
    "morning": [
      "Step 1: Cleanser recommendation",
      "Step 2: Serum recommendation",
      "Step 3: Moisturizer recommendation",
      "Step 4: Sunscreen recommendation"
    ],
    "evening": [
      "Step 1: Cleanser recommendation",
      "Step 2: Treatment product recommendation",
      "Step 3: Moisturizer recommendation"
    ]
  }
}

Important:
- Base your analysis on what you can actually see in the images
- Be honest if image quality is poor or features are unclear
- Provide specific, actionable recommendations
- Consider the user's age, lifestyle, and location in your analysis
- Return ONLY valid JSON, no additional text`;

    // Prepare images for Gemini API
    // Convert base64 images to parts
    const imageParts = images.map((image: string) => {
      // Remove data URL prefix if present
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      return {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
    });

    // Build the content for Gemini
    const contents = [
      {
        role: "user",
        parts: [
          ...imageParts,
          { text: systemPrompt }
        ]
      }
    ];

    // Call Gemini API with retry logic
    const callGeminiAPI = async (retries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: contents,
                generationConfig: {
                  temperature: 0.3,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 4096,
                  responseMimeType: "application/json",
                },
                safetySettings: [
                  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
                ],
              }),
            }
          );

          if (geminiResponse.ok) {
            return geminiResponse;
          }

          // If it's a 503 error and we have retries left, wait and retry
          if (geminiResponse.status === 503 && attempt < retries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`Gemini API returned 503, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          // If not retryable or out of retries, throw error
          const errorText = await geminiResponse.text();
          throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
        } catch (error: any) {
          if (error.message && !error.message.includes("fetch") && !error.message.includes("503")) {
            throw error;
          }
          if (attempt < retries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`Network error, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error("Unable to connect to the AI service. Please check your connection and try again.");
        }
      }
      throw new Error("Failed to generate analysis after multiple attempts.");
    };

    const geminiResponse = await callGeminiAPI();
    const geminiData = await geminiResponse.json();

    // Extract response text
    let responseText = "";
    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = geminiData.candidates[0].content.parts[0].text;
    } else {
      throw new Error("AI service returned an empty response. Please try again.");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean up the response text (remove markdown code blocks if present)
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error("Failed to parse analysis results. Please try again.");
    }

    // Validate the structure
    if (!analysisResult.summary || !analysisResult.parameters || !analysisResult.routine) {
      throw new Error("Invalid analysis result structure. Please try again.");
    }

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during skin analysis",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
