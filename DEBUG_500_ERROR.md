# Debugging 500 Error in Skin Analyze Function

## Quick Fix Steps

### Step 1: Check Supabase Function Logs
1. Go to: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/functions/skin-analyze
2. Click **"Logs"** tab
3. Look for the most recent error - it will show the actual problem

### Step 2: Common Issues & Solutions

#### ❌ "GEMINI_API_KEY not configured"
**Solution:**
1. Go to: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/settings/functions
2. Scroll to **Secrets**
3. Check if `GEMINI_API_KEY` exists
4. If not, add it with your Gemini API key
5. **Redeploy the function** after adding the secret

#### ❌ "Gemini API error: 400" or "Invalid API key"
**Solution:**
1. Verify your API key at: https://makersuite.google.com/app/apikey
2. Make sure the key is active and has quota
3. Update the secret in Supabase if needed
4. Redeploy the function

#### ❌ "Failed to parse analysis results"
**Solution:**
- This means Gemini returned invalid JSON
- Check logs for the actual response
- Might be a model issue - try a different model

#### ❌ "AI service returned an empty response"
**Solution:**
- Content might be blocked by safety filters
- Try with different images
- Check Gemini API status

### Step 3: Test the Function Directly

You can test the function in Supabase Dashboard:
1. Go to Functions → skin-analyze
2. Click **"Invoke"** 
3. Use this test payload:
```json
{
  "userData": {
    "name": "Test User",
    "age": 25,
    "gender": "Not specified",
    "city": "",
    "state": "",
    "country": "",
    "profession": "Not specified",
    "workingTime": "Not specified",
    "acUsage": "no",
    "smoking": "non-smoker",
    "waterQuality": "good"
  },
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..." // Use a small test image
  ],
  "user_id": "test"
}
```

### Step 4: Check Browser Console
After the fix, the error message in the browser console should now show the **actual error** from the function instead of a generic message.

## What Was Fixed

✅ **Better error messages** - Frontend now shows actual error from function
✅ **Better logging** - Function logs more details
✅ **Request validation** - Better handling of malformed requests

## Next Steps

1. **Redeploy the function** with the updated code
2. **Check the logs** to see the actual error
3. **Fix the specific issue** based on the error message
4. **Test again**

The error message should now tell you exactly what's wrong!



