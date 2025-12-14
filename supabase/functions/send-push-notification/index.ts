/**
 * Supabase Edge Function: Send Push Notification
 * 
 * Sends push notifications to Android devices using Firebase Cloud Messaging (FCM) HTTP v1 API
 * 
 * Environment Variables Required:
 * - FCM_SERVICE_ACCOUNT_JSON: Your Firebase Service Account JSON (as string)
 * - FCM_PROJECT_ID: Your Firebase Project ID (e.g., "collectiveplants-78ad9")
 * 
 * Usage:
 * POST /functions/v1/send-push-notification
 * Body: {
 *   user_ids: string[] (optional - if not provided, sends to all users)
 *   title: string
 *   message: string
 *   data?: object (optional - custom data payload)
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") || "collectiveplants-78ad9";
const FCM_V1_URL = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

interface PushNotificationPayload {
  user_ids?: string[];
  title: string;
  message: string;
  data?: Record<string, any>;
}

// Get OAuth2 access token for FCM V1 API
async function getAccessToken(): Promise<string> {
  if (!FCM_SERVICE_ACCOUNT_JSON) {
    throw new Error("FCM_SERVICE_ACCOUNT_JSON not configured");
  }

  const serviceAccount = JSON.parse(FCM_SERVICE_ACCOUNT_JSON);
  const { private_key, client_email } = serviceAccount;

  // Create JWT for service account
  const now = Math.floor(Date.now() / 1000);
  
  // JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // JWT Payload
  const payload = {
    iss: client_email,
    sub: client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600, // 1 hour
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Base64 URL encode
  const base64UrlEncode = (obj: any) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  // Create signature (simplified - in production use proper crypto)
  // For Deno, we'll use the Web Crypto API
  const message = `${encodedHeader}.${encodedPayload}`;
  
  // Import private key and sign
  const keyData = await crypto.subtle.importKey(
    "pkcs8",
    new TextEncoder().encode(private_key.replace(/\\n/g, "\n")),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyData,
    new TextEncoder().encode(message)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const assertion = `${message}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: assertion,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Get request body
    const payload: PushNotificationPayload = await req.json();
    const { user_ids, title, message, data } = payload;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get device tokens
    let query = supabase
      .from("device_tokens")
      .select("user_id, device_token, platform");

    // Filter by user IDs if provided
    if (user_ids && user_ids.length > 0) {
      query = query.in("user_id", user_ids);
    }

    // Only get Android tokens
    query = query.eq("platform", "android");

    const { data: deviceTokens, error: tokensError } = await query;

    if (tokensError) {
      console.error("Error fetching device tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch device tokens" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No device tokens found",
          sent: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      console.error("Error getting access token:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to authenticate with FCM. Check FCM_SERVICE_ACCOUNT_JSON configuration." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send push notifications via FCM V1 API
    const fcmPromises = deviceTokens.map(async (device) => {
      // Convert data to string format (FCM v1 doesn't support nested JSON in data)
      const dataPayload: Record<string, string> = {};
      if (data) {
        Object.keys(data).forEach(key => {
          const value = data[key];
          dataPayload[key] = typeof value === 'string' ? value : JSON.stringify(value);
        });
      }

      // FCM V1 API payload structure
      // Configured for notifications to work even when phone is locked
      const fcmPayload = {
        message: {
          token: device.device_token,
          notification: {
            title: title,
            body: message,
            sound: "default",
          },
          data: dataPayload,
          android: {
            priority: "high", // High priority for immediate delivery
            notification: {
              channel_id: "default", // Default notification channel
              sound: "default",
              priority: "high",
              visibility: "public", // Show on lock screen
              default_sound: true,
              default_vibrate_timings: true,
              default_light_settings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                contentAvailable: true,
              },
            },
          },
        },
      };

      try {
        const response = await fetch(FCM_V1_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();
        return {
          user_id: device.user_id,
          device_token: device.device_token,
          success: response.ok,
          result: result,
        };
      } catch (error) {
        console.error(`Error sending to ${device.device_token}:`, error);
        return {
          user_id: device.user_id,
          device_token: device.device_token,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(fcmPromises);
    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} of ${results.length} notifications`,
        sent: successCount,
        total: results.length,
        results: results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

