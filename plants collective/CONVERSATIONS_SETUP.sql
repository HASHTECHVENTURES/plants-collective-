-- ============================================
-- Plants Collective AI - Conversations & Messages Setup
-- Project ID: vwdrevguebayhyjfurag
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_is_archived_idx ON public.conversations(is_archived);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Allow public read conversations"
  ON public.conversations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update conversations"
  ON public.conversations
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete conversations"
  ON public.conversations
  FOR DELETE
  USING (true);

-- Create RLS policies for messages
CREATE POLICY "Allow public read messages"
  ON public.messages
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update messages"
  ON public.messages
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete messages"
  ON public.messages
  FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp for conversations
CREATE OR REPLACE FUNCTION public.handle_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_conversations_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.conversations TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;

-- ============================================
-- Verification queries (optional)
-- ============================================
-- SELECT * FROM public.conversations LIMIT 5;
-- SELECT * FROM public.messages LIMIT 5;


