# ✅ Quick Deploy Checklist - Main Website

## Before Deploying

- [x] `vercel.json` is configured correctly
- [x] GitHub repository is connected: `HASHTECHVENTURES/plants-collective-`
- [ ] All code changes are committed
- [ ] Code is pushed to GitHub

## Vercel Setup (One-Time)

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click "Add New..." → "Project"
3. [ ] Import: `HASHTECHVENTURES/plants-collective-`
4. [ ] Verify build settings (auto-detected from vercel.json):
   - Build Command: `cd "plants collective" && npm ci && npm run build`
   - Output Directory: `plants collective/dist`
5. [ ] Add Environment Variables (from `vercel-env.txt`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ASK_PLANTS_COLLECTIVE_URL` (optional)
   - `VITE_SKIN_ANALYZE_URL` (optional)
6. [ ] Click "Deploy"

## After First Deploy

- [ ] Test the deployed website
- [ ] Verify all features work
- [ ] Check environment variables are working

## Automatic Deployment (Already Set Up!)

Once connected, every time you:
1. Make changes locally
2. Commit: `git commit -m "your message"`
3. Push: `git push origin main`

Vercel will **automatically**:
- ✅ Detect the push
- ✅ Build your app
- ✅ Deploy to production
- ✅ Update your live site

**No manual steps needed!** 🎉

## Quick Commands

```bash
# Make changes, then:
git add .
git commit -m "Update website"
git push origin main

# Vercel automatically deploys! ✨
```

## Troubleshooting

- **Build fails?** Check Vercel deployment logs
- **Env vars not working?** Make sure they start with `VITE_` and are set for Production
- **Not deploying?** Verify GitHub integration in Vercel project settings

---

**Your website will auto-deploy on every push to GitHub!** 🚀

