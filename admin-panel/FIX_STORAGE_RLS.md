# Fix Supabase Storage RLS Policy for Banner Uploads

## 🔴 Current Issue

The console shows:
```
POST https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/image/banners/...
Status: 400 (Bad Request)
Error: "new row violates row-level security policy"
```

**What's happening:**
- The admin panel tries to upload banner images to Supabase Storage bucket `image`
- The storage bucket has Row Level Security (RLS) policies that block the upload
- The code falls back to base64 encoding (which works but is inefficient)

## ✅ Solution: Fix RLS Policies

You need to create RLS policies in Supabase that allow authenticated users (or admin users) to upload files to the `image` storage bucket.

### Option 1: Allow Authenticated Users (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload files to the 'image' bucket
CREATE POLICY "Allow authenticated uploads to image bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow authenticated users to update files in the 'image' bucket
CREATE POLICY "Allow authenticated updates to image bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow authenticated users to delete files in the 'image' bucket
CREATE POLICY "Allow authenticated deletes from image bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow public read access to the 'image' bucket
CREATE POLICY "Allow public read from image bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'image');
```

### Option 2: Allow Anonymous Users (Less Secure - Only for Admin Panel)

If your admin panel uses anonymous access, use this instead:

```sql
-- Allow anonymous users to upload files to the 'image' bucket
CREATE POLICY "Allow anonymous uploads to image bucket"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow anonymous users to update files
CREATE POLICY "Allow anonymous updates to image bucket"
ON storage.objects
FOR UPDATE
TO anon
USING (
  bucket_id = 'image' AND
  (storage.foldername(name))[1] = 'banners'
);

-- Allow anonymous users to delete files
CREATE POLICY "Allow anonymous deletes from image bucket"
ON storage.objects
FOR DELETE
TO anon
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
```

### Option 3: Use Service Role Key (Most Secure - Recommended for Production)

This bypasses RLS entirely for admin operations. **Only use this in the admin panel, never expose to client-side code.**

1. **Get your Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (NOT the anon key)

2. **Create `.env` file in admin-panel:**
   ```env
   VITE_SUPABASE_URL=https://vwdrevguebayhyjfurag.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Update `admin-panel/src/lib/supabase.ts`:**
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vwdrevguebayhyjfurag.supabase.co'
   const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '...'
   const supabaseServiceRoleKey = (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY

   // Use service role key for admin operations (bypasses RLS)
   export const supabase = createClient(
     supabaseUrl, 
     supabaseServiceRoleKey || supabaseAnonKey,
     {
       auth: {
         persistSession: false, // Don't persist session for service role
         autoRefreshToken: false
       }
     }
   )
   ```

   **⚠️ WARNING:** Never commit the service role key to Git! Always use `.env` and add it to `.gitignore`.

## 📋 Steps to Fix (Choose One Option)

### For Option 1 or 2 (RLS Policies):

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script from Option 1 or Option 2 above
4. Refresh your admin panel and try uploading a banner again
5. Check the console - the error should be gone!

### For Option 3 (Service Role Key):

1. Get your service role key from Supabase Dashboard
2. Create `.env` file in `admin-panel/` directory
3. Add the service role key to `.env`
4. Update `supabase.ts` as shown above
5. Restart your dev server (`npm run dev`)
6. Try uploading a banner - it should work without RLS errors!

## ✅ Verification

After applying the fix:
- Upload a banner image
- Check the browser console
- You should see: `POST ... 200 OK` instead of `400 Bad Request`
- The image should be stored in Supabase Storage (not as base64)
- The banner should appear in your app with a proper storage URL

## 🔒 Security Notes

- **Option 1** (Authenticated users): Requires users to be logged in via Supabase Auth
- **Option 2** (Anonymous users): Less secure, allows anyone to upload
- **Option 3** (Service role): Most secure for admin panel, bypasses RLS but should ONLY be used server-side or in admin panel (never expose to public)

## 📝 Current Workaround

Currently, the code falls back to base64 encoding when storage upload fails. This works but:
- ❌ Base64 strings are ~33% larger than original files
- ❌ Stored in database instead of storage (slower queries)
- ❌ Not ideal for large images/videos

After fixing RLS, images will be stored properly in Supabase Storage! 🎉


