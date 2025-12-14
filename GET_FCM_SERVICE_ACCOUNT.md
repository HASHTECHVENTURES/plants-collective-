# 🔑 How to Get Firebase Service Account JSON

Since we're using FCM HTTP v1 API (recommended), we need a **Service Account JSON** file instead of a Server Key.

## Step-by-Step Guide

### Step 1: Go to Firebase Console
1. Open Firebase Console: https://console.firebase.google.com/
2. Select your project: **CollectivePlants**

### Step 2: Open Service Accounts
1. Click the **gear icon** ⚙️ (top left)
2. Click **"Project settings"**
3. Click the **"Service accounts"** tab

### Step 3: Generate Service Account Key
1. You'll see a section titled **"Firebase Admin SDK"**
2. Click the **"Generate new private key"** button
3. A popup will appear - click **"Generate key"**
4. A JSON file will download automatically

### Step 4: Save the JSON Content
1. Open the downloaded JSON file
2. Copy **ALL** the content
3. You'll need to paste this into Supabase secrets later

**The JSON file looks like this:**
```json
{
  "type": "service_account",
  "project_id": "collectiveplants-78ad9",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## ⚠️ Important Notes

1. **Keep this file SECRET** - Never commit it to git
2. **Don't share it** - It gives full access to your Firebase project
3. **We'll store it in Supabase secrets** - Not in your code

## ✅ What You Need

After completing these steps, you should have:
- ✅ Service Account JSON file downloaded
- ✅ JSON content copied (you'll paste it into Supabase)

## Next Step

Once you have the Service Account JSON, we'll:
1. Set it as a Supabase secret: `FCM_SERVICE_ACCOUNT_JSON`
2. Set your Project ID: `FCM_PROJECT_ID=collectiveplants-78ad9`
3. Deploy the Edge Function

---

**Ready? Follow the steps above and let me know when you have the JSON file!** 🚀

