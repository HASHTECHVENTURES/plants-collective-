# Deploy Skin Analyze Function - Quick Steps

Since you already have GEMINI_API_KEY set in Supabase secrets, you just need to deploy the function!

## Option 1: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/functions
2. Click **"Create a new function"** (or edit if it already exists)
3. Function name: `skin-analyze`
4. Copy the entire code from: `/supabase/functions/skin-analyze/index.ts`
5. Paste it into the editor
6. Click **"Deploy"**

✅ Done! The function will use your existing GEMINI_API_KEY secret.

---

## Option 2: Via CLI (If you're logged in)

```bash
cd "/Users/sujalpatel/Documents/Plants Collective"
supabase functions deploy skin-analyze
```

That's it! The function will automatically use the GEMINI_API_KEY secret you already set.

---

## Verify It's Working

After deployment, test it:
1. Open your app
2. Go to "Know Your Skin"
3. Take/upload a photo
4. You should see real AI analysis (not dummy data)

If you see errors, check the function logs in Supabase Dashboard.


