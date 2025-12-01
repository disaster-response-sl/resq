# 🚨 ResQ - National Disaster Response Platform

[![Production Status](https://img.shields.io/badge/status-production%20deployed-brightgreen)](https://resq-five.vercel.app)
[![Real-Time Data](https://img.shields.io/badge/data-live%20DMC%20API-blue)](https://lk-flood-api.vercel.app)
[![Relief Coordination](https://img.shields.io/badge/relief-Supabase%20API-green)](https://supabase.com)
[![Built For](https://img.shields.io/badge/built%20for-Sri%20Lanka-red)](https://www.dmc.gov.lk)
[![Deployment](https://img.shields.io/badge/frontend-Vercel-black)](https://resq-five.vercel.app)
[![Backend](https://img.shields.io/badge/backend-Render-purple)](https://resq-backend-3efi.onrender.com)

> **🎯 Real-World Disaster Response Platform**  
> **LIVE DEPLOYMENT:** [https://resq-five.vercel.app](https://resq-five.vercel.app)  
> Production-ready emergency response system with **real-time flood monitoring**, **relief coordination**, and **volunteer management**.  
> **39 DMC gauging stations** • **Live relief camps** • **Emergency SOS** • **Volunteer registration** • **No login required for citizens**

## 🌐 Live Deployment

- **Frontend:** [https://resq-five.vercel.app](https://resq-five.vercel.app) (Vercel)
- **Backend:** [https://resq-backend-3efi.onrender.com](https://resq-backend-3efi.onrender.com) (Render)
- **Database:** MongoDB Atlas (Singapore Region)
- **Status:** ✅ Production Ready

## 🚀 Production Ready: 100% Real APIs

Comprehensive disaster response platform powered by **verified government and production data sources**.

### 🌊 Core Features

#### For Citizens (Public Access - No Login Required)
- ✅ **Real-Time Flood Monitoring** - Live water levels from 39 DMC gauging stations (15-min updates)
- ✅ **Interactive Risk Map** - Leaflet-powered map with flood alerts, relief camps, and user location with precise geocoding
- ✅ **Emergency SOS** - One-tap distress signal with GPS location (no authentication required)
- ✅ **Incident Reporting** - Submit reports with photos and location data
- ✅ **Relief Demand & Supply Tracker** - Find nearby help within 5-200km radius with debounced search
- ✅ **Volunteer Registration** - Comprehensive form to offer goods, services, or labor
- ✅ **AI Safety Assistant** - Google Gemini-powered emergency guidance chatbot
- ✅ **Recent Alerts Dashboard** - Real-time DMC flood alerts with severity levels
- ✅ **LankaRouteWatch** - Plan safe routes with location search, road hazard reports, and risk assessment
- ✅ **Emergency Contacts** - Quick access to DDMCU hotlines by district
- ✅ **Location Services** - Accurate reverse geocoding showing street address, city, and district

#### For Admins & Responders (Authenticated Access)
- ✅ **SOS Dashboard** - Real-time emergency signal monitoring with auto-escalation
- ✅ **Disaster Management** - Create, track, and manage disaster events
- ✅ **Live Disaster Heat Map** - Real-time DMC flood data visualization with interactive markers
- ✅ **Resource Management** - Allocate and track emergency supplies
- ✅ **Reports Dashboard** - Citizen incident report review and verification
- ✅ **Relief Camp Dashboard** - Manage help requests and volunteer contributions
- ✅ **Analytics & Metrics** - Comprehensive dashboard with emergency statistics
- ✅ **Role-Based Access** - Individual ID + OTP authentication with JWT tokens
- ✅ **Auto-Escalation** - SOS signals auto-escalate every 5 minutes if unassigned

### 🔌 Production APIs (Zero Mock Data)

#### 1. **DMC Flood Data API** 🌊
- **Source**: [lk-flood-api.vercel.app](https://lk-flood-api.vercel.app)
- **Documentation**: [docs/sriLankaFloodDataAPI.md](./docs/sriLankaFloodDataAPI.md)
- **Data**: Official Sri Lanka Disaster Management Centre flood monitoring
- **Coverage**: 39 gauging stations across all major rivers
- **Update Frequency**: Every 15 minutes
- **Endpoints Used**:
  - `/alerts` - Active flood alerts (MAJOR, MINOR, ALERT status)
  - `/levels/latest` - Latest water levels for all stations
  - `/stations` - Station metadata with GPS coordinates
- **Features**:
  - Water level measurements (meters)
  - Rising/Falling trends
  - Alert status classification
  - Rainfall data (mm)
  - Historical readings

#### 2. **Supabase Relief Coordination API** ⛺
- **Source**: [Supabase Public Data API](https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api)
- **Documentation**: [docs/publicDataAPI.md](./docs/publicDataAPI.md)
- **Data**: Real-time relief camp locations and volunteer contributions
- **Features**:
  - Help Requests (people needing assistance)
  - Volunteer Contributions (people offering support)
  - Location-based search (radius filtering)
  - Urgency levels (emergency, high, medium, low)
  - Establishment types (School, Temple, Kitchen, etc.)
  - Distance calculations (Haversine formula)
- **Query Parameters**:
  - `type` - requests, contributions, or all
  - `status` - pending, resolved, available
  - `urgency` - emergency, high, medium, low
  - `lat`, `lng`, `radius_km` - Location-based filtering
  - `search` - Text search across all fields
  - `limit`, `offset` - Pagination
- **CRUD Operations**:
  - ✅ Create help requests (citizen reports)
  - ✅ Create volunteer contributions (offer support)
  - ✅ Read/Search relief data (public access)
  - ✅ Update status (admin/responder access)

### ❌ Removed Features (Production Focus)
- ❌ **Payment/Donation System** - Streamlined to core disaster response
- ❌ **Mock Government APIs** - NDX, PayDPI sandboxes removed
- ❌ **SLUDI Authentication** - Simplified to Individual ID + OTP for admins
- ❌ **Missing Persons Database** - Requires law enforcement integration (not available)

📖 **[View API Documentation](./docs/)** | **[Deployment Guide](./PRODUCTION_DEPLOYMENT.md)**

---

## 📋 Project Overview

The National Disaster Response Platform is a comprehensive solution consisting of:
- **Citizen Web App**: Public disaster information, emergency SOS, real-time maps (no login required)
- **Mobile App**: React Native application for emergency reporting and real-time alerts
- **Admin Dashboard**: Government interface for disaster management and resource allocation

## 🧑‍🤝‍🧑 Role Types

This platform supports three official user groups in line with Sri Lanka’s real disaster-response structure:

### 👨‍💼 Admin Users

High-level decision-makers who manage national or district disaster operations.

Admins include:

Disaster Management Centre (DMC) Headquarters Officers

District Secretaries (GA)

District Disaster Management Officers

Divisional Secretaries (DS Officers)

Ministry of Digital Economy / ICTA senior system officers

Admin Capabilities:

Create & update disasters

Publish alerts to the public

Assign responders to incidents

Manage resources and supply distribution

Access full analytics dashboard

Monitor nationwide SOS feed

### 🚑 Responder Users

On-ground emergency teams responsible for handling SOS calls, verifying reports, and conducting rescue operations.

Responders include:

Sri Lanka Army Disaster Response Units

Navy Flood Rescue Teams

Air Force Medical / Airlift Response

Sri Lanka Police Emergency Units

Fire & Rescue Department

Civil Security Department (CSD)

Grama Niladhari (GN) officers

Certified Red Cross / CERT-approved responders

Responder Capabilities:

View and prioritize SOS signals

Update response status

Access assigned tasks

Verify on-site incident reports

Report rescued individuals, cleared areas, and resource needs

### 🧍 Citizen Users

General public users.

Citizen Capabilities:

Submit SOS signals

Report incidents (food, shelter, medical, danger)

Upload photos & location

Receive real-time alerts

Access AI safety assistant

## 🎯 Problem Statement

Sri Lanka faces critical gaps in disaster response:
- ❌ Outdated communication systems
- ❌ Resource allocation bottlenecks  
- ❌ Slow government notifications
- ❌ Lack of citizen agency in reporting
- ❌ Fragmented data across systems
- ❌ No centralized volunteer coordination during disasters

## ✨ Key Features & Updates

### 🌐 Citizen Web Portal (Public Access - No Login Required)

#### Emergency Response
- 🚨 **Emergency SOS** - One-tap distress signal with GPS location and priority levels
  - No authentication required
  - Automatic GPS capture
  - Priority levels: High, Medium, Low
  - Optional message field
  
- 📝 **Incident Reporting** - Submit detailed reports with evidence
  - Photo upload capability (up to 5MB)
  - Location confirmation
  - Report types: Food shortage, Shelter, Medical, Danger
  - Status tracking

#### Real-Time Information
- 🌊 **Live Flood Monitoring** - Real-time water levels from 39 DMC gauging stations
  - 15-minute update intervals
  - Water level trends (Rising/Falling)
  - Alert status: MAJOR, MINOR, ALERT, NORMAL
  - Rainfall data and timestamps
  
- 🗺️ **Interactive Risk Map** - Leaflet-powered disaster visualization
  - Flood alerts with custom markers (🌊)
  - Relief camps locations (⛺)
  - User location with accurate geocoding (📍)
  - Shows: "St Mary's Road, Kochchikade, Gampaha District"
  - Clickable markers with detailed info popups

- 📊 **Dashboard Statistics**
  - Total road reports
  - Active disasters
  - Affected districts
  - Blocked routes

#### Relief & Support
- 🆘 **Relief Demand Tracker** - Find nearby assistance
  - Search radius: 5-200km (debounced slider)
  - Distance-sorted results
  - Urgency filtering (emergency, high, medium, low)
  - Shows help requests + volunteer contributions
  - Real-time availability status
  
- 💚 **Volunteer Registration** - Offer support to affected communities
  - Comprehensive form (name, contact, location)
  - Select contribution type (goods, services, labor)
  - Specify resources available
  - Set urgency level
  - Submitted to Supabase Relief API

- 📞 **Emergency Contacts** - District-specific DDMCU hotlines
  - 4 main emergency services (Fire, Police, Ambulance, Disaster)
  - District-specific contacts with direct call buttons
  - Automatic district detection from user location

#### Navigation & Safety
- 🛣️ **LankaRouteWatch** - Safe route planning
  - Location search with Nominatim autocomplete
  - Replace district dropdowns with address search
  - Road hazard reports with distances
  - Risk level assessment (Low/Medium/High)
  - Detailed hazard breakdown when routes blocked
  - Real-time road closure information
  
- 💬 **AI Safety Assistant** - Google Gemini-powered guidance
  - Natural language emergency queries
  - Contextual safety recommendations
  - Quick question templates
  - 24/7 availability

#### Weather & Alerts
- ☁️ **Weather Dashboard** - Current conditions for user location
  - Temperature, humidity, wind speed
  - Weather icons and descriptions
  - Powered by OpenWeatherMap API
  
- 📋 **Recent Alerts Feed** - Latest DMC flood alerts
  - Severity badges (MAJOR, MINOR, ALERT)
  - Station names and river information
  - Water level changes
  - Sortable and filterable

### 🔐 Admin & Responder Dashboard (Authenticated Access)

#### Authentication & Access Control
- 👥 **Role-Based Authentication**
  - Individual ID + OTP login
  - JWT token-based sessions
  - 24-hour token expiration
  - Admin vs Responder permissions
  - Secure logout

#### Emergency Management
- 🚨 **SOS Dashboard** - Real-time emergency monitoring
  - Live signal feed from MongoDB
  - Auto-escalation every 5 minutes
  - Priority sorting (High → Medium → Low)
  - Status management (Pending → Assigned → Resolved)
  - GPS coordinates display
  - Responder assignment workflow
  
- 📝 **Reports Dashboard** - Citizen incident management
  - Review submitted reports with photos
  - Status updates (Pending → Verified → Resolved)
  - Filter by type (food, shelter, medical, danger)
  - Location and timestamp information
  - Batch operations

#### Disaster Operations
- 🗺️ **Live Disaster Heat Map** - Real-time DMC flood visualization
  - 39 gauging station markers
  - Color-coded alert status
  - Water level display
  - Rising/Falling indicators
  - Interactive popups
  - Auto-refresh every 5 minutes
  
- 🔥 **Disaster Management** - Create and track events
  - Disaster type selection (Flood, Landslide, Fire, etc.)
  - Severity levels (Low, Medium, High, Critical)
  - Affected districts and locations
  - Description and status tracking
  - Timeline management

#### Analytics & Insights
- 📊 **Analytics Dashboard** - Comprehensive metrics
  - Emergency Statistics
    - Total citizen reports
    - Pending reports count
    - Active disasters
    - Pending SOS signals
  - Visual charts with Recharts
  - Real-time data updates
  - Exportable reports
  
- ⛺ **Relief Camp Management** - Coordinate assistance
  - Track help requests from citizens
  - Monitor volunteer contributions
  - Location-based camp mapping
  - Urgency prioritization
  - Status updates (Pending → Available → Resolved)

#### Resource Operations
- 📦 **Resource Management** - Supply allocation
  - Inventory tracking
  - Distribution planning
  - Location-based assignment
  - Status monitoring
  - History logs

### Recent Updates (November 2025 - Production Deployment)

#### UI/UX Enhancements
- ✅ **Dashboard Redesign** - Soft pastel color scheme with overlapping risk assessment cards
- ✅ **Mobile Optimization** - Emergency contacts and stats display in 2 columns on mobile
- ✅ **Navbar Visibility** - "ResQ Hub" and subtitle now visible on mobile screens
- ✅ **Location Accuracy** - Shows precise address: "St Mary's Road, Kochchikade, Gampaha District"
- ✅ **Debounced Search** - Relief Tracker radius slider prevents notification spam (800ms delay)
- ✅ **Risk Level Images** - Visual indicators (lowRisk.png, mediumRisk.png, highRisk.png)

#### LankaRouteWatch Features
- ✅ **Location Search** - Nominatim autocomplete for start/end locations (replacing district dropdowns)
- ✅ **Road Hazard Display** - Shows detailed reports when no safe routes available
- ✅ **Distance Calculation** - Displays hazard distance from route with severity indicators
- ✅ **Backend Geocoding Proxy** - `/api/geocode/reverse` endpoint to avoid CORS issues

#### Production Fixes
- ✅ **CORS Configuration** - Supports all Vercel preview deployments (*.vercel.app)
- ✅ **JWT Authentication** - Environment variable validation with clear error messages
- ✅ **Supabase Fallback** - Graceful handling when external API unavailable
- ✅ **Error Logging** - Comprehensive console logging for debugging production issues
- ✅ **Environment Setup** - Complete guide in `RENDER_ENV_SETUP.md`

#### Deployment Infrastructure
- ✅ **Frontend Deployed** - Vercel with automatic preview deployments
- ✅ **Backend Deployed** - Render with MongoDB Atlas (Singapore region)
- ✅ **CI/CD Pipeline** - GitHub integration with auto-deploy on push
- ✅ **Environment Variables** - Secure secret management on both platforms
- ✅ **Deployment Guides** - `QUICK_DEPLOY.md`, `DEPLOYMENT_GUIDE.md`, `RENDER_ENV_SETUP.md`

#### Code Quality & Maintenance
- ✅ **Removed Payment System** - Streamlined to core disaster response features
- ✅ **Fixed Map Display** - Explicit height (600px) resolves Leaflet rendering
- ✅ **DMC Timestamp Clarity** - "Last DMC Update" badge shows batch update time
- ✅ **Volunteer System** - Complete CRUD workflow for relief contributions
- ✅ **Admin Map Fix** - Uses live DMC flood data instead of MongoDB

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 7.1.0 (fast HMR and optimized builds)
- **Routing**: React Router DOM v7 (latest)
- **UI Framework**: Tailwind CSS 3.4.17 + PostCSS
- **Icons**: Lucide React (modern, tree-shakeable)
- **Maps**: Leaflet 1.9.4 + React-Leaflet 4.2.1
- **HTTP Client**: Axios 1.7.9
- **Notifications**: React Hot Toast (lightweight toast library)
- **Charts**: Recharts 2.15.0 (data visualization)
- **State Management**: React Context API + Hooks
- **Mobile App**: React Native 0.76.5 (separate development)

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB 8.11.0 with Mongoose ODM
- **Authentication**: JWT tokens + Mock SLUDI (Individual ID + OTP)
- **AI Integration**: Google Gemini AI API for safety chatbot
- **HTTP Client**: Axios for external API calls
- **Security**: Helmet, express-rate-limit, CORS
- **Middleware**: body-parser, dotenv, express-sanitizer
- **Services**: SOS Auto-Escalation (5-min intervals)

### Production APIs & External Services
- **DMC Flood API**: Real-time water level monitoring (39 stations, 15-min updates)
- **Supabase Relief API**: Relief camp coordination and volunteer management
- **OpenStreetMap Nominatim**: Reverse geocoding (address from coordinates)
- **MongoDB Atlas**: User-generated data (SOS signals, reports, chat logs)
- **Google Gemini AI**: Emergency guidance chatbot

### Deployment & Infrastructure
- **Frontend Hosting**: Vercel (https://resq-five.vercel.app)
  - Automatic preview deployments for PRs
  - Edge CDN for fast global delivery
  - Zero-config SSL certificates
- **Backend Hosting**: Render (https://resq-backend-3efi.onrender.com)
  - Auto-deploy from GitHub
  - Health check monitoring
  - Environment variable management
- **Database**: MongoDB Atlas (Singapore region)
  - Geospatial indexing for location queries
  - Automatic backups
  - High availability cluster
- **Version Control**: GitHub (disaster-response-sl/resq)
  - Feature branch workflow
  - Protected main branch
- **CI/CD**: Automatic deployment on push to main/feature branches

## 📚 API Documentation

### DMC Flood Data API
- **Base URL**: `https://lk-flood-api.vercel.app`
- **Documentation**: [Swagger UI](https://lk-flood-api.vercel.app/docs) | [ReDoc](https://lk-flood-api.vercel.app/redoc)
- **Full Docs**: [docs/sriLankaFloodDataAPI.md](./docs/sriLankaFloodDataAPI.md)

**Key Endpoints**:
- `GET /alerts` - Active flood alerts (MAJOR, MINOR, ALERT)
- `GET /levels/latest` - Latest water levels for all 39 stations
- `GET /stations` - Station metadata with GPS coordinates
- `GET /rivers` - River information with basin data

**Example Response** (`/alerts`):
```json
{
  "station_name": "Hanwella",
  "river_name": "Kelani Ganga",
  "water_level": 10.75,
  "alert_status": "MAJOR",
  "rising_or_falling": "Falling",
  "timestamp": "2025-11-30 12:30:00"
}
```

### Supabase Relief Coordination API
- **Base URL**: `https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api`
- **Documentation**: [docs/publicDataAPI.md](./docs/publicDataAPI.md)

**Query Parameters**:
- `type` - `requests` (help needed) or `contributions` (help offered)
- `status` - `pending`, `resolved`, `available`
- `urgency` - `emergency`, `high`, `medium`, `low`
- `lat`, `lng`, `radius_km` - Location-based filtering
- `search` - Text search across all fields

**Example**: Find emergency help requests within 30km:
```
GET /public-data-api?type=requests&urgency=emergency&lat=6.9271&lng=79.8612&radius_km=30&sort=distance
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended: v20.x)
- MongoDB Atlas account (free tier available)
- Git
- Code editor (VS Code recommended)
- Google Gemini API key (for AI chatbot)

### Local Development Setup

#### 1. Clone the repository
```bash
git clone https://github.com/disaster-response-sl/resq.git
cd resq
```

#### 2. Backend Setup

```bash
cd src/web-dashboard/backend
npm install
```

Create a `.env` file in `src/web-dashboard/backend/`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/disaster_platform

# Authentication
JWT_SECRET=your-secure-random-64-character-string
JWT_EXPIRES_IN=24h
USE_MOCK_SLUDI=true

# AI Integration
GEMINI_API_KEY=your-google-gemini-api-key

# External Services (optional - uses public APIs if not set)
OPENWEATHER_API_KEY=your-openweather-api-key
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the backend server:
```bash
npm run dev
```
✅ Server runs on `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd src/web-dashboard/frontend
npm install
```

Create a `.env` file in `src/web-dashboard/frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the development server:
```bash
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

### 🧪 Test the Application

**Citizen Portal (No Login):**
- Navigate to `http://localhost:5173`
- Access all public features (SOS, reports, relief tracker, etc.)

**Admin/Responder Login:**
- Click "Admin Login" or "Responder Login"
- Use your assigned credentials to access the system

### Mobile App Setup

1. **Install mobile app dependencies**
   ```bash
   cd src/MobileApp
   npm install
   ```

2. **Install React Native dependencies**
   ```bash
   npx react-native install
   ```

3. **Start Metro bundler**
   ```bash
   npx react-native start
   ```

4. **Run on Android/iOS**
   ```bash
   # Android
   npx react-native run-android
   
   # iOS
   npx react-native run-ios
   ```

### Web Dashboard Setup

1. **Install web dashboard dependencies**
   ```bash
   cd src/web-dashboard/frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

## 🧪 Testing

### Access Levels

**Admin Access:**
- Role: Administrator (full access)
- Requires authorized credentials

**Responder Access:**
- Role: Responder (field operations)
- Requires authorized credentials

**Citizen Access:**
- No login required for public portal
- Full access to SOS, reporting, relief tracker, and AI assistant

### API Endpoints

#### Authentication
- `POST /api/mobile/login` - User authentication
- `POST /api/mobile/register` - User registration

#### Disasters
- `GET /api/mobile/disasters` - Get active disasters
- `POST /api/mobile/disasters` - Create new disaster

#### SOS Signals
- `GET /api/mobile/sos-signals` - Get recent SOS signals
- `POST /api/mobile/sos` - Send SOS signal

#### Reports
- `GET /api/mobile/reports` - Get recent reports
- `POST /api/mobile/reports` - Submit new report

#### Resources
- `GET /api/mobile/resources` - Get available resources
- `POST /api/mobile/resources` - Add new resource

#### Chat
- `GET /api/mobile/chat-logs` - Get chat history
- `POST /api/mobile/chat` - Send chat message

## 👥 Team

### Development Team
- **Shalon Fernando** - Lead Software Engineer & Full-Stack Architect
  - Backend API development (Express.js, MongoDB)
  - Production deployment (Vercel, Render)
  - CORS configuration and error handling
  - Authentication system (JWT, Mock SLUDI)
  - Mobile app development (React Native)
  - Technical architecture and system design
  
- **Gaindu** - Mobile App Development
  - React Native implementation
  - Mobile UI/UX design
  
- **Lehan** - Web Dashboard Development
  - React frontend development
  - Admin dashboard features
  
- **Pavith** - Web Dashboard Development
  - React frontend development
  - Responsive design implementation

### Recent Contributions
- **Shalon**: Production deployment, UI/UX redesign, LankaRouteWatch implementation, location services, debouncing, CORS fixes, environment setup guides, real time api integration.

## 🔧 Configuration

### Environment Variables

#### Mobile App (config/api.ts)
```typescript
export const API_BASE_URL = 'http://10.0.2.2:5000'; // Android Emulator
// export const API_BASE_URL = 'http://localhost:5000'; // iOS Simulator
```

### API Configuration
- **Base URL**: `http://localhost:5000` (development)
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`

## 🚨 Emergency Features

### SOS Signal
- One-tap emergency button
- Automatic GPS location capture
- Priority level selection (High/Medium/Low)
- Message field for additional details

### Real-time Alerts
- Push notifications for new disasters
- Location-based risk assessment
- Weather integration
- Offline capability

### AI Safety Assistant
- Natural language processing
- Contextual safety recommendations
- Pre-defined quick questions
- Emergency contact information

## 📱 Mobile App Features

### Authentication
- SLUDI mock authentication
- Role-based access (Citizen/Responder)
- Secure token storage

### Dashboard
- Current location weather
- Risk assessment based on nearby disasters
- Quick action buttons (SOS, Report, Chat)
- Recent alerts feed
- Available resources display

### Reporting
- Incident type selection
- Photo upload capability
- Location confirmation
- Status tracking

## 💻 Web Dashboard Features

### Admin Panel
- Role-based access control
- Real-time statistics
- Geographic data visualization
- Resource management

### Disaster Management
- Create and update disasters
- Set severity levels
- Publish public alerts
- Status tracking

### SOS Monitoring
- Live emergency signal feed
- Priority-based sorting
- Geographic clustering
- Response assignment

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- Input validation and sanitization
- Secure API endpoints
- Environment variable protection

## 📊 Performance Optimizations

- Offline-first mobile design
- Real-time WebSocket connections
- Geospatial database indexing
- Image compression and caching
- Lazy loading for large datasets

## 🚀 Production Deployment

### Current Production Status ✅

**Frontend:** https://resq-five.vercel.app
- Hosted on Vercel
- Automatic deployments from GitHub
- Global CDN distribution
- SSL/HTTPS enabled

**Backend:** https://resq-backend-3efi.onrender.com
- Hosted on Render
- Connected to MongoDB Atlas (Singapore)
- Auto-deploy from GitHub
- Health monitoring enabled

### Quick Deploy Commands

**Deploy Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd src/web-dashboard/frontend
vercel --prod
```

**Deploy Backend (Render):**
- Push to GitHub `main` or `feature-deployment-ready` branch
- Render auto-deploys in 2-3 minutes
- Or use "Manual Deploy" in Render Dashboard

### Environment Variables for Production

**Critical variables that MUST be set on Render:**

```env
JWT_SECRET=<64-char-random-string>  # Required for login
USE_MOCK_SLUDI=true                  # Enable authentication
MONGO_URI=<mongodb-atlas-url>        # Database connection
NODE_ENV=production
JWT_EXPIRES_IN=24h
```

**See [RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md) for complete setup guide.**

---

## 🐛 Troubleshooting

### Production Issues

**1. Login Fails with 500 Error**
- ❌ Missing `JWT_SECRET` on Render
- ✅ Add environment variable: See [RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md)
- ✅ Verify with: `curl https://resq-backend-3efi.onrender.com/api/test`

**2. Relief Camps Show Empty or Error**
- ⚠️ External Supabase API may be slow/unavailable
- ✅ Backend now returns empty array gracefully (not critical)
- ✅ Shows: "Relief camps service temporarily unavailable"

**3. CORS Errors in Production**
- ✅ Fixed: Backend allows all `*.vercel.app` domains
- ✅ Redeploy backend if still seeing errors

### Local Development Issues

**1. MongoDB Connection Error**
- Verify `MONGO_URI` in `.env` file
- Check network connectivity
- Ensure IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)
- Test connection: `mongosh <your-mongo-uri>`

**2. Backend Port Already in Use**
```bash
# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process-id> /F

# Or change PORT in .env file
```

**3. Frontend Can't Connect to Backend**
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check `VITE_API_BASE_URL` in frontend `.env`
- Clear browser cache and reload

**4. GPS Location Issues**
- Enable location permissions in browser
- Use HTTPS (required for geolocation API)
- Check device GPS settings
- Verify location services are enabled

**5. Leaflet Map Not Displaying**
- Check browser console for errors
- Verify map container has explicit height (600px)
- Import Leaflet CSS: `import 'leaflet/dist/leaflet.css'`

### Debug Commands

```bash
# Check backend logs
cd src/web-dashboard/backend
npm run dev

# Test backend health
curl http://localhost:5000/api/health

# Test MongoDB connection
curl http://localhost:5000/api/public/stats

# Check frontend build
cd src/web-dashboard/frontend
npm run build

# Mobile app logs
cd src/MobileApp
npx react-native log-android
npx react-native log-ios
```

### Verification Checklist

After deployment, verify these features:

- [ ] Backend health check responds: `/api/health`
- [ ] Admin login works with authorized credentials
- [ ] Statistics display correctly (reports, disasters, SOS)
- [ ] Location shows accurate address
- [ ] Road reports display on LankaRouteWatch
- [ ] SOS signals load on dashboard
- [ ] Disaster heat map shows DMC flood data
- [ ] Relief tracker search works (debounced)
- [ ] AI chatbot responds to queries
- [ ] Emergency contacts display DDMCU hotlines

## 📚 Documentation

### Deployment Guides
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Quick reference for deploying to Vercel and Render
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide with troubleshooting
- **[RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md)** - Environment variable setup for Render backend
- **[PRODUCTION_FIX_SUMMARY.md](./PRODUCTION_FIX_SUMMARY.md)** - Production error fixes and solutions

### API Documentation
- **[DMC Flood Data API](./docs/sriLankaFloodDataAPI.md)** - Real-time flood monitoring (39 stations)
- **[Supabase Relief API](./docs/publicDataAPI.md)** - Relief camp coordination and volunteer management
- **[Backend API Endpoints](./docs/api.md)** - Internal API documentation (if available)

### Architecture & Schema
- **[Database Schema](./docs/schema.md)** - MongoDB collections and data models (if available)
- **[Project Structure](./docs/)** - Full documentation folder

## 📄 License

This project is developed for Codefest's Revive Nation hackathon and is intended for educational and demonstration purposes.

## 🔧 Technical Improvements & Optimizations

### Performance Enhancements
- ✅ **Debounced Search** - Relief Tracker radius slider with 800ms delay prevents notification spam
- ✅ **Lazy Loading** - Efficient component loading reduces initial bundle size
- ✅ **Geospatial Indexing** - MongoDB 2dsphere index for fast location queries
- ✅ **CDN Distribution** - Vercel Edge Network for global low-latency access
- ✅ **API Response Caching** - Reduced redundant external API calls

### Error Handling & Resilience
- ✅ **JWT Validation** - Backend checks for JWT_SECRET before authentication
- ✅ **Supabase Fallback** - Graceful degradation when external API unavailable
- ✅ **CORS Configuration** - Supports all Vercel preview deployments (*.vercel.app)
- ✅ **Comprehensive Logging** - Console logging for debugging production issues
- ✅ **Rate Limiting** - 10,000 requests per 15 min (5 for auth endpoints)
- ✅ **Input Sanitization** - NoSQL injection prevention

### Location Services
- ✅ **Reverse Geocoding** - Accurate address from coordinates
  - Direct Nominatim API (10s timeout)
  - Backend proxy fallback (12s timeout)
  - Shows: "St Mary's Road, Kochchikade, Gampaha District"
- ✅ **Location Autocomplete** - Search locations by name (Nominatim)
- ✅ **Distance Calculations** - Haversine formula for accurate distances
- ✅ **CORS Proxy** - `/api/geocode/reverse` endpoint avoids browser CORS issues

### Mobile Responsiveness
- ✅ **Adaptive Layouts** - Tailwind breakpoints (sm, md, lg, xl)
- ✅ **Touch-Friendly UI** - Larger buttons and spacing on mobile
- ✅ **Responsive Grid** - 2 columns on mobile, 4-5 on desktop
- ✅ **Navbar Visibility** - Logo and subtitle visible on all screen sizes
- ✅ **Mobile-First Design** - Progressive enhancement approach

### Security Features
- ✅ **Helmet.js** - Secure HTTP headers
- ✅ **JWT Authentication** - Stateless token-based auth
- ✅ **Environment Variables** - Secure secret management
- ✅ **HTTPS Enforcement** - SSL certificates on production
- ✅ **Rate Limiting** - Brute force protection
- ✅ **Input Validation** - Prevents injection attacks

### Monitoring & Observability
- ✅ **Health Check Endpoint** - `/api/health` for uptime monitoring
- ✅ **Test Endpoint** - `/api/test` shows environment status
- ✅ **Console Logging** - Structured logs with emojis (✅, ❌, ⚠️)
- ✅ **Error Tracking** - Comprehensive error messages
- ✅ **API Response Logging** - Track external API calls

---

## 🎯 Known Limitations & Future Enhancements

### Current Limitations
- ⚠️ **Mock Authentication** - Uses Individual ID + OTP instead of real SLUDI
- ⚠️ **Supabase Dependency** - Relief camps may be unavailable if external API down
- ⚠️ **Single Language** - Currently English only (Sinhala/Tamil planned)
- ⚠️ **No Real-Time Sync** - Dashboard updates on refresh (WebSocket planned)

### Planned Features
- 🔮 **Real SLUDI Integration** - Connect to actual eSignet authentication
- 🔮 **Multi-Language Support** - Sinhala, Tamil, English
- 🔮 **Push Notifications** - Real-time alerts to mobile devices
- 🔮 **Offline Mode** - Service worker for offline access
- 🔮 **WebSocket Integration** - Live dashboard updates
- 🔮 **Advanced Analytics** - Predictive disaster modeling
- 🔮 **SMS Gateway** - Send alerts via SMS for areas without internet
- 🔮 **Drone Integration** - Aerial surveillance and delivery coordination

---

## 🙏 Acknowledgments

### Data Sources & APIs
- **Sri Lanka DMC** - Real-time flood monitoring data (39 gauging stations)
- **Supabase** - Relief camp coordination and volunteer management
- **OpenStreetMap Nominatim** - Geocoding and location search
- **Google Gemini AI** - Emergency guidance chatbot
- **OpenWeatherMap** - Weather data integration

### Technology Partners
- **Vercel** - Frontend hosting and CDN
- **Render** - Backend hosting and deployment
- **MongoDB Atlas** - Cloud database hosting
- **GitHub** - Version control and CI/CD

### Open Source Community
- React and React Native communities
- Leaflet mapping library
- Tailwind CSS framework
- Lucide icons
- All npm package maintainers

### Special Thanks
- Sri Lanka Digital Public Infrastructure (DPI) team
- Disaster Management Centre (DMC) Sri Lanka
- ICTA Sri Lanka
- Codefest Hackathon organizers
- All contributors and testers

---

**Built with ❤️ for Sri Lanka's disaster response needs**

*This platform demonstrates the potential of AI and modern technology in addressing critical national challenges. We aim to save lives, coordinate relief efforts, and empower citizens during disasters.*

**🌟 Star this repo if you find it useful!**

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/disaster-response-sl/resq/issues)
- **Production Site**: [https://resq-five.vercel.app](https://resq-five.vercel.app)
- **Documentation**: [Full docs folder](./docs/)

**Emergency Hotline (Sri Lanka):** 117 (DMC Disaster Management Centre) 