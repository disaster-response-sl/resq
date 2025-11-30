const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize app
const app = express();

// Security Middlewares
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs (high for development)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all routes
app.use('/api/', limiter);

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Configure CORS - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://resq-five.vercel.app',
  'https://resq.vercel.app',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel preview deployments
    if (allowedOrigins.indexOf(origin) !== -1 || (origin && origin.includes('.vercel.app'))) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Manual sanitization for NoSQL injection (Express 5 compatible)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  
  next();
});

// Import user & mobile routes
const authRoutes = require('./routes/auth');
const mobileAuthRoutes = require('./routes/mobileAuth.routes');
const publicRoutes = require('./routes/public.routes');
const mapRoutes = require('./routes/map.routes');
const resourceRoutes = require('./routes/resources.routes');
// NDX routes removed - mock DPI integration not needed for production
// const ndxRoutes = require('./routes/ndx.routes');

// Payment/donation routes removed - focusing on disaster response features
// const paymentRoutes = require('./routes/payment.routes');
// const donationRoutes = require('./routes/donation.routes');

// Import admin routes
const adminSosRoutes = require('./routes/admin/sos.routes');
const adminDisastersRoutes = require('./routes/admin/disasters.routes');
const adminAnalyticsRoutes = require('./routes/admin/analytics.routes');
const adminZonesRoutes = require('./routes/admin/zones.routes');
const adminImportExportRoutes = require('./routes/admin/import-export.routes');

// Import responder routes
const responderNotificationsRoutes = require('./routes/responder/notifications.routes');

// Import new feature routes
const missingPersonsRoutes = require('./routes/missing-persons.routes');
const externalDataRoutes = require('./routes/external-data.routes');
const reportsRoutes = require('./routes/reports.routes');
const routesRoutes = require('./routes/routes.js');

// Import services
const SosEscalationService = require('./services/sos-escalation.service');

// Use user & mobile routes (with rate limiting for auth)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mobile', authLimiter, mobileAuthRoutes);
app.use('/api/public', publicRoutes); // Public citizen routes - no auth required
app.use('/api/map', mapRoutes);
app.use('/api/resources', resourceRoutes);

// NDX routes disabled - mock DPI integration not needed for production
// app.use('/api/ndx', ndxRoutes);

// Payment/donation routes disabled - focusing on disaster response features
// app.use('/api/payment', paymentRoutes);
// app.use('/api/donations', donationRoutes);
// app.use('/api/donation', donationRoutes);

// Use admin routes
app.use('/api/admin/sos', adminSosRoutes);
app.use('/api/admin/disasters', adminDisastersRoutes);            // Main CRUD
app.use('/api/admin/analytics', adminAnalyticsRoutes);            // Statistics, Timeline, etc.
app.use('/api/admin/zones', adminZonesRoutes);                    // Avoided conflict by changing path
app.use('/api/admin/import-export', adminImportExportRoutes);     // Import/Export ops

// Use responder routes
app.use('/api/responder/notifications', responderNotificationsRoutes);

// Use new feature routes
app.use('/api/missing-persons', missingPersonsRoutes);
app.use('/api/external', externalDataRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/public', routesRoutes); // LankaRouteWatch routes

// Geocoding proxy to avoid CORS issues with Nominatim
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      console.log('❌ Geocoding error: Missing lat/lon parameters');
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
    }

    console.log(`🌍 Geocoding request: lat=${lat}, lon=${lon}`);

    const axios = require('axios');
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        timeout: 8000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ResQ-Disaster-Platform/1.0'
        }
      }
    );

    if (response.data && response.data.display_name) {
      console.log(`✅ Geocoding success: ${response.data.display_name.substring(0, 50)}...`);
      return res.json({ success: true, data: response.data });
    } else {
      console.log('⚠️ Geocoding returned empty data');
      return res.status(404).json({ 
        success: false, 
        error: 'Location not found' 
      });
    }
  } catch (error) {
    console.error('❌ Geocoding proxy error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch location data',
      fallback: true,
      details: error.message
    });
  }
});

// Health check routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.get('/', (req, res) => res.send("API is running"));
app.get('/api/mobile/test', (req, res) => {
  res.json({ message: 'API working!' });
});
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
    }
  });
});

// 404 handler - return JSON for API routes, HTML for others
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path
    });
  }
  res.status(404).send('Page not found');
});

// Global error handler - always return JSON for API routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Return JSON error for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // HTML error for non-API routes
  res.status(err.status || 500).send(err.message || 'Internal server error');
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/disaster-platform';
console.log('Attempting to connect to MongoDB:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected successfully");

    // Start SOS escalation service after DB connection
    const escalationService = new SosEscalationService();
    escalationService.startScheduler(5); // Check every 5 minutes
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("Using MONGO_URI:", process.env.MONGO_URI ? 'Set' : 'Not set');
    console.log("Falling back to default URI:", mongoUri);
  });

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server accessible at: http://localhost:${PORT}`);
  console.log(`Server accessible at: http://127.0.0.1:${PORT}`);
});
