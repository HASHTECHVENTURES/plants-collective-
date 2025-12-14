# 🚀 Deploy Main Website to Vercel with Auto-Deploy

This guide will help you deploy the main Plants Collective website to Vercel with automatic deployment from GitHub.

## 📋 Prerequisites

- GitHub repository: `https://github.com/HASHTECHVENTURES/plants-collective-.git`
- Vercel account (sign up at https://vercel.com if needed)
- All code committed and pushed to GitHub

## 🎯 Step 1: Connect GitHub to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in or create an account

2. **Import Your Project**
   - Click **"Add New..."** → **"Project"**
   - Click **"Import Git Repository"**
   - Select **"GitHub"** and authorize Vercel
   - Find and select: `HASHTECHVENTURES/plants-collective-`
   - Click **"Import"**

## ⚙️ Step 2: Configure Project Settings

Vercel should auto-detect the `vercel.json` configuration, but verify:

### Build Settings (Auto-detected from vercel.json):
- **Framework Preset:** Other
- **Root Directory:** `/` (root)
- **Build Command:** `cd "plants collective" && npm ci && npm run build`
- **Output Directory:** `plants collective/dist`
- **Install Command:** `cd "plants collective" && npm ci`

## 🔐 Step 3: Add Environment Variables

1. In the Vercel project settings, go to **"Environment Variables"**
2. Add these variables (copy from `vercel-env.txt`):

### Required Variables:
```
VITE_SUPABASE_URL=https://vwdrevguebayhyjfurag.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZHJldmd1ZWJheWh5amZ1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NDI1MzAsImV4cCI6MjA0OTQxODUzMH0.LLbSjiM-RCbMCQN_p8xNOqjkZLVpKnpsMtvjCpuXXm0
```

### Optional Variables (if needed):
```
VITE_ASK_PLANTS_COLLECTIVE_URL=https://vwdrevguebayhyjfurag.supabase.co/functions/v1/ask-plants-collective
VITE_SKIN_ANALYZE_URL=https://vwdrevguebayhyjfurag.supabase.co/functions/v1/skin-analyze
VITE_APP_NAME=Plants Collective
VITE_APP_VERSION=1.0.0
```

3. **Important:** Set these for **Production, Preview, and Development** environments
4. Click **"Save"**

## 🚀 Step 4: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your app
   - Deploy to production
3. Wait for deployment to complete (usually 2-3 minutes)

## ✅ Step 5: Verify Deployment

1. Once deployed, you'll get a URL like: `https://plants-collective-xxxxx.vercel.app`
2. Visit the URL and test your app
3. Check that all features work:
   - Home page loads
   - Authentication works
   - Supabase connection works
   - AI features work

## 🔄 Automatic Deployment Setup

**Good news!** Once connected, Vercel automatically deploys when you push to GitHub:

### How It Works:
1. **Make changes** to your code locally
2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. **Push to GitHub:**
   ```bash
   git push origin main
   ```
4. **Vercel automatically:**
   - Detects the push
   - Starts a new deployment
   - Builds your app
   - Deploys to production
   - Updates your live site

### Deployment Status:
- Check deployment status at: https://vercel.com/dashboard
- Each push creates a new deployment
- You can see deployment logs in real-time
- Failed deployments are marked and you'll be notified

## 🌐 Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `plantscollective.com`)
3. Follow DNS configuration instructions
4. Vercel will automatically set up SSL certificates

## 📊 Monitoring

- **Deployments:** View all deployments in the dashboard
- **Logs:** Check build and runtime logs
- **Analytics:** Enable Vercel Analytics for traffic insights
- **Notifications:** Get email/Slack notifications for deployments

## 🔧 Troubleshooting

### Build Fails:
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `vercel.json` is correct
- Check that `package.json` has correct build script

### Environment Variables Not Working:
- Make sure variables start with `VITE_` (for Vite apps)
- Redeploy after adding new variables
- Check variable names match exactly

### Deployment Not Triggering:
- Verify GitHub integration is connected
- Check that you're pushing to the correct branch (usually `main`)
- Ensure Vercel has access to your repository

## 📝 Quick Reference

**Repository:** `https://github.com/HASHTECHVENTURES/plants-collective-.git`  
**Build Command:** `cd "plants collective" && npm ci && npm run build`  
**Output Directory:** `plants collective/dist`  
**Environment Variables:** See `vercel-env.txt`

## 🎉 You're Done!

Your website is now live and will automatically update whenever you push to GitHub!

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Check deployment logs in Vercel dashboard
- Verify GitHub integration is active

