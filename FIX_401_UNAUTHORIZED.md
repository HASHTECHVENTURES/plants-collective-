# 🔧 Fix 401 Unauthorized Error

## Problem
You're seeing `401 (Unauthorized)` errors when trying to access the `profiles` table. This means:
- ✅ Supabase connection is working (URL is correct)
- ❌ Authentication/authorization is failing

## 🔍 Root Causes

1. **Wrong ANON_KEY** - The key in Vercel doesn't match your Supabase project
2. **Missing RLS Policies** - Row Level Security policies aren't set up correctly
3. **API Key Permissions** - The anon key doesn't have the right permissions

## ✅ Solution Steps

### Step 1: Verify Your ANON_KEY

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag
2. Go to **Settings** → **API**
3. Find **"anon" "public"** key
4. Copy the **exact** key

### Step 2: Update Vercel Environment Variable

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Find `VITE_SUPABASE_ANON_KEY`
3. **Delete** the old value
4. **Paste** the new key from Supabase Dashboard
5. Make sure it's set for **Production** environment
6. **Save**

### Step 3: Set Up RLS Policies (If Not Done)

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update" ON public.profiles;

-- Create policies for profiles table
-- Allow public read (for login/signup checks)
CREATE POLICY "Allow public read"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow public insert (for signup)
CREATE POLICY "Allow public insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow public update (for profile updates)
CREATE POLICY "Allow public update"
  ON public.profiles
  FOR UPDATE
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
```

### Step 4: Verify API Key Permissions

1. In Supabase Dashboard → **Settings** → **API**
2. Make sure **"anon" "public"** key is enabled
3. Check that **"Enable RLS"** is enabled for your project

### Step 5: Redeploy After Fixing

After updating the ANON_KEY in Vercel:

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

**OR** push a commit:
```bash
git commit --allow-empty -m "Fix Supabase ANON_KEY"
git push origin main
```

## 🔍 How to Check Your Current ANON_KEY

### In Vercel:
1. Go to Project → Settings → Environment Variables
2. Check the value of `VITE_SUPABASE_ANON_KEY`

### In Supabase:
1. Go to https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/settings/api
2. Find **"anon" "public"** key
3. Compare with Vercel value

**They should match exactly!**

## ✅ Quick Fix Checklist

- [ ] Get ANON_KEY from Supabase Dashboard
- [ ] Update `VITE_SUPABASE_ANON_KEY` in Vercel
- [ ] Verify RLS policies are set up (run SQL above)
- [ ] Redeploy the application
- [ ] Test login again

## 🚨 Common Mistakes

1. **Copying wrong key** - Make sure you copy the **"anon" "public"** key, not the service_role key
2. **Extra spaces** - Make sure there are no spaces before/after the key
3. **Not redeploying** - Always redeploy after changing environment variables
4. **Wrong environment** - Make sure variables are set for **Production**

## 📞 Still Not Working?

If you still get 401 errors after:
1. Verifying the ANON_KEY matches
2. Setting up RLS policies
3. Redeploying

Check:
- Supabase project is active (not paused)
- API key hasn't been rotated/changed
- Browser console for specific error messages
- Vercel deployment logs for build errors

---

**Most Common Fix:** Update the ANON_KEY in Vercel to match your Supabase Dashboard! 🎯

