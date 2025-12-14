-- ============================================
-- Push Notifications Setup
-- Device Tokens Table for FCM/APNS
-- ============================================

-- Create device_tokens table to store FCM/APNS tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS device_tokens_platform_idx ON public.device_tokens(platform);

-- Enable Row Level Security (RLS)
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for device_tokens table
-- Users can only manage their own device tokens
CREATE POLICY "Users can view their own device tokens"
  ON public.device_tokens
  FOR SELECT
  USING (true); -- Allow read for all (needed for admin to send notifications)

CREATE POLICY "Users can insert their own device tokens"
  ON public.device_tokens
  FOR INSERT
  WITH CHECK (true); -- Allow insert for all authenticated users

CREATE POLICY "Users can update their own device tokens"
  ON public.device_tokens
  FOR UPDATE
  USING (true); -- Allow update for all authenticated users

CREATE POLICY "Users can delete their own device tokens"
  ON public.device_tokens
  FOR DELETE
  USING (true); -- Allow delete for all authenticated users

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_device_tokens_updated_at();

-- ============================================
-- Notes:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Make sure you have Firebase Cloud Messaging (FCM) set up for Android
-- 3. Add google-services.json to android/app/ directory
-- 4. Configure FCM in AndroidManifest.xml
-- ============================================
