# 🚀 Deployment Guide - National Disaster Platform

This guide provides step-by-step instructions for deploying the National Disaster Platform to production using Vercel (frontend) and Render (backend).

---

## 📋 Prerequisites

Before starting deployment, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account (free tier available)
- [ ] Render account (free tier available)
- [ ] MongoDB Atlas account (database is already configured)
- [ ] Domain name (optional, but recommended for government deployment)
- [ ] ICTA SLUDI registration (for production authentication)

---

## 🔒 CRITICAL: Security Preparation

### Step 1: Remove Exposed Secrets

**URGENT**: The repository currently contains exposed credentials that must be removed before deployment.

```bash
# 1. Remove .env file from Git history
git rm --cached src/web-dashboard/backend/.env
git rm --cached src/web-dashboard/backend/.env.commercial-bank

# 2. Add to .gitignore
echo "*.env" >> .gitignore
echo "!.env.example" >> .gitignore
echo "!.env.production.example" >> .gitignore

# 3. Commit changes
git add .gitignore
git commit -m "chore: remove exposed secrets and update gitignore"
git push origin main
```

### Step 2: Rotate Credentials

**IMPORTANT**: Generate new credentials for ALL services:

#### MongoDB Atlas
1. Go to MongoDB Atlas dashboard
2. Database Access → Add New Database User
3. Create new username/password
4. Update connection string with new credentials

#### JWT Secret
```bash
# Generate new 256-bit secret
openssl rand -hex 32
```

#### Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Generate new API key
3. Save securely (do NOT commit to Git)

#### Payment Gateway (Optional - if using real payments)
1. Contact Commercial Bank for production credentials
2. Request new API password
3. Never use test credentials in production

---

## 🗄️ Database Setup

### Step 1: Verify MongoDB Atlas Configuration

Your MongoDB is already configured at:
```
mongodb+srv://cluster0.ng1rq.mongodb.net/disaster_platform
```

**Actions Required**:

1. **Create New Database User**
   - Go to MongoDB Atlas Dashboard
   - Navigate to Database Access
   - Click "Add New Database User"
   - Username: `ndp-prod-user`
   - Password: [Generate strong password]
   - Database User Privileges: "Read and write to any database"
   - Save

2. **Update Network Access**
   - Navigate to Network Access
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific Render IPs for better security

3. **Test Connection**
   ```bash
   # From your local machine
   cd src/web-dashboard/backend
   
   # Update .env.local with new credentials
   MONGO_URI=mongodb+srv://ndp-prod-user:[PASSWORD]@cluster0.ng1rq.mongodb.net/disaster_platform
   
   # Test connection
   node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ Connected')).catch(err => console.error('❌ Error:', err));"
   ```

### Step 2: Seed Initial Data (Optional)

```bash
cd src/web-dashboard/backend
npm run seed
```

This will populate:
- Test user accounts (admin, responder, citizen)
- Sample disaster data
- Sample resources

---

## 🖥️ Backend Deployment (Render)

### Step 1: Sign Up for Render

1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repository

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `national-disaster-platform` repository
4. Configure:

**Basic Settings**:
- **Name**: `ndp-backend` (or your preferred name)
- **Region**: Singapore (closest to Sri Lanka)
- **Branch**: `main` (or `feature-fully-updated`)
- **Root Directory**: `src/web-dashboard/backend`
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan**:
- Select "Starter" ($7/month) for production
- Or "Free" for testing (spins down after inactivity)

### Step 3: Add Environment Variables

Click "Environment" tab and add these variables:

```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://ndp-prod-user:[YOUR_NEW_PASSWORD]@cluster0.ng1rq.mongodb.net/disaster_platform
JWT_SECRET=[YOUR_NEW_256_BIT_SECRET]
JWT_EXPIRES_IN=24h
GEMINI_API_KEY=[YOUR_GEMINI_KEY]
MERCHANT_ID=TESTITCALANKALKR
API_USERNAME=merchant.TESTITCALANKALKR
API_PASSWORD=0144a33905ebfc5a6d39dd074ce5d40d
MPGS_MOCK_MODE=false
FRONTEND_URL=https://[WILL_UPDATE_AFTER_VERCEL].vercel.app
USE_MOCK_SLUDI=true
ESIGNET_SERVICE_URL=https://sludiauth.icta.gov.lk/service
```

**Important**: Copy the `[YOUR_RENDER_APP].onrender.com` URL after creation - you'll need it for frontend configuration.

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Check logs for any errors
4. Test health endpoint: `https://[YOUR_RENDER_APP].onrender.com/health`

Expected response:
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2025-11-29T...",
  "environment": "production"
}
```

### Step 5: Configure Custom Domain (Optional)

1. Go to Settings → Custom Domain
2. Add your domain: `api.disasterplatform.lk`
3. Update DNS records as shown
4. Wait for SSL certificate provisioning

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Sign Up for Vercel

1. Go to https://vercel.com
2. Sign up with GitHub account
3. Authorize Vercel to access your repository

### Step 2: Import Project

1. Click "Add New" → "Project"
2. Import `national-disaster-platform` repository
3. Configure:

**Project Settings**:
- **Framework Preset**: Vite
- **Root Directory**: `src/web-dashboard/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

Click "Environment Variables" and add:

```
VITE_API_BASE_URL=https://[YOUR_RENDER_APP].onrender.com/api
```

Replace `[YOUR_RENDER_APP]` with your actual Render backend URL from Step 4 above.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build (2-5 minutes)
3. Visit your deployment URL
4. Test login page loads correctly

### Step 5: Update Backend with Frontend URL

Go back to Render dashboard:
1. Navigate to your backend service
2. Environment variables
3. Update `FRONTEND_URL` with your Vercel URL: `https://[YOUR_VERCEL_SUBDOMAIN].vercel.app`
4. Click "Save"
5. Service will auto-redeploy

### Step 6: Configure Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your domain: `disasterplatform.lk` or `www.disasterplatform.lk`
3. Update DNS records as shown
4. Wait for DNS propagation (up to 24 hours)

---

## 📱 Mobile App Configuration

### Step 1: Update API URLs

Edit `src/MobileApp/config/api.ts`:

```typescript
const getBaseURL = () => {
  // Production backend URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://[YOUR_RENDER_APP].onrender.com/api';
  }
  
  // Environment variable (preferred)
  const envUrl = process.env.REACT_NATIVE_API_BASE_URL;
  if (envUrl) return envUrl;

  // Development fallback
  return 'http://localhost:5000/api';
};
```

### Step 2: Update SLUDI Configuration

Edit `src/MobileApp/config/esignetConfig.ts`:

```typescript
export const ESIGNET_ENV_CONFIG = {
  ESIGNET_UI_BASE_URL: "https://sludiauth.icta.gov.lk",
  MOCK_RELYING_PARTY_SERVER_URL: "https://[YOUR_RENDER_APP].onrender.com",
  REDIRECT_URI: "ndp://dashboard",
  // ... rest of config
};
```

### Step 3: Build Android APK

```bash
cd src/MobileApp

# Clean build
cd android
./gradlew clean
cd ..

# Build release APK
npx react-native build-android --mode=release

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Step 4: Sign APK (Required for Play Store)

```bash
# Generate keystore (first time only)
keytool -genkeypair -v -storetype PKCS12 -keystore ndp-release-key.keystore -alias ndp-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Add to android/gradle.properties
MYAPP_RELEASE_STORE_FILE=ndp-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=ndp-key-alias
MYAPP_RELEASE_STORE_PASSWORD=[YOUR_KEYSTORE_PASSWORD]
MYAPP_RELEASE_KEY_PASSWORD=[YOUR_KEY_PASSWORD]

# Build signed APK
cd android
./gradlew bundleRelease
```

### Step 5: Test on Physical Device

```bash
# Install on connected Android device
adb install android/app/build/outputs/apk/release/app-release.apk

# Check logs
adb logcat | grep -i "ndp"
```

---

## ✅ Post-Deployment Verification

### Backend Health Checks

```bash
# Health endpoint
curl https://[YOUR_RENDER_APP].onrender.com/health

# API test
curl https://[YOUR_RENDER_APP].onrender.com/api/test

# Authentication endpoint
curl -X POST https://[YOUR_RENDER_APP].onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin001","password":"123456"}'
```

### Frontend Verification

1. Visit `https://[YOUR_VERCEL_URL].vercel.app`
2. Try login with test credentials:
   - Username: `admin001`
   - Password: `123456`
3. Check browser console for errors
4. Test navigation between pages
5. Verify maps load correctly

### Mobile App Verification

1. Install APK on test device
2. Check API connectivity
3. Test authentication flow
4. Test SOS functionality
5. Verify location services
6. Test offline mode

---

## 🔍 Monitoring & Maintenance

### Set Up Uptime Monitoring

**UptimeRobot** (Free):
1. Sign up at https://uptimerobot.com
2. Add monitors:
   - Backend: `https://[YOUR_RENDER_APP].onrender.com/health`
   - Frontend: `https://[YOUR_VERCEL_URL].vercel.app`
3. Configure alerts (email/SMS)

### Set Up Error Tracking

**Sentry** (Free tier):
1. Sign up at https://sentry.io
2. Create project for backend
3. Add to `src/web-dashboard/backend/app.js`:
   ```javascript
   const Sentry = require("@sentry/node");
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```
4. Create project for frontend
5. Add to `src/web-dashboard/frontend/src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
   });
   ```

### Check Logs

**Render**:
- Dashboard → Your Service → Logs tab
- Filter by error/warning
- Set up log retention

**Vercel**:
- Dashboard → Your Project → Deployments → View Function Logs
- Real-time logs during requests

---

## 🐛 Troubleshooting

### Backend Won't Start

**Issue**: Service failing to start on Render

**Solution**:
```bash
# Check logs in Render dashboard
# Common issues:
1. Missing environment variables
2. MongoDB connection failure
3. Port already in use
4. npm install failed

# Test locally with production env:
cd src/web-dashboard/backend
export $(cat .env.production.example | xargs)
npm start
```

### Frontend API Calls Failing

**Issue**: CORS errors or 404 on API calls

**Solution**:
```javascript
// Verify API URL in frontend
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

// Check backend CORS configuration
// In backend/app.js:
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Mobile App Can't Connect

**Issue**: Mobile app shows "Network Error"

**Solution**:
```typescript
// Check API URL in mobile app
console.log('API URL:', API_BASE_URL);

// Test backend directly:
curl https://[YOUR_RENDER_APP].onrender.com/api/health

// Check if backend is sleeping (Render free tier):
// - Visit backend URL to wake it up
// - Consider upgrading to paid tier
```

### Database Connection Errors

**Issue**: "MongoNetworkError" in logs

**Solution**:
1. Check MongoDB Atlas Network Access
2. Verify IP whitelist includes 0.0.0.0/0
3. Test connection string locally
4. Check database user permissions

---

## 🔐 Security Checklist

Before going live:

- [ ] All secrets removed from Git repository
- [ ] Environment variables set in Render/Vercel (not in code)
- [ ] MongoDB credentials rotated
- [ ] JWT secret changed to 256-bit random value
- [ ] CORS configured for production domains only
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting enabled
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS protection headers set
- [ ] API keys secured (Gemini, MPGS)
- [ ] No debug code in production
- [ ] Error messages don't expose sensitive info

---

## 📊 Performance Optimization

### Enable Caching

Add Redis for frequently accessed data:

```bash
# Render: Add Redis instance
# Dashboard → New Redis instance

# Add to backend:
npm install redis

# Update backend/app.js:
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});
```

### CDN for Static Assets

Vercel automatically uses CDN, but you can optimize further:

```javascript
// In vite.config.ts:
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily**:
- [ ] Check error logs (Sentry)
- [ ] Verify uptime monitoring (UptimeRobot)
- [ ] Review user feedback

**Weekly**:
- [ ] Database backup verification
- [ ] Performance metrics review
- [ ] Security updates check

**Monthly**:
- [ ] Dependency updates (`npm outdated`)
- [ ] SSL certificate renewal check
- [ ] Cost optimization review
- [ ] User analytics analysis

### Backup Strategy

**Database**:
- MongoDB Atlas: Automatic daily backups (enabled by default)
- Retention: 7 days (free tier)
- Manual backup: Export via `mongodump`

**Code**:
- GitHub: Primary source control
- Regular tags for releases: `git tag v1.0.0`

---

## 🚀 Next Steps After Deployment

1. **Test Everything**:
   - [ ] All user flows (login, SOS, reports, donations)
   - [ ] Mobile app on multiple devices
   - [ ] Payment gateway integration
   - [ ] Email notifications

2. **SLUDI Production Integration**:
   - [ ] Register with ICTA for production credentials
   - [ ] Update CLIENT_ID and private keys
   - [ ] Test authentication with real SLUDI
   - [ ] Update redirect URIs

3. **User Acceptance Testing**:
   - [ ] Create test user accounts
   - [ ] Simulate disaster scenarios
   - [ ] Test response times
   - [ ] Verify data accuracy

4. **Documentation**:
   - [ ] API documentation (Swagger)
   - [ ] User manual for citizens
   - [ ] Admin training guide
   - [ ] Responder handbook

5. **Government Pitch**:
   - [ ] Prepare presentation
   - [ ] Demo video
   - [ ] Cost-benefit analysis
   - [ ] Implementation roadmap

---

## 📄 Deployment Summary

After completing this guide, you will have:

✅ Backend deployed on Render (https://[YOUR_APP].onrender.com)  
✅ Frontend deployed on Vercel (https://[YOUR_SITE].vercel.app)  
✅ Database on MongoDB Atlas (production-ready)  
✅ Mobile app APK built and signed  
✅ Environment variables secured  
✅ Monitoring and error tracking enabled  
✅ Custom domains configured (optional)  
✅ HTTPS enabled everywhere  
✅ Ready for government presentation  

**Estimated Total Time**: 4-6 hours (excluding DNS propagation)

---

## 📧 Contact

For deployment support:
- GitHub Issues: [your-repo]/issues
- Email: [your-email]@gmail.com
- Documentation: See README.md

---

**Good luck with your deployment and government pitch! 🇱🇰**
