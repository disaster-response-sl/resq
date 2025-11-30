# ResQ Platform - Quick Deployment Reference

## ✅ Current Status
- **Frontend:** Deployed on Vercel ✅
- **Backend:** Ready to deploy ⏳
- **Database:** Ready to configure ⏳

---

## 🚀 Deploy Backend (5 Minutes)

### Option 1: Render.com (Recommended - Free)

1. **Sign up:** https://render.com → Login with GitHub

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect repository: `disaster-response-sl/resq`
   - Branch: `main` or `feature-ui-ux`

3. **Configure:**
   ```
   Name: resq-backend
   Region: Singapore
   Root Directory: src/web-dashboard/backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/resq
   JWT_SECRET=generate-random-64-char-string
   OPENWEATHER_API_KEY=your-key
   GOOGLE_GEMINI_API_KEY=your-key
   ```

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Copy your URL: `https://resq-backend.onrender.com`

6. **Update Frontend:**
   - Vercel Dashboard → Settings → Environment Variables
   - Update `VITE_API_BASE_URL` to your Render URL
   - Redeploy frontend

---

## 🗄️ Setup MongoDB Atlas (10 Minutes)

1. **Create Account:** https://www.mongodb.com/cloud/atlas

2. **Create Free Cluster:**
   - Click "Build a Database" → FREE (M0)
   - Region: Singapore
   - Name: `resq-cluster`

3. **Create User:**
   - Database Access → Add User
   - Username: `resq-admin`
   - Password: Generate strong password (SAVE IT!)

4. **Network Access:**
   - Network Access → Add IP
   - Allow from: `0.0.0.0/0` (Allow anywhere)

5. **Get Connection String:**
   - Cluster → Connect → Connect Application
   - Copy: `mongodb+srv://resq-admin:<password>@cluster.mongodb.net/`
   - Add database name: `/resq-production`
   - Final: `mongodb+srv://resq-admin:PASSWORD@cluster.xxxxx.mongodb.net/resq-production`

6. **Seed Data:**
   ```bash
   # Update backend/.env with Atlas URI
   MONGO_URI=mongodb+srv://resq-admin:PASSWORD@cluster.mongodb.net/resq-production
   
   # Run seed script
   cd src/web-dashboard/backend
   npm run seed
   ```

---

## 🔑 Generate JWT Secret

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Online
# Visit: https://www.grc.com/passwords.htm
# Copy the "63 random alpha-numeric characters" string
```

---

## ✅ Post-Deployment Tests

### 1. Test Backend Health
```bash
curl https://resq-backend.onrender.com/api/health
# Should return: {"status":"ok","message":"Backend server is running"}
```

### 2. Test Frontend
Visit your Vercel URL and check:
- ✅ Dashboard loads
- ✅ Location shows (coordinates or name)
- ✅ Weather displays
- ✅ Emergency contacts work
- ✅ No console errors

### 3. Browser Console Check
Press F12 → Console tab:
- ✅ No red errors
- ✅ No CORS errors
- ✅ No "API_BASE_URL undefined" errors

---

## 📱 Mobile Test Checklist

### Emergency Contacts Page
- ✅ 4 emergency cards fit in 2 rows (2x2 grid)
- ✅ All cards are tappable
- ✅ Text is readable

### LankaRouteWatch Page
- ✅ Stats cards fit in 2 columns
- ✅ Cards are not too big
- ✅ All text visible

### Dashboard
- ✅ Location card shows without "Change" button
- ✅ Cards stack properly
- ✅ Everything fits on screen

---

## 🐛 Common Issues & Quick Fixes

### Issue: "API_BASE_URL is not defined"
**Fix:** Already fixed in code! Update uses:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
```

### Issue: CORS errors in production
**Fix:** Already fixed! Backend now allows:
- `https://resq-five.vercel.app` (your production URL)
- All Vercel preview deployments (*.vercel.app)
- Custom domains via `FRONTEND_URL` environment variable

**If you deployed before this fix:**
1. Go to Render dashboard → Your service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or merge to main branch for auto-deploy

### Issue: Location shows coordinates instead of name
**Expected:** This is the fallback! Nominatim proxy working.
**If needed:** Wait a few seconds, location name will load.

### Issue: Backend sleeps on Render free tier
**Fix:** First request after 15 min takes ~30 seconds (cold start)
**Solution:** Upgrade to paid tier ($7/month) for always-on

---

## 📊 Environment Variables Checklist

### Frontend (Vercel)
```bash
✅ VITE_API_BASE_URL=https://resq-backend.onrender.com
```

### Backend (Render)
```bash
✅ NODE_ENV=production
✅ PORT=5000
✅ MONGO_URI=mongodb+srv://...
✅ JWT_SECRET=random-64-char-string
□ OPENWEATHER_API_KEY=optional
□ GOOGLE_GEMINI_API_KEY=optional
```

---

## 🎯 Success Criteria

Your deployment is successful when:

1. **Frontend loads:** ✅ https://your-app.vercel.app
2. **Backend responds:** ✅ https://resq-backend.onrender.com/api/health
3. **Database connected:** ✅ No MongoDB connection errors
4. **Location works:** ✅ Shows coordinates or location name
5. **No console errors:** ✅ Browser console is clean
6. **Mobile responsive:** ✅ Cards fit properly on mobile
7. **Features work:** ✅ Emergency contacts, maps, search all functional

---

## 🔗 Important Links

### Production URLs (Update after deployment)
- **Frontend:** https://your-frontend.vercel.app
- **Backend:** https://resq-backend.onrender.com
- **Database:** MongoDB Atlas Dashboard

### Dashboards
- **Vercel:** https://vercel.com/dashboard
- **Render:** https://dashboard.render.com
- **MongoDB Atlas:** https://cloud.mongodb.com

### Documentation
- **Full Guide:** See `DEPLOYMENT_GUIDE.md`
- **Build Guide:** See `BUILD_GUIDE.md`
- **API Docs:** See backend `README.md`

---

## 📞 Need Help?

1. **Check full guides:**
   - `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
   - `BUILD_GUIDE.md` - Build and troubleshooting

2. **Check logs:**
   - Vercel: Dashboard → Deployments → View Function Logs
   - Render: Dashboard → Service → Logs tab
   - MongoDB: Cloud console → Monitoring

3. **Common fixes:**
   - Restart services
   - Check environment variables
   - Verify CORS configuration
   - Check IP whitelist on MongoDB

---

## 🎉 Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check error logs
   - Monitor response times
   - Test all features

2. **Set up monitoring**
   - UptimeRobot for uptime checks
   - Sentry for error tracking
   - Google Analytics for usage

3. **Share with users**
   - Test with small group first
   - Gather feedback
   - Fix any issues

4. **Plan improvements**
   - Based on user feedback
   - Monitor analytics
   - Optimize performance

---

**Last Updated:** November 30, 2025  
**Status:** All fixes applied ✅  
**Ready to Deploy:** Yes 🚀
