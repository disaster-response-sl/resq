# Render Environment Variables Setup

## ⚠️ CRITICAL: Required Environment Variables

Your backend is deployed but **login and some features are failing** because environment variables are missing on Render.

## 🔧 Fix Steps

### 1. Go to Render Dashboard
1. Navigate to: https://dashboard.render.com
2. Click on your **resq-backend** service
3. Click **Environment** tab (left sidebar)

### 2. Add These Required Variables

Click **"Add Environment Variable"** and add each of these:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `JWT_SECRET` | `your_secure_random_string_here` | **CRITICAL** - JWT token signing key (use a 32+ character random string) |
| `USE_MOCK_SLUDI` | `true` | Enable mock SLUDI authentication service |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiration time |
| `NODE_ENV` | `production` | Environment mode |
| `MONGO_URI` | `mongodb+srv://username:password@cluster.mongodb.net/disaster-platform` | Your MongoDB Atlas connection string |
| `PORT` | `5000` | Server port (Render usually auto-assigns this) |
| `FRONTEND_URL` | `https://resq-five.vercel.app` | Your Vercel frontend URL |

### 3. Generate Secure JWT_SECRET

Use one of these methods to generate a secure JWT_SECRET:

**Option A - Node.js (in terminal):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B - PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option C - Manual:**
Use a password generator to create a 32+ character random string like:
```
Kj9mP2xQ7nR4sT8vW3yZ6bC1dF5gH0jL
```

### 4. Save and Redeploy

After adding all environment variables:

1. Click **"Save Changes"** at the bottom
2. Render will **automatically redeploy** your service
3. Wait 2-3 minutes for deployment to complete
4. Check logs for "Server is running on port 5000"

## 🧪 Verify Fix

### Test Backend Health
```bash
curl https://resq-backend-3efi.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2025-11-30T...",
  "environment": "production"
}
```

### Test Login (use these test credentials)

**Admin Login:**
- Individual ID: `1234567890`
- OTP: `123456`

**Responder Login:**
- Individual ID: `0987654321`
- OTP: `123456`

### Check Environment Variables
```bash
curl https://resq-backend-3efi.onrender.com/api/test
```

Should show:
```json
{
  "message": "Backend is running!",
  "env": {
    "JWT_SECRET": "Set",  // ✅ Should say "Set"
    "PORT": "5000"
  }
}
```

## 🐛 Troubleshooting

### Login Still Fails After Adding JWT_SECRET

**Check Render Logs:**
1. Go to Render Dashboard → resq-backend
2. Click **"Logs"** tab
3. Look for these errors:

❌ **If you see:** `JWT_SECRET not set`
- Environment variable didn't save correctly
- Re-add it and ensure you click "Save Changes"

❌ **If you see:** `SLUDI service not initialized`
- Add `USE_MOCK_SLUDI=true` environment variable

✅ **Should see:** `🔐 Login attempt started for: 1234567890`

### Relief Camps Still Showing Errors

This is **EXPECTED** and now handled gracefully:
- Supabase external API may be slow or unavailable
- Backend now returns empty array with `success: true`
- Frontend displays: "Relief camps service temporarily unavailable"
- **This is not a critical error** - core disaster reporting features still work

### MongoDB Connection Issues

❌ **Error:** `MongoDB connection error`

**Fix:**
1. Check your MongoDB Atlas cluster is running
2. Verify `MONGO_URI` environment variable is correct
3. Ensure MongoDB Network Access allows connections from anywhere (0.0.0.0/0)
4. Check MongoDB Database Access has a user with read/write permissions

## 📊 Production Checklist

After fixing environment variables, verify these features work:

- [✅] Backend health check responds
- [✅] Admin login works (1234567890 / 123456)
- [✅] Responder login works (0987654321 / 123456)
- [✅] Statistics display correctly
- [✅] Location geocoding shows accurate address
- [✅] Road reports display (LankaRouteWatch)
- [✅] SOS signals load
- [✅] Disaster reports show on map
- [✅] User reports display
- [⚠️] Relief camps (may show empty - this is OK)

## 🔐 Security Notes

### DO NOT:
- ❌ Share your JWT_SECRET publicly
- ❌ Commit .env files to GitHub
- ❌ Use weak JWT_SECRET like "secret123"

### DO:
- ✅ Use 32+ character random JWT_SECRET
- ✅ Rotate JWT_SECRET periodically
- ✅ Keep MONGO_URI credentials secure
- ✅ Use environment variables for all secrets

## 📝 Current Environment Status

**Required Variables (CRITICAL):**
- `JWT_SECRET` - ⚠️ **MISSING** (causing login failures)
- `USE_MOCK_SLUDI` - ⚠️ **MISSING** (causing authentication errors)
- `MONGO_URI` - ✅ **Likely Set** (MongoDB features working)

**Optional Variables:**
- `NODE_ENV` - Defaults to "development"
- `JWT_EXPIRES_IN` - Defaults to "24h"
- `PORT` - Render auto-assigns
- `FRONTEND_URL` - For CORS (already configured in code)

## 🚀 Quick Fix Command

After adding environment variables, force redeploy:

```bash
# In Render Dashboard
1. Click "Manual Deploy" → "Clear build cache & deploy"
2. Wait 2-3 minutes
3. Test login: https://resq-five.vercel.app
```

## 📞 Support

If issues persist after following this guide:

1. **Check Render Logs** (real-time errors)
2. **Check Browser Console** (frontend errors)
3. **Test API directly** (curl commands above)
4. **Verify MongoDB connection** (Atlas dashboard)

---

**Last Updated:** November 30, 2025  
**Status:** Login failing due to missing `JWT_SECRET` on Render  
**Priority:** HIGH - Blocks admin/responder access
