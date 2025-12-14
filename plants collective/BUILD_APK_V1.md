# 📱 Build APK - Version 1.0.0

## ✅ Configuration Updated

- **App Name**: `plantscollective`
- **Version**: `1.0.0`
- **App ID**: `com.plantscollective.app`

---

## 🚀 Build APK in Android Studio

Since Android Studio is already open, follow these steps:

### Step 1: Wait for Gradle Sync
- Android Studio should automatically sync after Capacitor sync
- Wait for "Gradle sync finished" message
- If sync fails, click "Sync Project with Gradle Files" (🔄 icon)

### Step 2: Build APK

**Option A: Build APK (Debug) - Quick Test**
1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Build APK (Release) - For Distribution**
1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Select **release** variant (if prompted)
3. Wait for build to complete
4. APK location: `android/app/build/outputs/apk/release/app-release.apk`

**Option C: Generate Signed Bundle (For Play Store)**
1. Click **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose your keystore (or create new)
4. Select **release** build variant
5. Click **Finish**
6. AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📋 Quick Build Commands (Terminal)

If you prefer command line:

### Debug APK:
```bash
cd android
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK:
```bash
cd android
./gradlew assembleRelease
```
Output: `app/build/outputs/apk/release/app-release.apk`

### Release AAB (For Play Store):
```bash
cd android
./gradlew bundleRelease
```
Output: `app/build/outputs/bundle/release/app-release.aab`

---

## ✅ Verify Version

After building, verify the APK has correct version:

1. In Android Studio: **Build** → **Analyze APK**
2. Select your APK file
3. Check `AndroidManifest.xml`:
   - `android:versionName="1.0.0"`
   - `android:versionCode` (should be 1 or higher)

Or check in terminal:
```bash
aapt dump badging app-release.apk | grep version
```

---

## 📱 Install APK on Device

### Via ADB:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
# or
adb install app/build/outputs/apk/release/app-release.apk
```

### Manual Install:
1. Transfer APK to Android device
2. Open file manager on device
3. Tap APK file
4. Allow installation from unknown sources (if prompted)
5. Install

---

## 🎯 Current Configuration

**App Details:**
- Name: `plantscollective`
- Version: `1.0.0`
- Package: `com.plantscollective.app`
- Build: Production-ready

**Features Included:**
- ✅ External links fixed (Android compatible)
- ✅ Back button fixed
- ✅ Labothecary link connected
- ✅ Image optimization
- ✅ Performance optimized
- ✅ Safe areas implemented

---

## ⚠️ Important Notes

### For Release APK:
- **Signing Required**: Release APKs must be signed
- If not signed, create keystore first:
  1. **Build** → **Generate Signed Bundle / APK**
  2. Create new keystore
  3. Save keystore securely (never commit to git!)

### For Play Store:
- Use **App Bundle (.aab)** format (not APK)
- Required for new apps and updates
- Smaller download size for users

---

## 🎉 Ready to Build!

Your app is configured as:
- **Name**: plantscollective
- **Version**: 1.0.0

**Next Step**: Build APK in Android Studio using the steps above!

---

**APK will be ready in a few minutes! 🚀**



