# 🔒 Security Checklist - National Disaster Platform

**Purpose**: Comprehensive security hardening guide before production deployment  
**Target Audience**: Development team, security auditors, government IT reviewers  
**Status**: Pre-production security requirements

---

## ⚠️ CRITICAL: Pre-Deployment Security

### 🚨 Priority 1: Exposed Secrets (MUST FIX IMMEDIATELY)

**Status**: 🔴 **CRITICAL - Blocks Production Deployment**

#### Actions Required:

- [ ] **Remove .env files from Git repository**
  ```bash
  git rm --cached src/web-dashboard/backend/.env
  git rm --cached src/web-dashboard/backend/.env.commercial-bank
  git commit -m "security: remove exposed environment files"
  git push origin main
  ```

- [ ] **Rotate MongoDB credentials**
  - [ ] Create new database user in MongoDB Atlas
  - [ ] Generate strong password (min 20 characters, mixed case, numbers, symbols)
  - [ ] Update connection string in Render environment variables
  - [ ] Delete old database user
  - [ ] Test connection with new credentials

- [ ] **Generate new JWT secret**
  ```bash
  openssl rand -hex 32
  ```
  - [ ] Update in Render environment variables
  - [ ] Never use the exposed secret: `9a4452451f01f34715307bf6525721964dabb...`

- [ ] **Rotate Gemini API key**
  - [ ] Generate new key at https://makersuite.google.com/app/apikey
  - [ ] Update in Render environment variables
  - [ ] Delete exposed key: `AIzaSyAySlceirSTQh0-_tuFI1vl6CEdY4nZWHg`

- [ ] **Update .gitignore**
  ```bash
  echo "*.env" >> .gitignore
  echo "!.env.example" >> .gitignore
  echo "!.env.production.example" >> .gitignore
  git add .gitignore
  git commit -m "security: update gitignore to prevent env file commits"
  ```

- [ ] **Audit Git history for other secrets**
  ```bash
  # Check for exposed keys
  git log --all --full-history -p -- "*.env"
  
  # If found, consider using BFG Repo-Cleaner to remove from history
  ```

---

## 🔐 Authentication & Authorization

### JWT Configuration

- [ ] **Use strong JWT secret** (minimum 256 bits)
  ```javascript
  // ✅ Good
  JWT_SECRET=9a4452451f01f34715307bf6525721964dabb6dc86d80e381fbdea2ad685da86d829921575a6b77be024ad96d517df7449e3f9373d1b9dad346977e4acbc022a
  
  // ❌ Bad
  JWT_SECRET=mysecret123
  ```

- [ ] **Set appropriate token expiration**
  - [ ] Access tokens: 15-60 minutes
  - [ ] Refresh tokens: 7 days (implement if needed)
  - [ ] Current: 24h (acceptable for MVP, but consider shorter)

- [ ] **Implement token refresh mechanism** (future enhancement)
  ```javascript
  // Recommended for production
  JWT_EXPIRES_IN=15m
  REFRESH_TOKEN_EXPIRES_IN=7d
  ```

### Password Security

- [ ] **Verify password hashing** in authentication routes
  ```javascript
  // Check in src/web-dashboard/backend/routes/auth.js
  // Should use bcrypt with salt rounds >= 10
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);
  ```

- [ ] **Implement password complexity requirements**
  - [ ] Minimum 8 characters
  - [ ] Mix of uppercase, lowercase, numbers
  - [ ] Special characters recommended

- [ ] **Add rate limiting on login endpoint**
  ```javascript
  const rateLimit = require('express-rate-limit');
  
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later'
  });
  
  app.post('/api/auth/login', loginLimiter, authController.login);
  ```

### Role-Based Access Control (RBAC)

- [ ] **Verify middleware protects admin routes**
  ```javascript
  // Check all /api/admin/* routes use requireAdmin middleware
  router.use('/api/admin/*', authenticateToken, requireAdmin);
  ```

- [ ] **Verify responder routes are protected**
  ```javascript
  // Check all /api/responder/* routes use requireResponder
  router.use('/api/responder/*', authenticateToken, requireResponder);
  ```

- [ ] **Test unauthorized access attempts**
  - [ ] Citizen trying to access admin endpoints → 403 Forbidden
  - [ ] Responder trying to access admin-only features → 403 Forbidden
  - [ ] Unauthenticated user → 401 Unauthorized

---

## 🌐 API Security

### CORS Configuration

- [ ] **Configure CORS for production domains only**
  ```javascript
  // src/web-dashboard/backend/app.js
  const cors = require('cors');
  
  const corsOptions = {
    origin: process.env.FRONTEND_URL, // Your Vercel domain
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  app.use(cors(corsOptions));
  ```

- [ ] **Test CORS from unauthorized domains** → Should be blocked

### Rate Limiting

- [ ] **Install express-rate-limit**
  ```bash
  cd src/web-dashboard/backend
  npm install express-rate-limit
  ```

- [ ] **Apply global rate limiting**
  ```javascript
  const rateLimit = require('express-rate-limit');
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', limiter);
  ```

- [ ] **Stricter limits for sensitive endpoints**
  ```javascript
  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  });
  
  app.post('/api/auth/login', strictLimiter, ...);
  app.post('/api/mobile/sos', strictLimiter, ...);
  ```

### Input Validation

- [ ] **Install express-validator**
  ```bash
  npm install express-validator
  ```

- [ ] **Add validation middleware to all POST/PUT routes**
  ```javascript
  const { body, validationResult } = require('express-validator');
  
  // Example: SOS endpoint
  router.post('/api/mobile/sos', [
    body('priority').isIn(['low', 'medium', 'high', 'critical']),
    body('location.coordinates').isArray({ min: 2, max: 2 }),
    body('location.coordinates.*').isFloat(),
    body('description').optional().isString().trim().isLength({ max: 500 })
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request...
  });
  ```

- [ ] **Sanitize user inputs**
  ```javascript
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize()); // Prevent NoSQL injection
  ```

### Request Size Limits

- [ ] **Set body parser limits**
  ```javascript
  app.use(express.json({ limit: '10mb' })); // Adjust based on needs
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  ```

- [ ] **Implement file upload limits** (if file upload is enabled)
  ```javascript
  const multer = require('multer');
  const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  });
  ```

---

## 🛡️ HTTP Security Headers

### Install Helmet.js

- [ ] **Install helmet**
  ```bash
  cd src/web-dashboard/backend
  npm install helmet
  ```

- [ ] **Configure helmet middleware**
  ```javascript
  const helmet = require('helmet');
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL]
      }
    },
    crossOriginEmbedderPolicy: false, // Required for maps
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  ```

### Security Headers Verification

- [ ] **Test security headers** using https://securityheaders.com
  - Expected headers:
    - ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains`
    - ✅ `X-Frame-Options: DENY`
    - ✅ `X-Content-Type-Options: nosniff`
    - ✅ `X-XSS-Protection: 1; mode=block`
    - ✅ `Referrer-Policy: strict-origin-when-cross-origin`
    - ✅ `Content-Security-Policy: ...`

---

## 🔒 Database Security

### MongoDB Configuration

- [ ] **Enable authentication** (already enabled in Atlas)

- [ ] **Use strong database passwords**
  - [ ] Minimum 20 characters
  - [ ] Mix of uppercase, lowercase, numbers, symbols
  - [ ] Generated using password manager

- [ ] **Restrict network access**
  - [ ] MongoDB Atlas → Network Access
  - [ ] Add specific Render IP ranges (preferred)
  - [ ] Or use 0.0.0.0/0 with strong password

- [ ] **Enable database auditing** (Atlas M10+ tier)

- [ ] **Set up automated backups**
  - [ ] MongoDB Atlas → Backup (enabled by default)
  - [ ] Retention: 7 days minimum
  - [ ] Test restore procedure

### Query Security

- [ ] **Prevent NoSQL injection**
  ```javascript
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize({
    replaceWith: '_'
  }));
  ```

- [ ] **Use parameterized queries** (Mongoose does this automatically)
  ```javascript
  // ✅ Safe
  User.findOne({ username: req.body.username });
  
  // ❌ Dangerous (avoid raw queries)
  db.collection('users').find({ $where: req.body.query });
  ```

---

## 🔑 API Keys & Secrets Management

### Environment Variables

- [ ] **Never hardcode secrets in code**
  ```javascript
  // ✅ Good
  const apiKey = process.env.GEMINI_API_KEY;
  
  // ❌ Bad
  const apiKey = 'AIzaSyAySlceirSTQh0-_tuFI1vl6CEdY4nZWHg';
  ```

- [ ] **Use different secrets for dev/staging/production**

- [ ] **Document all required environment variables**
  - [ ] Create `.env.example` files
  - [ ] Document in DEPLOYMENT_GUIDE.md

### Third-Party API Keys

- [ ] **Gemini API Key**: Rotated and secured
- [ ] **MPGS Payment Gateway**: Using test credentials (rotate for production)
- [ ] **SLUDI/eSignet**: Using mock (get production credentials from ICTA)

### Secret Rotation Schedule

- [ ] **Implement 90-day rotation policy**
  - [ ] JWT secrets
  - [ ] Database passwords
  - [ ] API keys

---

## 🚨 SOS & Emergency Features Security

### SOS Signal Validation

- [ ] **Prevent spam/abuse**
  ```javascript
  // Rate limit SOS endpoint aggressively
  const sosLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // 1 SOS per minute per user
    message: 'You can only send one SOS signal per minute'
  });
  
  router.post('/api/mobile/sos', authenticateToken, sosLimiter, ...);
  ```

- [ ] **Validate location data**
  ```javascript
  // Check coordinates are within Sri Lanka bounds
  const SRI_LANKA_BOUNDS = {
    minLat: 5.9, maxLat: 9.9,
    minLng: 79.5, maxLng: 81.9
  };
  
  if (!isWithinBounds(location, SRI_LANKA_BOUNDS)) {
    return res.status(400).json({ error: 'Invalid location' });
  }
  ```

### Emergency Data Protection

- [ ] **Encrypt sensitive SOS data at rest** (future enhancement)
- [ ] **Audit log all SOS signal access**
- [ ] **Implement HIPAA-compliant storage for medical data** (if applicable)

---

## 💳 Payment Gateway Security

### Commercial Bank MPGS

- [ ] **Use HTTPS only** for payment endpoints

- [ ] **Validate payment amounts server-side**
  ```javascript
  // Never trust client-side amount
  const amount = calculateAmount(donationType); // Server calculation
  ```

- [ ] **Implement payment verification**
  ```javascript
  // Verify payment callback authenticity
  const isValidCallback = verifyMPGSSignature(req.body, req.headers);
  if (!isValidCallback) {
    return res.status(403).json({ error: 'Invalid payment callback' });
  }
  ```

- [ ] **PCI DSS Compliance**
  - [ ] Never store credit card numbers
  - [ ] Never log payment details
  - [ ] Use MPGS hosted checkout (already implemented ✅)

### Donation Security

- [ ] **Rate limit donation attempts**
  ```javascript
  const donationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 donation attempts per hour
  });
  ```

- [ ] **Implement fraud detection** (future enhancement)
  - Unusual donation patterns
  - Same IP, multiple cards
  - Rapid-fire donations

---

## 📱 Mobile App Security

### API Communication

- [ ] **Use HTTPS only**
  ```typescript
  // In api.ts
  export const API_BASE_URL = 'https://[RENDER_URL].onrender.com/api';
  // Never use HTTP in production
  ```

- [ ] **Implement certificate pinning** (future enhancement)
  ```typescript
  // React Native SSL Pinning
  import { NetworkSecurityConfig } from 'react-native-network-security-config';
  ```

### Local Storage Security

- [ ] **Encrypt sensitive data in AsyncStorage**
  ```typescript
  import EncryptedStorage from 'react-native-encrypted-storage';
  
  // Store JWT token encrypted
  await EncryptedStorage.setItem('auth_token', token);
  ```

- [ ] **Never store passwords locally**

- [ ] **Implement biometric authentication** (future enhancement)

### Code Obfuscation

- [ ] **Enable ProGuard for Android**
  ```gradle
  // android/app/build.gradle
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
  }
  ```

- [ ] **Enable Hermes for React Native** (already enabled ✅)

---

## 🔍 Logging & Monitoring

### Security Logging

- [ ] **Log all authentication attempts**
  ```javascript
  logger.info('Login attempt', { 
    username, 
    ip: req.ip, 
    userAgent: req.headers['user-agent'],
    success: true 
  });
  ```

- [ ] **Log failed authorization attempts**
  ```javascript
  logger.warn('Unauthorized access attempt', {
    userId,
    role,
    requiredRole,
    endpoint: req.path,
    ip: req.ip
  });
  ```

- [ ] **Never log sensitive data**
  ```javascript
  // ❌ Bad
  logger.info('User login', { password: req.body.password });
  
  // ✅ Good
  logger.info('User login', { username: req.body.username });
  ```

### Error Handling

- [ ] **Don't expose stack traces in production**
  ```javascript
  app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err });
    
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });
  ```

### Security Monitoring

- [ ] **Set up Sentry for error tracking**
  ```javascript
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  });
  ```

- [ ] **Monitor for suspicious activity**
  - Repeated failed login attempts
  - Unusual API usage patterns
  - Geographic anomalies

---

## 🧪 Security Testing

### Pre-Deployment Testing

- [ ] **Vulnerability scanning**
  ```bash
  # Check dependencies for known vulnerabilities
  npm audit
  npm audit fix
  ```

- [ ] **OWASP Top 10 testing**
  - [ ] Injection attacks (SQL, NoSQL, XSS)
  - [ ] Broken authentication
  - [ ] Sensitive data exposure
  - [ ] XML external entities (XXE)
  - [ ] Broken access control
  - [ ] Security misconfiguration
  - [ ] Cross-site scripting (XSS)
  - [ ] Insecure deserialization
  - [ ] Using components with known vulnerabilities
  - [ ] Insufficient logging & monitoring

- [ ] **Penetration testing** (recommended for government deployment)
  - Hire security professional
  - Test all attack vectors
  - Document findings and remediation

### Automated Security Scanning

- [ ] **Set up GitHub Dependabot**
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
  ```

- [ ] **Add security linting**
  ```bash
  npm install --save-dev eslint-plugin-security
  ```

---

## 📋 Production Security Checklist

### Before Going Live

- [ ] All secrets removed from Git
- [ ] All credentials rotated
- [ ] HTTPS enforced everywhere
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled on all API endpoints
- [ ] Input validation on all user inputs
- [ ] Helmet.js configured with strict CSP
- [ ] MongoDB network access restricted
- [ ] JWT secrets are 256-bit random
- [ ] Error messages don't expose internals
- [ ] Logging enabled (no sensitive data)
- [ ] Monitoring configured (Sentry/Uptime)
- [ ] Security headers verified (A+ rating)
- [ ] npm audit shows 0 vulnerabilities
- [ ] OWASP Top 10 testing complete
- [ ] Backup and restore tested
- [ ] Disaster recovery plan documented
- [ ] Security contact established (security@yourdomain.lk)

### Government Compliance

- [ ] **Data Protection Act (Sri Lanka) compliance**
  - [ ] User data handled per regulations
  - [ ] Privacy policy published
  - [ ] Terms of service published
  - [ ] User consent for data collection

- [ ] **Security documentation prepared**
  - [ ] Security architecture diagram
  - [ ] Data flow diagrams
  - [ ] Threat model
  - [ ] Incident response plan

- [ ] **Audit trail**
  - [ ] All admin actions logged
  - [ ] User access logged
  - [ ] Data changes tracked

---

## 🆘 Incident Response Plan

### Security Breach Procedure

1. **Detection**
   - Monitor logs for anomalies
   - Set up alerts for suspicious activity

2. **Containment**
   - Disable compromised accounts
   - Rotate compromised credentials
   - Block malicious IPs

3. **Investigation**
   - Review logs
   - Identify scope of breach
   - Document findings

4. **Recovery**
   - Restore from backups if necessary
   - Deploy security patches
   - Test system integrity

5. **Post-Incident**
   - Notify affected users
   - Report to authorities (if required)
   - Update security measures
   - Document lessons learned

### Emergency Contacts

- **Security Team Lead**: [Name, Phone, Email]
- **Database Administrator**: [Name, Phone, Email]
- **Government IT Contact**: [Name, Phone, Email]
- **Hosting Support**: Render, Vercel support

---

## 📊 Security Metrics

### Track Monthly

- [ ] Failed login attempts
- [ ] API rate limit violations
- [ ] Security audit findings
- [ ] Dependency vulnerabilities
- [ ] Uptime percentage
- [ ] Mean time to detect (MTTD)
- [ ] Mean time to resolve (MTTR)

---

## ✅ Security Sign-Off

**Deployment Approval**: Requires sign-off from:

- [ ] Development Lead
- [ ] Security Auditor (if applicable)
- [ ] Database Administrator
- [ ] Project Manager

**Date**: _______________  
**Approved By**: _______________

---

**Security is an ongoing process, not a one-time checklist. Regular audits and updates are essential for maintaining a secure platform.**
