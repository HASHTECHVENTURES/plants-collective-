# 🔑 Get Correct Supabase ANON_KEY

## Quick Steps:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/vwdrevguebayhyjfurag/settings/api

2. **Find the ANON_KEY:**
   - Look for **"anon" "public"** key (NOT service_role)
   - It should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Copy the ENTIRE key** (it's very long)

4. **Update in Vercel:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Find `VITE_SUPABASE_ANON_KEY`
   - Replace the value with the new key
   - Save

5. **Redeploy** (important!)

---

## Current Key in vercel-env.txt:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZHJldmd1ZWJheWh5amZ1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NDI1MzAsImV4cCI6MjA0OTQxODUzMH0.LLbSjiM-RCbMCQN_p8xNOqjkZLVpKnpsMtvjCpuXXm0
```

**Compare this with your Supabase Dashboard key - they must match exactly!**

