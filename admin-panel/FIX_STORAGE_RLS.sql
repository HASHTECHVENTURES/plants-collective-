-- ============================================
-- Fix Supabase Storage RLS Policies for Banner Uploads
-- Run this in Supabase SQL Editor
-- ============================================

-- Option 1: Allow Anonymous Users (For Admin Panel)
-- Use this if your admin panel uses anonymous access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads to image bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates to image bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes from image bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from image bucket" ON storage.objects;

-- Allow anonymous users to upload files to the 'image' bucket (banners folder only)
CREATE POLICY "Allow anonymous uploads to image bucket"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow anonymous users to update files in the 'image' bucket
CREATE POLICY "Allow anonymous updates to image bucket"
ON storage.objects
FOR UPDATE
TO anon
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow anonymous users to delete files in the 'image' bucket
CREATE POLICY "Allow anonymous deletes from image bucket"
ON storage.objects
FOR DELETE
TO anon
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow public read access to the 'image' bucket (so images can be displayed)
CREATE POLICY "Allow public read from image bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'image');

-- ============================================
-- Alternative: If you want to use authenticated users instead
-- (Uncomment and use this if your admin panel uses Supabase Auth)
-- ============================================

/*
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to image bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to image bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from image bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from image bucket" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to image bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to image bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from image bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow public read access
CREATE POLICY "Allow public read from image bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'image');
*/


