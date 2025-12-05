# Automatic Token Refresh - Security Guide

## 🔒 Security Overview

This implementation ensures **zero exposure** of OAuth2 consumer keys and secrets. All sensitive credentials stay on the backend, and tokens are automatically refreshed without manual intervention.

## 🏗️ Architecture

```
Frontend (Browser)
    ↓
    │ Requests data from FloodSupport API
    ↓
Token Manager (frontend/src/utils/tokenManager.ts)
    ↓
    │ Needs token? Call backend
    ↓
Backend API (/api/auth/floodsupport-token)
    ↓
    │ Consumer Key/Secret from .env
    ↓
Token Refresh Service (backend/services/tokenRefreshService.js)
    ↓
    │ OAuth2 Client Credentials Flow
    ↓
Choreo OAuth2 Server
    ↓
    │ Returns access token (6-hour expiry)
    ↓
Frontend receives token → Makes authenticated API calls
```

## 🔐 Security Features

### 1. **No Secrets in Frontend**
- Consumer key/secret are **NEVER** sent to the browser
- Frontend only receives short-lived access tokens (6 hours)
- Tokens are cached in memory only (not localStorage or cookies)

### 2. **Backend-Only OAuth2 Flow**
- Backend handles all OAuth2 authentication
- Consumer credentials stay in `.env` file (gitignored)
- Backend validates and caches tokens server-side

### 3. **Automatic Token Refresh**
- Tokens refresh 5 minutes before expiry
- Failed requests automatically retry with fresh token
- No manual intervention needed

### 4. **Git Protection**
- All `.env` files are in `.gitignore`
- Only `.env.example` files are committed (without real credentials)
- GitHub never sees your secrets

## 📋 Setup Instructions

### Step 1: Get OAuth2 Credentials

1. Go to https://api.floodsupport.org
2. Navigate to your application
3. Click **Credentials** → **View**
4. Copy your **Consumer Key** and **Consumer Secret**

⚠️ **IMPORTANT**: Keep these secret! Never share or commit them.

### Step 2: Configure Backend

Edit `src/web-dashboard/backend/.env`:

```env
# FloodSupport API OAuth2 Configuration (KEEP SECRET)
FLOODSUPPORT_OAUTH_TOKEN_URL=https://7bc3c491-cd06-428a-826a-080e4544715c-prod.e1-us-east-azure.choreosts.dev/oauth2/token
FLOODSUPPORT_CONSUMER_KEY=<your_consumer_key_here>
FLOODSUPPORT_CONSUMER_SECRET=<your_consumer_secret_here>
```

### Step 3: Verify Git Protection

```bash
# Check that .env is gitignored
git check-ignore src/web-dashboard/backend/.env
# Should output: src/web-dashboard/backend/.env

# Check that .env is not tracked
git status
# Should NOT show .env files as modified
```

### Step 4: Test Token Refresh

1. Start backend: `cd src/web-dashboard/backend && npm start`
2. Test token endpoint: `curl http://localhost:5000/api/auth/floodsupport-token`
3. Should return: `{"success": true, "accessToken": "eyJ..."}`

### Step 5: Start Frontend

```bash
cd src/web-dashboard/frontend
npm run dev
```

The frontend will automatically fetch tokens from the backend!

## 🔍 How It Works

### Frontend Token Request Flow

```typescript
// 1. Frontend calls FloodSupport API
const response = await tokenManager.makeAuthenticatedRequest(
  'https://api.floodsupport.org/...'
);

// 2. Token Manager checks cache
// - If valid token exists (< 7 days old, > 1 hour remaining) → Use cached token
// - If expired or expiring soon → Fetch from backend

// 3. Backend OAuth2 Flow (automatic)
// - Backend calls Choreo OAuth2 token endpoint
// - Uses consumer key/secret from .env
// - Returns fresh access token
// - Caches token for 7 days

// 4. Frontend receives token
// - Adds Authorization: Bearer <token> header
// - Makes authenticated API call
// - Caches token in memory

// 5. Automatic Retry on 401
// - If 401 error occurs → Clear cache
// - Fetch fresh token from backend
// - Retry request once
```

## 🚀 Deployment

### Backend (Render/Heroku/etc.)

Add environment variables in your hosting platform:

```
FLOODSUPPORT_OAUTH_TOKEN_URL=https://...
FLOODSUPPORT_CONSUMER_KEY=your_key
FLOODSUPPORT_CONSUMER_SECRET=your_secret
```

**Never hardcode these in your code!**

### Frontend (Vercel/Netlify/etc.)

No special configuration needed! The frontend automatically fetches tokens from your backend.

## ✅ Security Checklist

- [ ] Consumer key/secret are in `.env` (not `.env.example`)
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in frontend code
- [ ] Backend environment variables set in hosting platform
- [ ] Tested token refresh locally
- [ ] Verified `.env` not tracked by git

## 🐛 Troubleshooting

### "OAuth2 credentials not configured"
- Check that `FLOODSUPPORT_CONSUMER_KEY` and `FLOODSUPPORT_CONSUMER_SECRET` are set in backend `.env`

### "Failed to refresh access token"
- Verify consumer key/secret are correct
- Check token URL is accessible
- Ensure your Choreo application is active

### "401 Unauthorized" errors
- Backend may not be running
- Token endpoint may be unreachable
- Check backend logs for errors

## 📞 Support

For issues:
1. Check backend logs: `cd src/web-dashboard/backend && npm start`
2. Test token endpoint: `curl http://localhost:5000/api/auth/floodsupport-token`
3. Check Choreo application status

## 🔄 Token Lifecycle

- **Expiry**: 7 days (604800 seconds)
- **Refresh**: 1 hour before expiry
- **Cache**: In-memory only (server + client)
- **Security**: Consumer secrets never leave backend

---

**Remember**: Never commit `.env` files or share consumer credentials!
