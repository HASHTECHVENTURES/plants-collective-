# 📱 Push Notifications Setup Guide for Android

This guide will help you set up push notifications for Android devices using Firebase Cloud Messaging (FCM).

## ✅ What's Already Done

1. ✅ Capacitor Push Notifications plugin added to `package.json`
2. ✅ Push notification service created (`pushNotificationService.ts`)
3. ✅ Database table SQL created (`SETUP_PUSH_NOTIFICATIONS.sql`)
4. ✅ Supabase Edge Function created (`send-push-notification`)
5. ✅ Admin panel updated to send push notifications

## 🔧 Setup Steps

### Step 1: Install Dependencies

```bash
cd "plants collective"
npm install
```

### Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add Android app to your project
4. Download `google-services.json`

### Step 3: Configure Android App

1. **Add google-services.json:**
   - Copy `google-services.json` to: `plants collective/android/app/`

2. **Update build.gradle:**
   - Open `plants collective/android/build.gradle`
   - Add to `buildscript.dependencies`:
     ```gradle
     classpath 'com.google.gms:google-services:4.4.0'
     ```

   - Open `plants collective/android/app/build.gradle`
   - Add at the bottom:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```

3. **Update AndroidManifest.xml:**
   - Open `plants collective/android/app/src/main/AndroidManifest.xml`
   - Add permissions (if not already present):
     ```xml
     <uses-permission android:name="android.permission.INTERNET"/>
     <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
     ```

### Step 4: Get FCM Server Key

1. In Firebase Console → Project Settings → Cloud Messaging
2. Copy the **Server Key** (not the Sender ID)
3. You'll need this for the Supabase Edge Function

### Step 5: Set Up Database

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `SETUP_PUSH_NOTIFICATIONS.sql`
3. This creates the `device_tokens` table

### Step 6: Deploy Supabase Edge Function

1. Install Supabase CLI (if not installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Set FCM Server Key as secret:
   ```bash
   supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here
   ```

5. Deploy the function:
   ```bash
   supabase functions deploy send-push-notification
   ```

### Step 7: Sync Capacitor

```bash
cd "plants collective"
npm run build
npx cap sync android
```

### Step 8: Test

1. Build and install the app on an Android device
2. Log in to the app
3. The app will automatically register for push notifications
4. Go to Admin Panel → Notifications
5. Send a test notification
6. You should receive a push notification on the Android device!

## 📋 Checklist

- [ ] Firebase project created
- [ ] `google-services.json` added to `android/app/`
- [ ] `build.gradle` files updated
- [ ] AndroidManifest.xml permissions added
- [ ] FCM Server Key obtained
- [ ] Database table created (ran SQL)
- [ ] Supabase Edge Function deployed
- [ ] FCM_SERVER_KEY secret set in Supabase
- [ ] Capacitor synced
- [ ] App tested on Android device

## 🔍 Troubleshooting

### Push notifications not working?

1. **Check device token registration:**
   - Open browser console in the app
   - Look for "Push registration success" message
   - Check Supabase `device_tokens` table for your user

2. **Check FCM Server Key:**
   - Make sure it's set correctly in Supabase secrets
   - Verify it's the Server Key, not Sender ID

3. **Check Android permissions:**
   - Make sure app has notification permission
   - Check Android Settings → Apps → Your App → Notifications

4. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for errors when sending notifications

### Device token not saving?

- Check RLS policies on `device_tokens` table
- Verify user is authenticated
- Check browser console for errors

## 🎯 How It Works

1. **User logs in** → App registers for push notifications
2. **Device token saved** → Stored in `device_tokens` table
3. **Admin sends notification** → Admin panel calls Edge Function
4. **Edge Function** → Fetches device tokens and sends via FCM
5. **User receives notification** → Shows on Android device

## 📝 Next Steps

- [ ] Add iOS push notifications (APNS)
- [ ] Add notification scheduling
- [ ] Add rich notifications (images, actions)
- [ ] Add notification analytics
