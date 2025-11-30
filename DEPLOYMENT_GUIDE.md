# ResQ - Deployment Guide

Complete guide for deploying the ResQ National Disaster Platform to production.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment Options](#backend-deployment-options)
- [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│                                                               │
│  React + TypeScript + Tailwind CSS + Vite                   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Vercel (Frontend Hosting)                       │
│                                                               │
│  • Static hosting with CDN                                   │
│  • Automatic HTTPS                                           │
│  • Environment variables                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ API Calls
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Backend Server (Node.js)                        │
│                                                               │
│  Express.js + Mongoose                                       │
│  Deployed on: Render / Railway / AWS / DigitalOcean        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              MongoDB Atlas (Database)                        │
│                                                               │
│  • Managed MongoDB cluster                                   │
│  • Automatic backups                                         │
│  • Global distribution                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Accounts
- ✅ **Vercel Account** (Already set up - frontend deployed)
- [ ] **MongoDB Atlas Account** (Free tier available)
- [ ] **Backend Hosting Account** (Choose one):
  - Render.com (Recommended - Free tier)
  - Railway.app (Free tier with limits)
  - AWS EC2 (Paid, more control)
  - DigitalOcean (Paid, $5/month minimum)
  - Heroku (Paid only)

### Required Tools
- Git (for version control)
- Node.js 18+ and npm
- MongoDB Compass (optional, for database management)

---

## Frontend Deployment (Vercel)

### ✅ Status: Already Deployed

Your frontend is already deployed on Vercel. Here's how to update it:

### Update Deployment

```bash
# 1. Commit your changes
git add .
git commit -m "Update frontend with fixes"

# 2. Push to GitHub
git push origin feature-ui-ux

# 3. Merge to main branch (triggers auto-deploy)
git checkout main
git merge feature-ui-ux
git push origin main
```

### Environment Variables on Vercel

Go to **Vercel Dashboard > Your Project > Settings > Environment Variables**

Add the following:

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_BASE_URL` | Your backend URL | `https://resq-backend.onrender.com` |

**Important:** After adding/changing environment variables, you must **redeploy** the project.

### Custom Domain (Optional)

1. Go to **Vercel Dashboard > Your Project > Settings > Domains**
2. Add your custom domain (e.g., `resq.lk`)
3. Follow DNS configuration instructions
4. Vercel automatically provides SSL certificate

---

## Backend Deployment Options

Choose one of these platforms for deploying your backend:

### Option 1: Render.com (Recommended)

**Pros:**
- Free tier available
- Automatic HTTPS
- Easy deployment from Git
- Good for production

**Deployment Steps:**

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select branch: `main`

3. **Configure Service**
   ```
   Name: resq-backend
   Region: Singapore (closest to Sri Lanka)
   Branch: main
   Root Directory: src/web-dashboard/backend
   
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resq-production
   JWT_SECRET=your-super-secret-key-change-this-in-production
   OPENWEATHER_API_KEY=your-openweather-api-key
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (5-10 minutes)
   - Your backend will be available at: `https://resq-backend.onrender.com`

6. **Update Frontend**
   - Go to Vercel
   - Update `VITE_API_BASE_URL` to your Render URL
   - Redeploy frontend

---

### Option 2: Railway.app

**Pros:**
- Very easy setup
- Free $5 credit per month
- Automatic HTTPS
- Fast deployment

**Deployment Steps:**

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure**
   ```
   Root Directory: src/web-dashboard/backend
   
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables** (Same as Render)

5. **Generate Domain**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Your backend URL will be: `https://resq-backend.up.railway.app`

---

### Option 3: AWS EC2 (Advanced)

**Pros:**
- Full control
- Scalable
- Production-grade

**Cons:**
- More complex setup
- Paid service (~$10-20/month)

**Quick Setup:**

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Clone repository
git clone https://github.com/disaster-response-sl/resq.git
cd resq/src/web-dashboard/backend

# 6. Install dependencies
npm install

# 7. Create .env file
nano .env
# Add all environment variables

# 8. Start with PM2
pm2 start app.js --name resq-backend
pm2 save
pm2 startup

# 9. Install Nginx (reverse proxy)
sudo apt install nginx

# 10. Configure Nginx
sudo nano /etc/nginx/sites-available/resq
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.resq.lk;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/resq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.resq.lk
```

---

## Database Setup (MongoDB Atlas)

### Create MongoDB Atlas Cluster

1. **Sign Up**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **FREE** tier (M0 Sandbox)
   - Select region: **Singapore** (closest to Sri Lanka)
   - Cluster name: `resq-cluster`

3. **Create Database User**
   - Database Access → Add New Database User
   - Username: `resq-admin`
   - Password: Generate secure password (save it!)
   - User Privileges: **Atlas admin**

4. **Network Access**
   - Network Access → Add IP Address
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your backend server's IP address

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://resq-admin:<password>@resq-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add database name: `resq-production`
   ```
   mongodb+srv://resq-admin:yourpassword@resq-cluster.xxxxx.mongodb.net/resq-production?retryWrites=true&w=majority
   ```

6. **Seed Initial Data**
   ```bash
   # On your local machine, update .env with Atlas connection string
   MONGO_URI=mongodb+srv://resq-admin:yourpassword@resq-cluster.xxxxx.mongodb.net/resq-production

   # Run seed script
   cd src/web-dashboard/backend
   npm run seed
   ```

---

## Environment Variables

### Frontend (.env)

Create `.env` in `src/web-dashboard/frontend/`:

```bash
# Production Backend URL
VITE_API_BASE_URL=https://resq-backend.onrender.com

# Or for Railway
# VITE_API_BASE_URL=https://resq-backend.up.railway.app

# Or for AWS
# VITE_API_BASE_URL=https://api.resq.lk
```

### Backend (.env)

Create `.env` in `src/web-dashboard/backend/`:

```bash
# Environment
NODE_ENV=production

# Server
PORT=5000

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://resq-admin:yourpassword@resq-cluster.xxxxx.mongodb.net/resq-production?retryWrites=true&w=majority

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# API Keys
OPENWEATHER_API_KEY=your-openweather-api-key-here
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key-here

# CORS Origins (Comma separated)
ALLOWED_ORIGINS=https://resq-frontend.vercel.app,https://www.resq.lk

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### How to Generate Secure JWT Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Using online generator
# Visit: https://www.grc.com/passwords.htm
```

---

## Post-Deployment Checklist

### 1. Test All Endpoints

```bash
# Backend Health Check
curl https://resq-backend.onrender.com/api/health

# Expected response:
# {"status":"ok","message":"Backend server is running","timestamp":"2025-11-30T..."}

# Test SOS endpoint
curl https://resq-backend.onrender.com/api/public/sos-signals

# Test Road Reports
curl https://resq-backend.onrender.com/api/public/road-reports
```

### 2. Test Frontend

Visit your Vercel URL and test:
- ✅ Dashboard loads without errors
- ✅ Location displays correctly (coordinates or location name)
- ✅ Weather data loads
- ✅ Risk assessment shows
- ✅ Emergency contacts work
- ✅ LankaRouteWatch displays reports
- ✅ Safe routes search works
- ✅ Map displays markers
- ✅ SOS emergency button works
- ✅ Relief tracker shows camps

### 3. Check Browser Console

- ✅ No CORS errors
- ✅ No 403 Forbidden errors
- ✅ No API_BASE_URL undefined errors
- ✅ All API calls return 200 OK

### 4. Mobile Responsiveness

Test on different screen sizes:
- ✅ Emergency contact cards: 2 columns on mobile
- ✅ LankaRouteWatch stats: 2 columns on mobile
- ✅ Location card: No "Change" button
- ✅ All buttons are tappable
- ✅ Text is readable

### 5. Performance Optimization

#### Enable Compression (Backend)

Install compression middleware:
```bash
npm install compression
```

Update `app.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

#### Add Caching Headers

```javascript
// Cache static data for 5 minutes
app.use('/api/public/road-reports', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### 6. Security Hardening

#### Update CORS in Production

In `app.js`, update allowed origins:
```javascript
const allowedOrigins = [
  'https://resq-frontend.vercel.app',
  'https://www.resq.lk',
  'https://resq.lk'
];
```

#### Enable HTTPS Only

```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

#### Rate Limiting

Already configured in `app.js`:
- 10,000 requests per 15 minutes for general API
- 5 requests per 15 minutes for auth endpoints

### 7. Database Backups

#### MongoDB Atlas Auto Backups
- Go to Cluster → Backup tab
- Enable **Continuous Backup** (Free tier has daily snapshots)
- Set retention period: 7 days minimum

#### Manual Backup Script

```bash
# Create backup script
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb+srv://resq-admin:password@cluster.mongodb.net/resq-production" \
  --out="$BACKUP_DIR/backup_$DATE"

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
```

```bash
# Make executable
chmod +x backup-db.sh

# Run backup
./backup-db.sh
```

---

## Monitoring & Maintenance

### 1. Uptime Monitoring

**Free Options:**
- **UptimeRobot** (https://uptimerobot.com)
  - Monitor both frontend and backend
  - Get email alerts when site goes down
  - Free tier: 50 monitors, 5-minute checks

**Setup:**
1. Create account
2. Add monitor for: `https://resq-backend.onrender.com/api/health`
3. Add monitor for: `https://resq-frontend.vercel.app`
4. Set alert contacts (email, SMS)

### 2. Error Tracking

**Sentry** (Recommended)
```bash
# Install Sentry
cd src/web-dashboard/frontend
npm install @sentry/react

cd ../backend
npm install @sentry/node
```

**Frontend Setup:**
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

**Backend Setup:**
```javascript
// app.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "your-sentry-dsn" });
```

### 3. Analytics

**Google Analytics 4**
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 4. Log Management

**Backend Logs:**

```javascript
// Use Winston for better logging
npm install winston

// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

### 5. Performance Monitoring

**Key Metrics to Track:**
- API response times
- Database query times
- Frontend page load times
- Error rates
- User locations (for disaster zone identification)

**Tools:**
- **Vercel Analytics** (Frontend - built-in)
- **MongoDB Atlas Performance Advisor** (Database)
- **New Relic** or **Datadog** (Full stack - paid)

---

## Scaling Considerations

### When to Scale

Scale when you experience:
- Response times > 2 seconds
- CPU usage > 80% consistently
- Memory usage > 80%
- Database connection errors
- 500+ concurrent users

### Frontend Scaling

Vercel handles this automatically:
- CDN distribution worldwide
- Automatic scaling
- No action needed

### Backend Scaling

**Render.com:**
- Upgrade from Free tier to Starter ($7/month)
- Enable auto-scaling (scales up to 10 instances)

**AWS EC2:**
- Use Auto Scaling Groups
- Add Load Balancer
- Deploy to multiple availability zones

**Database Scaling:**
- Upgrade MongoDB Atlas tier (M10: $0.08/hr)
- Enable sharding for large datasets
- Add read replicas for heavy read operations

---

## Troubleshooting Common Issues

### Issue 1: CORS Errors After Deployment

**Problem:** Frontend can't access backend API

**Solution:**
```javascript
// backend/app.js
const allowedOrigins = [
  'https://resq-frontend.vercel.app',
  'https://www.yourdomain.com',
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Issue 2: Environment Variables Not Working

**Vercel:**
- Variables must start with `VITE_`
- Redeploy after adding variables

**Backend:**
- Check .env file is not in .gitignore (it should be!)
- Add variables in hosting platform dashboard
- Restart service after adding variables

### Issue 3: Database Connection Timeout

**Solution:**
```javascript
// Increase connection timeout
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

**Also check:**
- MongoDB Atlas IP whitelist includes backend server IP
- Connection string has correct password
- Database user has correct permissions

### Issue 4: Slow API Response

**Diagnose:**
```javascript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

**Solutions:**
- Add database indexes
- Implement caching (Redis)
- Optimize queries (use `.lean()` for read-only)
- Enable compression

### Issue 5: 500 Internal Server Error

**Check Logs:**

**Render:**
- Dashboard → Your Service → Logs

**Railway:**
- Project → Service → Deployments → View Logs

**Common Causes:**
- Missing environment variables
- Database connection failed
- Syntax errors in code
- Missing npm packages

---

## Cost Estimation

### Free Tier (Suitable for MVP/Testing)

| Service | Cost | Limits |
|---------|------|--------|
| Vercel (Frontend) | $0 | 100GB bandwidth/month |
| Render (Backend) | $0 | 750 hours/month (sleeps after 15 min inactivity) |
| MongoDB Atlas | $0 | 512MB storage, Shared CPU |
| **Total** | **$0/month** | Good for 1,000-5,000 users/month |

### Production Tier (Recommended)

| Service | Cost | Features |
|---------|------|----------|
| Vercel Pro | $20/month | No sleep, faster builds |
| Render Starter | $7/month | Always on, 512MB RAM |
| MongoDB M10 | $57/month | 10GB storage, Dedicated CPU |
| **Total** | **$84/month** | Supports 50,000+ users/month |

### Enterprise Tier (High Traffic)

| Service | Cost | Features |
|---------|------|----------|
| Vercel Enterprise | Custom | Premium support, SLA |
| AWS EC2 t3.medium | $30/month | 2 vCPU, 4GB RAM |
| MongoDB M30 | $207/month | 40GB storage, 2GB RAM |
| CloudFront CDN | ~$20/month | Global distribution |
| **Total** | **~$257/month** | Supports 500,000+ users/month |

---

## Deployment Checklist

Print this and check off as you deploy:

### Pre-Deployment
- [ ] All code committed and pushed to GitHub
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] API endpoints tested locally
- [ ] Mobile responsiveness verified

### Database
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] IP whitelist configured
- [ ] Connection string tested
- [ ] Initial data seeded

### Backend
- [ ] Hosting platform account created
- [ ] Repository connected
- [ ] Build and start commands configured
- [ ] All environment variables added
- [ ] Health check endpoint tested
- [ ] CORS properly configured

### Frontend
- [ ] Vercel deployment successful
- [ ] VITE_API_BASE_URL points to backend
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All pages load without errors

### Testing
- [ ] Dashboard displays data correctly
- [ ] Location geocoding works
- [ ] Weather data loads
- [ ] Emergency contacts functional
- [ ] LankaRouteWatch shows reports
- [ ] Safe routes search works
- [ ] Mobile layout correct (2 columns)
- [ ] No console errors

### Monitoring
- [ ] Uptime monitoring configured
- [ ] Error tracking installed
- [ ] Analytics added
- [ ] Backup strategy implemented

### Security
- [ ] JWT secret is strong and unique
- [ ] Database password is strong
- [ ] CORS whitelist updated
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

### Documentation
- [ ] Deployment guide updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Team members have access

---

## Support & Resources

### Official Documentation
- **Vercel:** https://vercel.com/docs
- **Render:** https://render.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **Express.js:** https://expressjs.com
- **React:** https://react.dev

### Community Support
- **Stack Overflow:** Tag your questions with `vercel`, `render`, `mongodb`
- **GitHub Issues:** Open issues in your repository
- **Discord:** Join Render Discord, Vercel Discord

### Emergency Contacts

**Critical Production Issues:**
1. Check status pages:
   - https://www.vercelstatus.com
   - https://status.render.com
   - https://status.mongodb.com

2. Check server logs

3. Roll back to previous deployment if needed:
   ```bash
   # Vercel: Go to Deployments → Previous deployment → Promote to Production
   # Render: Go to Deploys → Previous deploy → Redeploy
   ```

---

## Next Steps After Deployment

1. **Set up monitoring** (Week 1)
   - Configure UptimeRobot
   - Install Sentry
   - Set up Google Analytics

2. **Optimize performance** (Week 2)
   - Add database indexes
   - Implement caching
   - Optimize images

3. **Enhance security** (Week 2)
   - Security audit
   - Penetration testing
   - Update dependencies

4. **User feedback** (Ongoing)
   - Set up feedback form
   - Monitor error reports
   - Track usage analytics

5. **Regular maintenance**
   - Weekly: Check error logs
   - Monthly: Update dependencies
   - Quarterly: Performance review
   - Annually: Security audit

---

## Conclusion

Your ResQ platform is now ready for production deployment! Follow this guide step by step, and you'll have a fully functional, scalable disaster response platform serving Sri Lanka.

**Remember:**
- Start with free tier to validate
- Monitor closely in first week
- Respond to user feedback quickly
- Keep documentation updated

Good luck! 🚀

---

**Document Version:** 1.0  
**Last Updated:** November 30, 2025  
**Maintained By:** ResQ Development Team  
**Contact:** support@resq.lk
