# 🔧 Fix Database Connection Error

## Problem
You're seeing "Database connection error" when trying to sign in. This means the Supabase environment variables aren't being loaded properly.

## ✅ Solution Steps

### Step 1: Verify Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Verify these variables exist:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Make sure they're set for **Production** environment

### Step 2: Redeploy After Adding Variables

**IMPORTANT:** After adding/changing environment variables, you MUST redeploy!

1. Go to **Deployments** tab in Vercel
2. Find your latest deployment
3. Click the **"..."** menu (three dots)
4. Click **"Redeploy"**
5. Wait for deployment to complete

**OR** simply push a new commit to trigger auto-deploy:
```bash
git commit --allow-empty -m "Redeploy with env vars"
git push origin main
```

### Step 3: Verify Variables Are Correct

Double-check these exact values:

**VITE_SUPABASE_URL:**
```
https://vwdrevguebayhyjfurag.supabase.co
```

**VITE_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZHJldmd1ZWJheWh5amZ1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NDI1MzAsImV4cCI6MjA0OTQxODUzMH0.LLbSjiM-RCbMCQN_p8xNOqjkZLVpKnpsMtvjCpuXXm0
```

### Step 4: Check Browser Console

1. Open your deployed website
2. Press `F12` or right-click → "Inspect"
3. Go to **Console** tab
4. Look for errors like:
   - "Supabase env vars missing"
   - Network errors
   - CORS errors

### Step 5: Test Supabase Connection

1. Go to: https://vwdrevguebayhyjfurag.supabase.co
2. Verify the Supabase project is active
3. Check if the `profiles` table exists

## 🔍 Common Issues

### Issue 1: Variables Not Set for Production
- **Fix:** Make sure variables are set for "Production" environment (not just Preview/Development)

### Issue 2: Typo in Variable Names
- **Fix:** Variable names must be EXACT:
  - ✅ `VITE_SUPABASE_URL` (correct)
  - ❌ `VITE_SUPABASEURL` (wrong - missing underscore)
  - ❌ `VITE_SUPABASE-URL` (wrong - dash instead of underscore)

### Issue 3: Not Redeployed After Adding Variables
- **Fix:** Always redeploy after adding environment variables

### Issue 4: Supabase Project Issues
- **Fix:** Verify your Supabase project is active and the URL is correct

## 🚀 Quick Fix Command

If you want to trigger a redeploy via Git:

```bash
cd "/Users/sujalpatel/Documents/Plants Collective"
git commit --allow-empty -m "Redeploy with environment variables"
git push origin main
```

This will trigger Vercel to redeploy with the environment variables you've already set.

## ✅ Verification Checklist

- [ ] Environment variables are set in Vercel
- [ ] Variables are set for Production environment
- [ ] Deployment was done AFTER adding variables
- [ ] Variable names are correct (no typos)
- [ ] Supabase project is active
- [ ] Browser console shows no errors

## 📞 Still Not Working?

If the error persists:
1. Check Vercel deployment logs for build errors
2. Check browser console for specific error messages
3. Verify Supabase project is accessible
4. Try redeploying again

---

**Most Common Fix:** Redeploy after adding environment variables! 🎯

