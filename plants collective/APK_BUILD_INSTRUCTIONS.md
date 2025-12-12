# 📱 Build APK for Plants Collective - Version 1.0.0

## ✅ App Configuration Complete

- **App Name:** Plants Collective
- **Package ID:** com.plantscollective.app
- **Version:** 1.0.0
- **Icon:** Downloaded and configured from Supabase

---

## 🚀 Quick Start: Build APK

### **Step 1: Build Web App**
```bash
cd "/Users/sujalpatel/Documents/Plants Collective/plants collective"
npm run build
```

### **Step 2: Sync with Android**
```bash
npx cap sync android
```

### **Step 3: Open in Android Studio**
```bash
npx cap open android
```

### **Step 4: Build APK**

**In Android Studio:**
1. Wait for Gradle sync to complete
2. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete (2-5 minutes)
4. Click **locate** in the notification popup

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 App Details

- **App ID:** `com.plantscollective.app`
- **Version Code:** 1
- **Version Name:** 1.0.0
- **App Name:** Plants Collective
- **Icon:** `public/icon.png` (192x192, 512x512 sizes created)

---

## 🎨 Icon Configuration

The app icon has been downloaded from:
- Source: `https://vwdrevguebayhyjfurag.supabase.co/storage/v1/object/public/image/Icon.png`
- Saved as: `public/icon.png`
- Resized to: 48x48, 96x96, 192x192, 512x512

During `npx cap sync android`, Capacitor will automatically:
1. Copy the icon to `android/app/src/main/res/mipmap-*` folders
2. Generate all required Android icon densities
3. Update AndroidManifest.xml with the icon

---

## 📝 Manual Icon Update (If Needed)

If icons don't update automatically, manually copy to Android:

```bash
cd "/Users/sujalpatel/Documents/Plants Collective/plants collective"

# Copy icon to Android res folders
# Android Studio will handle density conversion automatically
cp public/icon-192.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp public/icon-192.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp public/icon-192.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp public/icon-512.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp public/icon-512.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

---

## 🔨 Build Commands

### **Debug APK (For Testing)**
```bash
cd android
./gradlew assembleDebug
```

### **Release APK (Requires Signing)**
```bash
cd android
./gradlew assembleRelease
```

---

## ✅ Verification Checklist

Before building:
- ✅ App name: "Plants Collective"
- ✅ Package ID: "com.plantscollective.app"
- ✅ Version: 1.0.0
- ✅ Icon downloaded and resized
- ✅ Capacitor config updated
- ✅ Web app built successfully

---

## 📱 Install APK on Device

**Option 1: USB Cable**
1. Enable USB Debugging on Android device
2. Connect device via USB
3. In Android Studio: Click ▶️ Run button
4. Select your device
5. App installs automatically!

**Option 2: Share APK File**
1. Copy `app-debug.apk` to your phone
2. Open file on phone
3. Allow installation from unknown sources
4. Tap "Install"
5. Done!

---

## 🎯 Next Steps

1. **Build the APK:** Follow Quick Start steps above
2. **Test on Device:** Install and test all features
3. **Release Build:** Generate signed APK for distribution (see BUILD_APK_GUIDE.md)

---

**Your Plants Collective app is ready to build!** 🚀📱

