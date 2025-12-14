# 📱 Build APK for Push Notifications

This guide will help you build an APK file to install on your Android phone and test push notifications.

## ✅ What's Already Configured

1. ✅ Push Notifications plugin installed
2. ✅ Firebase configured (`google-services.json` added)
3. ✅ Android permissions added (POST_NOTIFICATIONS, WAKE_LOCK, VIBRATE)
4. ✅ Notification service configured for lock screen
5. ✅ Edge Function deployed and ready

## 🏗️ Build APK - Step by Step

### Option 1: Build APK with Android Studio (RECOMMENDED)

#### Step 1: Open Project in Android Studio

1. Open Android Studio
2. Click **File → Open**
3. Navigate to: `/Users/sujalpatel/Documents/Plants Collective/plants collective/android`
4. Click **Open**
5. Wait for Gradle sync to complete (2-3 minutes)

#### Step 2: Build Debug APK

1. In Android Studio, click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete (2-5 minutes)
3. When done, click **locate** in the notification popup

**APK Location:**
```
/Users/sujalpatel/Documents/Plants Collective/plants collective/android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 3: Install on Your Phone

**Option A: USB Cable (Easiest)**
1. Connect your Android phone via USB
2. Enable **USB Debugging** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"
3. In Android Studio, click the **▶️ Run** button
4. Select your device from the list
5. App installs automatically!

**Option B: Transfer APK File**
1. Copy `app-debug.apk` to your phone (via USB, email, or cloud storage)
2. On your phone, open the APK file
3. Tap "Install"
4. If you see "Install blocked", go to Settings → Security → Enable "Install from Unknown Sources"
5. Tap "Install" again

---

### Option 2: Build APK with Command Line

1. Open Terminal
2. Navigate to project:
   ```bash
   cd "/Users/sujalpatel/Documents/Plants Collective/plants collective/android"
   ```
3. Build APK:
   ```bash
   ./gradlew assembleDebug
   ```
4. APK will be at:
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 🔔 Testing Push Notifications

### Step 1: Install and Setup

1. Install the APK on your phone
2. Open the app
3. Log in to your account
4. **Important:** Allow notification permissions when prompted
5. The app will automatically register for push notifications

### Step 2: Verify Token Registration

1. Go to Supabase Dashboard → Table Editor → `device_tokens`
2. You should see a new row with:
   - Your `user_id`
   - A `device_token` (long string)
   - `platform: android`
3. If you see this, registration is working! ✅

### Step 3: Send Test Notification

1. Go to Admin Panel → Notifications
2. Click "Send Notification"
3. Fill in:
   - **Title:** "Test Notification"
   - **Message:** "This is a test push notification!"
   - **Type:** Info
   - **Send To:** All Users
4. Click "Send to All"
5. **Check your phone** - you should receive a notification! 🎉

### Step 4: Test Lock Screen Notifications

1. **Lock your phone** (press power button)
2. Go to Admin Panel → Send another notification
3. **Notification should appear on lock screen!** ✅

---

## ✅ Notification Features

### What Works:

- ✅ **Foreground notifications** - When app is open
- ✅ **Background notifications** - When app is in background
- ✅ **Lock screen notifications** - When phone is locked
- ✅ **Notification sounds** - Default sound plays
- ✅ **Notification vibration** - Phone vibrates
- ✅ **Notification badge** - Shows on app icon
- ✅ **Tap to open** - Tapping notification opens app

### Notification Types from Admin Panel:

- ✅ **Info** - Blue notification
- ✅ **Promo** - Purple notification
- ✅ **Alert** - Red notification
- ✅ **Update** - Green notification

---

## 🔧 Troubleshooting

### Notifications not appearing?

1. **Check permissions:**
   - Go to Phone Settings → Apps → Plants Collective → Notifications
   - Make sure notifications are enabled
   - Check "Show on lock screen" is enabled

2. **Check device token:**
   - Verify token is saved in `device_tokens` table
   - Check browser console for registration errors

3. **Check Edge Function:**
   - Go to Supabase → Edge Functions → `send-push-notification` → Logs
   - Look for any errors when sending notifications

4. **Check Firebase:**
   - Verify `google-services.json` is in `android/app/` folder
   - Check Firebase Console → Cloud Messaging → API is enabled

### App crashes on startup?

- Check Android Studio → Logcat for error messages
- Make sure all dependencies are installed
- Try rebuilding the APK

---

## 📋 Checklist

Before testing:
- [ ] APK built successfully
- [ ] APK installed on phone
- [ ] App opened and logged in
- [ ] Notification permission granted
- [ ] Device token saved in database
- [ ] Admin panel accessible
- [ ] Test notification sent

---

## 🎯 Next Steps

After confirming notifications work:

1. **Build Release APK** (for production):
   - In Android Studio: Build → Generate Signed Bundle / APK
   - Follow signing wizard
   - Distribute to users

2. **Add Notification Channels** (optional):
   - Create custom notification channels for different types
   - Better user control over notifications

3. **Add Rich Notifications** (optional):
   - Add images to notifications
   - Add action buttons
   - Custom notification layouts

---

**Ready to build? Follow the steps above!** 🚀
