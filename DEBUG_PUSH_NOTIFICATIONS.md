# 🔍 Debug Push Notifications Not Working on Phone

## ✅ What's Working
- Admin panel button works
- Edge Function is being called (200 OK in Network tab)
- Notification is saved to database

## ❌ What's Not Working
- Permission popup didn't appear
- Push notifications not received on phone
- Notifications not showing on lock screen

---

## Step 1: Check if Device Token is Registered

**Go to Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** → `device_tokens`
4. Check if there are any rows

**If NO rows exist:**
- ❌ Device token was never registered
- The app might not have initialized push notifications
- **Solution:** See Step 2

**If rows exist:**
- ✅ Device token is registered
- Move to Step 3

---

## Step 2: Make Sure App is Installed and User is Logged In

**On your Android phone:**

1. **Install the latest APK**
   - Make sure you have the APK with push notification code
   - If you built it before adding push notifications, rebuild it

2. **Open the app**

3. **Log in to your account**
   - Push notifications only initialize when user logs in
   - Check the app console/logs for:
     - `✅ Push notifications initialized`
     - `Push registration success, token: ...`
     - `✅ Device token saved to database`

4. **Wait 5-10 seconds** after login
   - The permission popup should appear
   - If it doesn't, see Step 4

5. **Check Supabase again**
   - Go back to `device_tokens` table
   - You should see a new row with your `user_id` and `device_token`

---

## Step 3: Check Edge Function Logs

**In Supabase Dashboard:**
1. Go to **Edge Functions** → `send-push-notification`
2. Click **"Logs"** tab
3. Send a test notification from admin panel
4. Check the logs for:

**✅ Success:**
```
✅ Successfully sent push notification to 1 device(s)
```

**❌ Errors to look for:**
- `FCM_SERVICE_ACCOUNT_JSON not configured` → Service Account JSON missing
- `Failed to get access token` → Service Account JSON invalid
- `No device tokens found` → Device token not registered (go back to Step 2)
- `Failed to send FCM message` → FCM error (check Service Account JSON)

---

## Step 4: Check Phone Settings

**On your Android phone:**

1. **Settings** → **Apps** → **Plants Collective**
2. Click **Notifications**
3. Make sure:
   - ✅ **Notifications** toggle is **ON**
   - ✅ **Show on lock screen** is enabled
   - ✅ **Sound** is enabled
   - ✅ **Vibration** is enabled

4. **Settings** → **Apps** → **Plants Collective** → **Permissions**
   - Make sure **Notifications** permission is **Allowed**

---

## Step 5: Check App Console Logs

**If you have Android Studio or ADB:**

1. Connect phone via USB
2. Enable USB debugging
3. Run: `adb logcat | grep -i "push\|notification\|fcm"`
4. Open the app and log in
5. Look for:
   - `Push registration success`
   - `Device token saved`
   - `Push notification received`

---

## Step 6: Rebuild APK with Latest Code

**If device token is not being saved:**

1. Make sure you have the latest code:
   ```bash
   cd "plants collective"
   git pull
   ```

2. Rebuild the APK:
   ```bash
   npm run build
   npx cap sync android
   ```
   Then build in Android Studio or:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. Install the new APK on your phone

4. **Uninstall the old app first** (to clear cache)

5. Install the new APK

6. Log in again

---

## Step 7: Test Edge Function Directly

**In Supabase Dashboard:**
1. Go to **Edge Functions** → `send-push-notification`
2. Click **"Invoke"** tab
3. Use this test payload:
   ```json
   {
     "user_ids": ["YOUR_USER_ID_HERE"],
     "title": "Test Notification",
     "message": "This is a test",
     "data": {
       "type": "info",
       "link": "",
       "notification_id": "test"
     }
   }
   ```
4. Replace `YOUR_USER_ID_HERE` with your actual user ID from `profiles` table
5. Click **"Invoke"**
6. Check the response and logs

---

## Common Issues

### Issue 1: Permission Popup Not Appearing
**Cause:** App might not be detecting it's running on Android
**Fix:** Make sure you're running the APK, not the web version

### Issue 2: Device Token Not Saved
**Cause:** User not logged in, or initialization failed
**Fix:** 
- Log in to the app
- Check browser/console logs for errors
- Make sure `Capacitor.isNativePlatform()` returns `true`

### Issue 3: Edge Function Returns Success But No Notification
**Cause:** FCM service account JSON might be wrong, or device token invalid
**Fix:**
- Check Edge Function logs for FCM errors
- Verify Service Account JSON in Supabase secrets
- Make sure `google-services.json` is in `android/app/`

### Issue 4: Notifications Work But Not on Lock Screen
**Cause:** Phone settings
**Fix:** Go to Settings → Apps → Plants Collective → Notifications → Enable "Show on lock screen"

---

## Quick Checklist

- [ ] APK is installed on phone
- [ ] User is logged in on phone
- [ ] Permission popup appeared (or permissions granted in Settings)
- [ ] Device token exists in `device_tokens` table
- [ ] Edge Function logs show success
- [ ] Phone notification settings are enabled
- [ ] Lock screen notifications are enabled
- [ ] Latest code is in the APK

---

## Still Not Working?

**Share these details:**
1. Screenshot of `device_tokens` table (showing if token exists)
2. Edge Function logs (from Supabase Dashboard)
3. Phone notification settings screenshot
4. Any error messages from app console
