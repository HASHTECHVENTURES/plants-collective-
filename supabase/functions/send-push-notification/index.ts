/**
 * Supabase Edge Function: Send Push Notification
 * 
 * Sends push notifications to Android devices using Firebase Cloud Messaging (FCM)
 * 
 * Environment Variables Required:
 * - FCM_SERVER_KEY: Your Firebase Cloud Messaging server key
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

const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
const FCM_URL = "https://fcm.googleapis.com/fcm/send";

interface PushNotificationPayload {
  user_ids?: string[];
  title: string;
  message: string;
  data?: Record<string, any>;
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
    // Check FCM server key
    if (!FCM_SERVER_KEY) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVER_KEY not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // Only get Android tokens (for now)
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

    // Send push notifications via FCM
    const fcmPromises = deviceTokens.map(async (device) => {
      const fcmPayload = {
        to: device.device_token,
        notification: {
          title: title,
          body: message,
          sound: "default",
          priority: "high",
        },
        data: {
          ...data,
          link: data?.link || "",
        },
      };

      try {
        const response = await fetch(FCM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${FCM_SERVER_KEY}`,
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
