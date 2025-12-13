# 🔍 Pre-APK Build Checklist

## ✅ Critical Items (Must Fix Before APK)

### 1. Environment Variables ✅
- [x] `.env.example` created
- [x] `.env` added to `.gitignore`
- [ ] **ACTION REQUIRED**: Create `.env` file with production values
- [ ] **ACTION REQUIRED**: Verify all env vars are set before building

**Required Variables:**
```
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_GEMINI_API_KEY=your-api-key
```

### 2. Hardcoded URLs ⚠️
**Status**: Some files have hardcoded Supabase URLs as fallbacks
- `src/pages/AuthPage.tsx` - Logo URL
- `src/pages/HomePage.tsx` - Logo URL, default product image
- `src/services/geminiService.ts` - Edge function URL (has env fallback)
- `src/services/plantsCollectiveAIService.ts` - Edge function URL (has env fallback)

**Impact**: Low - These are fallbacks, but should use env vars in production
**Action**: Consider moving to env vars, but not blocking for APK

### 3. Console Logs ⚠️
**Status**: Console logs exist in code but are **automatically removed in production builds**

**Files with console logs:**
- 20 files have console.log/error statements
- ✅ **Already handled**: Vite config removes them in production
- ✅ **No action needed**: Production builds are clean

### 4. Error Tracking TODO ⚠️
**Status**: ErrorBoundary has TODO for error tracking service

**File**: `src/components/ErrorBoundary.tsx` (line 26)
```typescript
// TODO: Send to error tracking service (Sentry, Firebase Crashlytics, etc.)
```

**Impact**: Low - App still works, just no error tracking
**Action**: Optional - Can add later (Sentry, Firebase Crashlytics)

---

## ⚠️ Important Items (Should Fix)

### 5. Missing Android Folder
**Status**: Android folder doesn't exist yet (will be created on first sync)

**Action Required:**
```bash
cd "plants collective"
npm run build
npx cap sync android
```

This will create the `android/` folder.

### 6. App Icons ✅
**Status**: Icons exist in `/public`
- ✅ `icon-192.png`
- ✅ `icon-512.png`
- ✅ `app-icon.png`
- ✅ `favicon.ico`

**Action**: Verify icons are copied to Android during sync

### 7. Accessibility ⚠️
**Status**: Basic accessibility implemented

**Current:**
- ✅ Touch targets: 48px minimum
- ✅ Alt text: Most images have alt attributes
- ✅ ARIA labels: Some buttons have aria-label
- ⚠️ Screen reader: Not fully tested

**Improvements Needed (Non-blocking):**
- [ ] Add aria-labels to all interactive elements
- [ ] Test with TalkBack (Android screen reader)
- [ ] Verify color contrast ratios
- [ ] Add semantic HTML where needed

**Impact**: Low - Not blocking for APK, but improves UX

---

## 📋 Optional Items (Nice to Have)

### 8. Error Tracking Service
**Status**: Not implemented

**Options:**
- Sentry (recommended)
- Firebase Crashlytics
- LogRocket

**Action**: Optional - Can add after APK release

### 9. Analytics
**Status**: Not implemented

**Options:**
- Google Analytics
- Firebase Analytics
- Mixpanel

**Action**: Optional - Can add after APK release

### 10. Internationalization (i18n)
**Status**: English only

**Action**: Optional - Can add later based on user base

---

## ✅ Already Complete

### Code Quality ✅
- [x] Images optimized (lazy loading)
- [x] Code splitting enabled
- [x] Console logs removed in production
- [x] Error boundaries in place
- [x] Safe storage wrapper
- [x] Real-time subscriptions cleaned up

### Mobile Optimization ✅
- [x] Safe areas on all pages
- [x] Touch targets sized correctly
- [x] Gesture navigation supported
- [x] Display cutouts handled
- [x] Responsive design

### Android Configuration ✅
- [x] Capacitor configured
- [x] Production settings enabled
- [x] Security measures in place
- [x] Performance optimized
- [x] Icons and assets ready

### Build System ✅
- [x] Vite optimized
- [x] Code splitting enabled
- [x] Minification enabled
- [x] Source maps hidden
- [x] Bundle size monitored

---

## 🚀 Pre-Build Steps

### Before Running `npx cap sync android`:

1. **Create `.env` file** (if not exists)
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Verify environment variables**
   ```bash
   # Check that all required vars are set
   # VITE_SUPABASE_URL
   # VITE_SUPABASE_ANON_KEY
   # VITE_GEMINI_API_KEY
   ```

3. **Build the app**
   ```bash
   npm run build
   ```

4. **Sync Capacitor** (creates android/ folder)
   ```bash
   npx cap sync android
   ```

5. **Open in Android Studio**
   ```bash
   npm run cap:open:android
   ```

---

## ⚠️ Known Issues (Non-Blocking)

### 1. Hardcoded Fallback URLs
- Some images use hardcoded Supabase URLs
- **Impact**: Low - These are fallbacks only
- **Fix**: Move to env vars (optional)

### 2. Console Logs in Source
- Console logs exist in source code
- **Impact**: None - Removed in production builds
- **Fix**: Already handled by Vite config

### 3. Error Tracking TODO
- ErrorBoundary has TODO comment
- **Impact**: Low - App works, just no error tracking
- **Fix**: Add Sentry/Firebase (optional)

---

## ✅ Final Verification

Before building APK, verify:

- [x] Code optimized
- [x] Images lazy loaded
- [x] Mobile responsive
- [x] Android configuration ready
- [x] Security measures in place
- [x] Build successful
- [ ] **Environment variables set** ⚠️
- [ ] **Android folder synced** ⚠️

---

## 🎯 Ready to Build?

**Status**: ✅ **YES - Ready for APK build!**

**Remaining Actions:**
1. Create `.env` file with production values
2. Run `npm run build && npx cap sync android`
3. Open in Android Studio
4. Build APK

**All critical optimizations are complete!** 🚀

---

**Last Updated**: After full optimization review
**Next Step**: Create `.env` and sync Capacitor
