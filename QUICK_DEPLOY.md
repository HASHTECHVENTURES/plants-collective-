# Quick Deploy Guide - Skin Analyze Function

## Option 1: Supabase Dashboard (Easiest - No CLI needed)

### Step 1: Set Environment Variable
1. Go to: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/settings/functions
2. Scroll to **Secrets** section
3. Click **Add new secret**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key (get it from https://makersuite.google.com/app/apikey)
6. Click **Save**

### Step 2: Create Function
1. Go to: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/functions
2. Click **Create a new function**
3. Function name: `skin-analyze`
4. Copy the code from: `/supabase/functions/skin-analyze/index.ts`
5. Paste into the editor
6. Click **Deploy**

Done! ✅

---

## Option 2: Using CLI (If you prefer command line)

### Step 1: Login
```bash
supabase login
```

### Step 2: Link Project
```bash
cd "/Users/sujalpatel/Documents/Plants Collective"
supabase link --project-ref vwdrevguebayhyjfurag
```

### Step 3: Set API Key
```bash
supabase secrets set GEMINI_API_KEY=your_api_key_here
```

### Step 4: Deploy
```bash
supabase functions deploy skin-analyze
```

---

## Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click **Create API Key**
4. Copy the key

---

## Verify It Works

After deployment:
1. Open your app
2. Go to "Know Your Skin"
3. Take a photo
4. You should see real AI analysis (not random data)

If you see errors, check the function logs in Supabase Dashboard.
