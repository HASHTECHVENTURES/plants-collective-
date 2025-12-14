# Deploy Skin Analyze Edge Function

This guide will help you deploy the `skin-analyze` edge function to Supabase so your app can perform real AI-powered skin analysis.

## Prerequisites

1. **Supabase Account**: Make sure you have access to your Supabase project
2. **GEMINI_API_KEY**: You need a Google Gemini API key
3. **Supabase CLI** (optional but recommended): For easier deployment

## Method 1: Deploy via Supabase Dashboard (Easiest)

### Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key or use an existing one
3. Copy the API key

### Step 2: Set Environment Variable in Supabase
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
5. Click **Save**

### Step 3: Create the Edge Function
1. In Supabase Dashboard, go to **Edge Functions**
2. Click **Create a new function**
3. Name it: `skin-analyze`
4. Copy the entire contents of `/supabase/functions/skin-analyze/index.ts`
5. Paste it into the function editor
6. Click **Deploy**

## Method 2: Deploy via Supabase CLI (Recommended)

### Step 1: Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
cd "/Users/sujalpatel/Documents/Plants Collective"
supabase link --project-ref vwdrevguebayhyjfurag
```

### Step 4: Set Environment Variable
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 5: Deploy the Function
```bash
supabase functions deploy skin-analyze
```

## Verify Deployment

After deployment, test the function:

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **skin-analyze**
3. Click **Invoke** to test (you'll need to provide test data)

Or test via your app:
1. Open your Plants Collective app
2. Go to "Know Your Skin"
3. Take/upload a photo
4. The analysis should now use real AI instead of dummy data

## Troubleshooting

### Function Not Found Error
- Make sure the function name is exactly `skin-analyze`
- Check that it's deployed in the correct Supabase project

### API Key Error
- Verify `GEMINI_API_KEY` is set in Supabase secrets
- Make sure the API key is valid and has quota remaining

### 503 Errors
- The function includes retry logic, but if you see persistent 503s, the Gemini API might be overloaded
- Wait a few minutes and try again

### Invalid Response Format
- Check the function logs in Supabase Dashboard
- Make sure the Gemini API is returning valid JSON

## What Changed

✅ **Before**: Results were random/dummy data from `backend/server.js`
✅ **After**: Results are real AI analysis using Gemini 2.0 Flash vision model

The new function:
- Analyzes actual skin images
- Provides detailed analysis (10 parameters)
- Gives personalized skincare routines
- Considers user age, location, and lifestyle


