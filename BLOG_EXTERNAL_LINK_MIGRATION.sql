-- ============================================
-- Add external_link column to blog_posts table
-- This allows blogs to link to external URLs instead of hosting content
-- ============================================

-- Add external_link column if it doesn't exist
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.blog_posts.external_link IS 'Link to external blog post URL. If provided, users will be redirected to this URL instead of viewing content.';

-- Update existing blogs to have null external_link (they will use content)
UPDATE public.blog_posts 
SET external_link = NULL 
WHERE external_link IS NULL;
