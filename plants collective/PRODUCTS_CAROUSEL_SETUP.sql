-- ============================================
-- Products Carousel Table Setup
-- For dynamic management of home screen product carousel
-- Supports both images and videos
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products_carousel table
CREATE TABLE IF NOT EXISTS public.products_carousel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT, -- URL for product image/photo
  video_url TEXT, -- URL for product video (optional)
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')), -- 'image' or 'video'
  product_link TEXT, -- Link to product page or external URL
  display_order INTEGER DEFAULT 0, -- Order in carousel (lower = first)
  is_active BOOLEAN DEFAULT true, -- Show/hide in carousel
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products_carousel ENABLE ROW LEVEL SECURITY;

-- Create policies for products_carousel table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read active products" ON public.products_carousel;
DROP POLICY IF EXISTS "Allow public insert" ON public.products_carousel;
DROP POLICY IF EXISTS "Allow public update" ON public.products_carousel;
DROP POLICY IF EXISTS "Allow public delete" ON public.products_carousel;

-- Allow public read access (anyone can view active products)
CREATE POLICY "Allow public read active products"
  ON public.products_carousel
  FOR SELECT
  USING (is_active = true);

-- Allow public insert (for adding products)
CREATE POLICY "Allow public insert"
  ON public.products_carousel
  FOR INSERT
  WITH CHECK (true);

-- Allow public update (for updating products)
CREATE POLICY "Allow public update"
  ON public.products_carousel
  FOR UPDATE
  USING (true);

-- Allow public delete (for removing products)
CREATE POLICY "Allow public delete"
  ON public.products_carousel
  FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_products_carousel_updated_at ON public.products_carousel;
CREATE TRIGGER update_products_carousel_updated_at
  BEFORE UPDATE ON public.products_carousel
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_products_updated_at();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS products_carousel_active_idx ON public.products_carousel(is_active);
CREATE INDEX IF NOT EXISTS products_carousel_display_order_idx ON public.products_carousel(display_order);
CREATE INDEX IF NOT EXISTS products_carousel_created_at_idx ON public.products_carousel(created_at DESC);

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.products_carousel TO anon, authenticated;

-- ============================================
-- Sample Data (Optional - you can delete this after testing)
-- ============================================
-- Uncomment below to insert sample products

/*
INSERT INTO public.products_carousel (name, description, image_url, video_url, media_type, product_link, display_order, is_active) VALUES
('Hair Treatment Oil', 'Hair care product', 'https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/product1.jpg', NULL, 'image', 'https://example.com/products/hair-oil', 1, true),
('Kumkumadi Oil', 'Skin care product', 'https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/product2.jpg', NULL, 'image', 'https://example.com/products/kumkumadi', 2, true),
('Age Redefine Serum', 'Anti-aging serum', 'https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/product3.jpg', NULL, 'image', 'https://example.com/products/serum', 3, true),
('Neem Basil Soap', 'Natural soap', 'https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/product4.jpg', NULL, 'image', 'https://example.com/products/soap', 4, true);
*/

-- ============================================
-- Useful Queries for Managing Products
-- ============================================

-- Get all active products ordered by display_order
-- SELECT * FROM public.products_carousel WHERE is_active = true ORDER BY display_order ASC, created_at DESC;

-- Add a new product
-- INSERT INTO public.products_carousel (name, description, image_url, product_link, display_order, is_active)
-- VALUES ('Product Name', 'Product description', 'https://...', 'https://...', 5, true);

-- Update a product
-- UPDATE public.products_carousel 
-- SET name = 'New Name', image_url = 'https://...', updated_at = NOW()
-- WHERE id = 'product-uuid-here';

-- Deactivate (hide) a product
-- UPDATE public.products_carousel SET is_active = false WHERE id = 'product-uuid-here';

-- Delete a product
-- DELETE FROM public.products_carousel WHERE id = 'product-uuid-here';

-- Reorder products
-- UPDATE public.products_carousel SET display_order = 1 WHERE id = 'product-uuid-here';
-- UPDATE public.products_carousel SET display_order = 2 WHERE id = 'another-uuid-here';

