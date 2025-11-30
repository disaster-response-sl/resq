# 🚀 Pre-Deployment Checklist

Use this checklist before deploying to production. Mark each item as you complete it.

---

## 🔴 CRITICAL - Must Complete Before Deployment

### Security & Credentials
- [ ] **Rotate MongoDB credentials**
  - [ ] Delete old user "3halon" from MongoDB Atlas
  - [ ] Create new user with strong password
  - [ ] Update `MONGODB_URI` in Render environment variables
  - [ ] Test connection with new credentials

- [ ] **Rotate JWT secret**
  - [ ] Generate new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  - [ ] Update `JWT_SECRET` in Render environment variables
  - [ ] Note: This will invalidate all existing sessions

- [ ] **Rotate Gemini API key**
  - [ ] Go to https://makersuite.google.com/app/apikey
  - [ ] Revoke old key: `AIzaSyAySlceirSTQh0-_tuFI1vl6CEdY4nZWHg`
  - [ ] Generate new key
  - [ ] Update `GEMINI_API_KEY` in Render environment variables

### Code Updates
- [ ] **Replace placeholder URLs in mobile app**
  - [ ] Update `src/MobileApp/config/api.ts` (line 15)
    - Change `https://YOUR_RENDER_APP.onrender.com/api` to your actual Render URL
  - [ ] Update `src/MobileApp/config/esignetConfig.ts` (line 7)
    - Change `https://YOUR_RENDER_APP.onrender.com` to your actual Render URL

- [ ] **Replace placeholder URLs in frontend**
  - [ ] Update `src/web-dashboard/frontend/src/config/api.ts` (line 15)
    - Change `https://YOUR_RENDER_APP.onrender.com/api` to your actual Render URL

- [ ] **Verify .env files are NOT committed**
  ```bash
  git status  # Should NOT show any .env files
  git log --all -- **/.env  # Should show they were removed
  ```

---

## 🟠 HIGH PRIORITY - Complete Before Launch

### Backend Deployment (Render)
- [ ] **Create Render account**
  - [ ] Sign up at https://dashboard.render.com
  - [ ] Connect GitHub account

- [ ] **Create Web Service**
  - [ ] Select your GitHub repository
  - [ ] Set root directory: `src/web-dashboard/backend`
  - [ ] Runtime: Node
  - [ ] Region: Singapore (closest to Sri Lanka)
  - [ ] Branch: main
  - [ ] Build command: `npm install`
  - [ ] Start command: `node app.js`

- [ ] **Configure environment variables in Render**
  ```env
  MONGODB_URI=mongodb+srv://NEW_USER:NEW_PASSWORD@cluster0.ng1rq.mongodb.net/disaster_platform
  JWT_SECRET=your-new-64-char-hex-string
  FRONTEND_URL=https://your-app.vercel.app
  GEMINI_API_KEY=your-new-gemini-key
  MERCHANT_ID=your-merchant-id
  CHECKOUT_SESSION_VERSION=1
  NODE_ENV=production
  PORT=5000
  ```

- [ ] **Deploy and verify**
  - [ ] Click "Deploy"
  - [ ] Wait for build to complete (5-10 minutes)
  - [ ] Note your Render URL (e.g., `https://national-disaster-backend.onrender.com`)
  - [ ] Test health check: `curl https://your-app.onrender.com/health`

### Frontend Deployment (Vercel)
- [ ] **Create Vercel account**
  - [ ] Sign up at https://vercel.com
  - [ ] Connect GitHub account

- [ ] **Import project**
  - [ ] Click "New Project"
  - [ ] Select your GitHub repository
  - [ ] Set root directory: `src/web-dashboard/frontend`
  - [ ] Framework preset: Vite
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `dist`

- [ ] **Configure environment variables in Vercel**
  ```env
  VITE_API_BASE_URL=https://your-render-app.onrender.com/api
  ```

- [ ] **Deploy and verify**
  - [ ] Click "Deploy"
  - [ ] Wait for build to complete (2-5 minutes)
  - [ ] Note your Vercel URL (e.g., `https://national-disaster.vercel.app`)
  - [ ] Test frontend loads correctly

### Connect Frontend to Backend
- [ ] **Update backend with frontend URL**
  - [ ] Go to Render dashboard
  - [ ] Update `FRONTEND_URL` environment variable
  - [ ] Value: Your Vercel URL (e.g., `https://national-disaster.vercel.app`)
  - [ ] Save and redeploy

---

## 🟡 MEDIUM PRIORITY - Complete Before Public Launch

### Testing
- [ ] **Test authentication flow**
  - [ ] Admin login works
  - [ ] Responder login works
  - [ ] JWT tokens are properly validated
  - [ ] Session persistence works

- [ ] **Test SLUDI integration**
  - [ ] SLUDI authentication flow works
  - [ ] Redirect URIs are correctly configured
  - [ ] User data is properly fetched from SLUDI
  - [ ] Update SLUDI portal with production URLs

- [ ] **Test core features**
  - [ ] SOS signal creation (mobile)
  - [ ] SOS signal assignment (admin)
  - [ ] SOS notifications (responder)
  - [ ] Disaster zone creation (admin)
  - [ ] Resource management (admin/responder)
  - [ ] Map visualization (all users)

- [ ] **Test payment gateway**
  - [ ] Donation flow works
  - [ ] Commercial Bank MPGS integration working
  - [ ] Payment callbacks are received
  - [ ] Transaction records are saved

### Performance & Monitoring
- [ ] **Set up monitoring**
  - [ ] Configure Render health check alerts
  - [ ] Monitor MongoDB Atlas usage dashboard
  - [ ] Set up Vercel analytics (free)
  - [ ] Consider Sentry for error tracking (optional)

- [ ] **Optimize performance**
  - [ ] Test mobile app performance on 3G/4G networks
  - [ ] Verify offline mode works in mobile app
  - [ ] Check API response times (<500ms target)
  - [ ] Verify image loading is optimized

### Mobile App
- [ ] **Update mobile app configuration**
  - [ ] Update `.env` with production backend URL
  - [ ] Test on physical Android device
  - [ ] Test on physical iOS device (if available)
  - [ ] Verify push notifications work (if implemented)
  - [ ] Test location services permissions

- [ ] **Build production versions**
  - [ ] Android: Generate signed APK
    ```bash
    cd src/MobileApp/android
    ./gradlew assembleRelease
    ```
  - [ ] iOS: Create archive in Xcode (if targeting iOS)
  - [ ] Test production builds thoroughly

---

## 🟢 OPTIONAL - Nice to Have

### Documentation
- [ ] **Update README files**
  - [ ] Add production URLs
  - [ ] Add deployment badges
  - [ ] Update screenshots with production data

- [ ] **Create user documentation**
  - [ ] Admin user guide
  - [ ] Responder user guide
  - [ ] Citizen mobile app guide

### Advanced Features
- [ ] **Set up CI/CD**
  - [ ] GitHub Actions for automated testing
  - [ ] Automated deployment on merge to main

- [ ] **Add analytics**
  - [ ] Google Analytics for web dashboard
  - [ ] Mobile app analytics (Firebase/Amplitude)

- [ ] **Implement logging**
  - [ ] Structured logging with Winston
  - [ ] Log aggregation service (Logtail/Papertrail)

---

## 📋 Post-Deployment Verification

After deploying everything, verify these work:

### Backend (Render)
```bash
# Health check
curl https://your-app.onrender.com/health

# Should return: {"status":"OK","timestamp":"..."}

# Test CORS
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-app.onrender.com/api/auth/login
```

### Frontend (Vercel)
- [ ] Navigate to `https://your-app.vercel.app`
- [ ] Open browser DevTools Console
- [ ] Should see NO errors
- [ ] Check Network tab - API calls should go to Render URL
- [ ] Try logging in - should work without CORS errors

### Mobile App
- [ ] Install production APK on test device
- [ ] Log in with SLUDI
- [ ] Create test SOS signal
- [ ] Verify SOS appears in admin dashboard
- [ ] Test map features
- [ ] Test donation flow

---

## 🚨 Rollback Plan

If something goes wrong:

### Backend Issues
```bash
# Render automatically keeps previous deployments
# 1. Go to Render dashboard
# 2. Click your service
# 3. Go to "Events" tab
# 4. Find previous successful deployment
# 5. Click "Rollback"
```

### Frontend Issues
```bash
# Vercel keeps deployment history
# 1. Go to Vercel dashboard
# 2. Click your project
# 3. Go to "Deployments" tab
# 4. Find previous working deployment
# 5. Click "⋯" → "Promote to Production"
```

### Database Issues
```bash
# MongoDB Atlas automated backups (M2+ tier)
# Free tier (M0) - no automated backups
# Recommendation: Export data before major changes
mongodump --uri="mongodb+srv://..."
```

---

## 📞 Emergency Contacts

Keep these handy during deployment:

- **Render Support**: https://render.com/support
- **Vercel Support**: https://vercel.com/support
- **MongoDB Atlas Support**: https://www.mongodb.com/cloud/atlas/support
- **SLUDI/ICTA Support**: [Add contact info if available]
- **Commercial Bank MPGS**: [Add merchant support contact]

---

## ✅ Final Pre-Launch Checklist

Before announcing to the government:

- [ ] All environment variables are set correctly
- [ ] All placeholder URLs are replaced
- [ ] All credentials have been rotated
- [ ] Health checks are passing
- [ ] Core features tested and working
- [ ] No console errors in browser
- [ ] Mobile app tested on real devices
- [ ] Payment gateway tested (sandbox first)
- [ ] SLUDI integration tested
- [ ] Monitoring is set up
- [ ] You have a rollback plan ready

---

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ Frontend loads without errors at your Vercel URL
2. ✅ Backend responds to health check at your Render URL
3. ✅ Users can log in via SLUDI authentication
4. ✅ Mobile app can connect to production backend
5. ✅ SOS signals flow from mobile → backend → admin dashboard
6. ✅ Donations can be processed through MPGS
7. ✅ No exposed credentials in Git repository
8. ✅ Rate limiting protects against abuse
9. ✅ CORS only allows your frontend domain
10. ✅ No debug code visible in production

---

**Once all items are checked, you're ready to pitch to the government! 🇱🇰🎉**

See `GOVERNMENT_PITCH.md` for presentation materials.
