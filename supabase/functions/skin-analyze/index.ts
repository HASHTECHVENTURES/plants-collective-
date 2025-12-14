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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError: any) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format. Please check your request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userData, images, user_id } = requestBody;

    console.log("Received request:", {
      hasUserData: !!userData,
      imageCount: images?.length || 0,
      userId: user_id
    });

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
      console.error("GEMINI_API_KEY is not set in environment variables");
      throw new Error("GEMINI_API_KEY not configured. Please set it in Supabase Edge Function secrets.");
    }

    console.log("GEMINI_API_KEY is configured (length:", GEMINI_API_KEY.length, ")");

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

    // Prepare images for Gemini API - use only the first image to avoid token limits
    // Convert base64 images to parts
    const firstImage = images[0];
    let imagePart;
    
    try {
      // Remove data URL prefix if present
      let base64Data = firstImage;
      let mimeType = "image/jpeg"; // default
      
      if (firstImage.includes(',')) {
        const parts = firstImage.split(',');
        base64Data = parts[1];
        // Detect MIME type from data URL
        const mimeMatch = parts[0].match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }
      
      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        throw new Error("Image is empty or invalid");
      }
      
      // Check image size (base64 is ~33% larger than binary)
      const imageSizeKB = (base64Data.length * 3) / 4 / 1024;
      console.log("Image size:", imageSizeKB.toFixed(2), "KB");
      
      if (imageSizeKB > 20000) { // 20MB limit
        throw new Error("Image is too large. Please use a smaller image.");
      }
      
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    } catch (imgError: any) {
      console.error("Error processing image:", imgError);
      throw new Error(`Failed to process image: ${imgError.message}`);
    }

    // Build the content for Gemini - text and image in parts array
    const contents = [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          imagePart
        ]
      }
    ];

    // Call Gemini API with retry logic
    const callGeminiAPI = async (retries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // Use gemini-2.5-flash - fast and intelligent model
          const requestBody = {
            contents: contents,
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ],
          };

          console.log("Calling Gemini 2.5 Flash API, attempt:", attempt + 1);
          console.log("Request body size:", JSON.stringify(requestBody).length, "bytes");

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            }
          );

          console.log("Gemini API response status:", geminiResponse.status);

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
          console.error("Gemini API error response:", errorText);
          
          let errorMessage = `Gemini API error: ${geminiResponse.status}`;
          
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              errorMessage = errorJson.error.message;
            } else if (errorJson.error) {
              errorMessage = JSON.stringify(errorJson.error);
            } else {
              errorMessage = errorText;
            }
          } catch {
            errorMessage = `${geminiResponse.status}: ${errorText.substring(0, 500)}`;
          }
          
          console.error("Gemini API error details:", errorMessage);
          throw new Error(errorMessage);
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

    // Check for API errors in response
    if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error);
      throw new Error(`Gemini API error: ${geminiData.error.message || JSON.stringify(geminiData.error)}`);
    }

    // Check for blocked content
    if (geminiData.candidates && geminiData.candidates[0]?.finishReason) {
      const finishReason = geminiData.candidates[0].finishReason;
      if (finishReason !== 'STOP') {
        console.error("Gemini finish reason:", finishReason);
        throw new Error(`Content was blocked or filtered. Reason: ${finishReason}`);
      }
    }

    // Extract response text
    let responseText = "";
    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = geminiData.candidates[0].content.parts[0].text;
    } else {
      console.error("Empty Gemini response:", JSON.stringify(geminiData, null, 2));
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
    console.error("Error in skin-analyze function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Return more detailed error for debugging (in production, you might want to hide some details)
    const errorMessage = error.message || "An error occurred during skin analysis";
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: process.env.DENO_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


