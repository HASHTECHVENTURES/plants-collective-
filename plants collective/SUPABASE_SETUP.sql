-- ============================================
-- Supabase Authentication & Profiles Setup
-- Project ID: vwdrevguebayhyjfurag
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (custom authentication with phone + PIN)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone_number TEXT,
  country_code TEXT,
  full_name TEXT,
  gender TEXT,
  birthdate DATE,
  country TEXT,
  state TEXT,
  city TEXT,
  avatar_url TEXT,
  pin TEXT, -- 4-digit PIN for quick access (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Allow public access for phone + PIN authentication
-- Note: In production, you may want to add additional security layers
CREATE POLICY "Allow public read"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON public.profiles
  FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone_number);

-- ============================================
-- Optional: Analysis History Table (if needed)
-- ============================================
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Allow public access for analysis history
CREATE POLICY "Allow public read analysis history"
  ON public.analysis_history
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert analysis history"
  ON public.analysis_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete analysis history"
  ON public.analysis_history
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS analysis_history_user_id_idx ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS analysis_history_created_at_idx ON public.analysis_history(created_at DESC);

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.analysis_history TO anon, authenticated;

