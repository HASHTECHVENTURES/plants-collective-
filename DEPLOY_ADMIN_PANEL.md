# 🚀 Deploy Admin Panel to Vercel

This guide will help you deploy the Plants Collective Admin Panel to Vercel as a separate project.

## 📋 Prerequisites

- GitHub repository: `https://github.com/HASHTECHVENTURES/plants-collective-.git`
- Vercel account (same as main website)
- All code committed and pushed to GitHub

## 🎯 Step 1: Create New Vercel Project for Admin Panel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Your Repository**
   - Click **"Import Git Repository"**
   - Select **"GitHub"** (if not already connected)
   - Find and select: `HASHTECHVENTURES/plants-collective-`
   - Click **"Import"**

## ⚙️ Step 2: Configure Project Settings

### Important: Set Root Directory

1. In the project configuration, click **"Configure Project"**
2. Find **"Root Directory"** setting
3. Click **"Edit"**
4. Select: `admin-panel`
5. Click **"Continue"**

### Build Settings (Auto-detected from vercel.json):
- **Framework Preset:** Vite
- **Root Directory:** `admin-panel`
- **Build Command:** `npm ci && npm run build` (from admin-panel/vercel.json)
- **Output Directory:** `dist` (from admin-panel/vercel.json)
- **Install Command:** `npm ci`

## 🔐 Step 3: Add Environment Variables

1. In the Vercel project settings, go to **"Environment Variables"**
2. Add these variables (copy from `vercel-env-admin.txt`):

### Required Variables:

**VITE_SUPABASE_URL:**
```
https://vwdrevguebayhyjfurag.supabase.co
```

**VITE_SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZHJldmd1ZWJheWh5amZ1cmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDc4MzgsImV4cCI6MjA3NzQyMzgzOH0.piXThvjmumPEOtyC63p3IlPyfC2rrWl7WqNesh5AbVI
```

3. **Important:** Set these for **Production, Preview, and Development** environments
4. Click **"Save"**

## 🚀 Step 4: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your admin panel
   - Deploy to production
3. Wait for deployment to complete (usually 2-3 minutes)

## ✅ Step 5: Verify Deployment

1. Once deployed, you'll get a URL like: `https://admin-panel-xxxxx.vercel.app`
2. Visit the URL and test:
   - Login page loads
   - Can log in with admin credentials
   - Dashboard works
   - Supabase connection works

## 🔄 Automatic Deployment Setup

**Good news!** Once connected, Vercel automatically deploys when you push to GitHub:

### How It Works:
1. **Make changes** to admin panel code
2. **Commit changes:**
   ```bash
   git add admin-panel/
   git commit -m "Update admin panel"
   ```
3. **Push to GitHub:**
   ```bash
   git push origin main
   ```
4. **Vercel automatically:**
   - Detects the push
   - Starts a new deployment
   - Builds your admin panel
   - Deploys to production

## 🌐 Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `admin.plantscollective.com`)
3. Follow DNS configuration instructions
4. Vercel will automatically set up SSL certificates

## 📊 Project Structure

Your Vercel setup:
- **Main Website:** `plants-collective.vercel.app` (from root vercel.json)
- **Admin Panel:** `admin-panel-xxxxx.vercel.app` (from admin-panel/vercel.json)

Both projects deploy from the same GitHub repo but use different:
- Root directories
- Build commands
- Environment variables

## 🔧 Troubleshooting

### Build Fails:
- Check build logs in Vercel dashboard
- Verify Root Directory is set to `admin-panel`
- Ensure all environment variables are set
- Check that `admin-panel/vercel.json` exists

### Environment Variables Not Working:
- Make sure variables start with `VITE_` (for Vite apps)
- Redeploy after adding new variables
- Check variable names match exactly

### Wrong Project Deploying:
- Verify Root Directory is set to `admin-panel` (not root)
- Check that you're deploying the correct Vercel project

## 📝 Quick Reference

**Repository:** `https://github.com/HASHTECHVENTURES/plants-collective-.git`  
**Root Directory:** `admin-panel`  
**Build Command:** `npm ci && npm run build`  
**Output Directory:** `dist`  
**Environment Variables:** See `vercel-env-admin.txt`

## 🎉 You're Done!

Your admin panel is now live and will automatically update whenever you push to GitHub!

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Check deployment logs in Vercel dashboard
- Verify GitHub integration is active
