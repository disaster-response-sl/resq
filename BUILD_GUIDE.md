# ResQ Platform - Build & Run Guide

Complete guide for building and running the ResQ National Disaster Platform locally and deploying to production.

## Table of Contents
- [Quick Start](#quick-start)
- [Local Development Setup](#local-development-setup)
- [Building for Production](#building-for-production)
- [Common Issues & Solutions](#common-issues--solutions)

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Clone & Install (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/disaster-response-sl/resq.git
cd resq

# 2. Install backend dependencies
cd src/web-dashboard/backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup (2 minutes)

#### Backend `.env`
Create `src/web-dashboard/backend/.env`:
```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/resq-dev
JWT_SECRET=dev-secret-key-change-in-production
OPENWEATHER_API_KEY=your-api-key
GOOGLE_GEMINI_API_KEY=your-api-key
```

#### Frontend `.env`
Create `src/web-dashboard/frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:5000
```

### Run Development Servers (2 terminals)

**Terminal 1 - Backend:**
```bash
cd src/web-dashboard/backend
npm run dev
```
✅ Backend running at http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd src/web-dashboard/frontend
npm run dev
```
✅ Frontend running at http://localhost:5173 or http://localhost:5174

### Test the Application
Open http://localhost:5173 in your browser.

---

## Local Development Setup

### Database Options

#### Option 1: Local MongoDB (Recommended for Development)

**Install MongoDB:**

**Windows:**
```powershell
# Download from: https://www.mongodb.com/try/download/community
# Install and start MongoDB service
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Verify Installation:**
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

#### Option 2: MongoDB Atlas (Cloud - Free)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Get connection string
4. Update `.env`:
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resq-dev
```

### Seed Development Data

```bash
cd src/web-dashboard/backend
npm run seed
```

This creates:
- 2 road reports (Kaduwela)
- Sample districts
- Test disaster zones
- Emergency contacts

### API Testing

Test backend endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Get road reports
curl http://localhost:5000/api/public/road-reports

# Get SOS signals
curl http://localhost:5000/api/public/sos-signals
```

---

## Building for Production

### Frontend Build

```bash
cd src/web-dashboard/frontend

# Build for production
npm run build

# Output: dist/ folder with optimized files
```

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    # Minified JS
│   ├── index-[hash].css   # Minified CSS
│   └── images/            # Optimized images
└── ...
```

### Preview Production Build Locally

```bash
npm run preview
# Opens at http://localhost:4173
```

### Backend Preparation

```bash
cd src/web-dashboard/backend

# Install production dependencies only
npm ci --production

# Or install all dependencies
npm install
```

### Build Verification Checklist

Before deploying to production:

**Frontend:**
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] `dist/` folder created
- [ ] All images load in preview
- [ ] API calls use correct base URL

**Backend:**
- [ ] `npm install` completes without errors
- [ ] All required environment variables set
- [ ] Database connection works
- [ ] Health endpoint returns 200 OK
- [ ] CORS configured for production domains

---

## Common Issues & Solutions

### Issue 1: "Module not found" errors

**Problem:** Missing dependencies

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or clear npm cache
npm cache clean --force
npm install
```

### Issue 2: Backend won't start - "Port already in use"

**Problem:** Port 5000 is occupied

**Solution:**

**Windows:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
# In .env: PORT=5001
```

**Mac/Linux:**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### Issue 3: Frontend won't connect to backend

**Problem:** CORS or wrong API URL

**Solution:**

1. Check `.env` file:
```bash
# Should be:
VITE_API_BASE_URL=http://localhost:5000

# NOT:
VITE_API_BASE_URL=http://localhost:5000/  # No trailing slash!
```

2. Check backend CORS configuration in `app.js`:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',  // Vite default
  'http://localhost:5174',  // Vite alternate
];
```

3. Restart both servers after .env changes

### Issue 4: MongoDB connection fails

**Problem:** Can't connect to database

**Solutions:**

**Local MongoDB:**
```bash
# Check if MongoDB is running
# Windows:
sc query MongoDB

# Mac/Linux:
brew services list | grep mongodb
# or
sudo systemctl status mongodb
```

**MongoDB Atlas:**
- Check IP whitelist (add 0.0.0.0/0 for development)
- Verify username/password in connection string
- Check network connectivity

### Issue 5: "API_BASE_URL is not defined"

**Problem:** Environment variable not loaded

**Solution:**
```typescript
// In component, use:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// NOT just:
// API_BASE_URL  // This won't work!
```

### Issue 6: Build fails with "Out of memory"

**Problem:** Not enough RAM for build

**Solution:**
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Issue 7: Geocoding CORS errors

**Problem:** Direct Nominatim API calls blocked

**Solution:** Already fixed! We use backend proxy:
- Frontend calls: `/api/geocode/reverse`
- Backend proxies to Nominatim with User-Agent header

### Issue 8: Images not loading in production

**Problem:** Incorrect image paths

**Solution:**
```typescript
// Use relative paths:
<img src="/images/lowRisk.png" />  // ✅ Correct

// NOT absolute paths:
<img src="http://localhost:5173/images/lowRisk.png" />  // ❌ Wrong
```

### Issue 9: Hot reload not working

**Problem:** Changes don't reflect immediately

**Solution:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Issue 10: TypeScript errors but app works

**Problem:** Type mismatches

**Solution:**
```bash
# Check types
npm run build

# Fix common issues:
# 1. Add type assertions: data as MyType
# 2. Use optional chaining: data?.field
# 3. Add null checks: if (data)
```

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
cd src/web-dashboard/backend && npm install
cd ../frontend && npm install

# 3. Start backend
cd ../backend
npm run dev

# 4. Start frontend (new terminal)
cd ../frontend
npm run dev

# 5. Make changes and test

# 6. Commit changes
git add .
git commit -m "Description of changes"
git push origin feature-branch
```

### Testing Checklist

Before committing code:

**Functionality:**
- [ ] Dashboard loads without errors
- [ ] Location displays correctly
- [ ] Maps show markers
- [ ] Forms submit successfully
- [ ] Search works
- [ ] Mobile responsive (test with DevTools)

**Console:**
- [ ] No console errors
- [ ] No CORS errors
- [ ] API calls return 200 OK

**Code Quality:**
- [ ] No TypeScript errors: `npm run build`
- [ ] Code formatted: `npm run format` (if configured)
- [ ] No unused imports

---

## Performance Optimization

### Development Mode Optimization

```bash
# Use faster builds
# vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false,  // Disable for faster builds
    minify: 'esbuild', // Faster than terser
  },
});
```

### Production Build Optimization

```bash
# Enable compression
npm install compression

# backend/app.js
const compression = require('compression');
app.use(compression());
```

### Image Optimization

```bash
# Install image optimizer
npm install sharp

# Optimize images before commit
npx sharp -i input.png -o output.webp --webp
```

### Code Splitting

Already configured in Vite! Lazy load routes:

```typescript
// Instead of:
import Dashboard from './Dashboard';

// Use:
const Dashboard = lazy(() => import('./Dashboard'));
```

---

## Debugging Tips

### Backend Debugging

**Enable detailed logging:**
```javascript
// app.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

**Debug MongoDB queries:**
```javascript
mongoose.set('debug', true);
```

**Use Node debugger:**
```bash
node --inspect app.js
# Open chrome://inspect in Chrome
```

### Frontend Debugging

**React DevTools:**
- Install extension: React Developer Tools
- Inspect component state and props

**Network Tab:**
- Check API calls
- Verify request/response
- Check status codes

**Performance Tab:**
- Identify slow renders
- Check memory leaks

---

## Git Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to remote
git push origin feature/new-feature

# 4. Create Pull Request on GitHub

# 5. Merge to main after review
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug in component
docs: Update documentation
style: Format code
refactor: Refactor function
test: Add tests
chore: Update dependencies
```

---

## Environment Variables Reference

### Frontend (.env)

```bash
# Required
VITE_API_BASE_URL=http://localhost:5000

# Optional
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
```

### Backend (.env)

```bash
# Required
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/resq-dev
JWT_SECRET=your-secret-key

# Optional
OPENWEATHER_API_KEY=your-key
GOOGLE_GEMINI_API_KEY=your-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Useful Commands

### Package Management

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update specific package
npm update package-name

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Database Management

```bash
# Connect to MongoDB
mongosh

# Show databases
show dbs

# Use database
use resq-dev

# Show collections
show collections

# Query data
db.roadreports.find().pretty()

# Drop database (careful!)
db.dropDatabase()
```

### Build & Deploy

```bash
# Frontend build
npm run build

# Backend start
npm start

# Backend dev mode
npm run dev

# Run tests
npm test
```

---

## Next Steps

After setting up local environment:

1. **Explore the codebase**
   - Read component files
   - Understand API structure
   - Check database schemas

2. **Make your first change**
   - Add a console.log
   - Change a color
   - Add a button

3. **Test thoroughly**
   - Check browser console
   - Test on mobile
   - Verify API calls

4. **Deploy to production**
   - Follow DEPLOYMENT_GUIDE.md
   - Test in production
   - Monitor for errors

---

## Support

**Need help?**
- Check DEPLOYMENT_GUIDE.md
- Review error messages carefully
- Search Stack Overflow
- Ask team members

**Found a bug?**
- Open GitHub issue
- Include error message
- Provide steps to reproduce

---

**Document Version:** 1.0  
**Last Updated:** November 30, 2025  
**Author:** ResQ Development Team
