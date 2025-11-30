# 🚨 ResQ - National Disaster Response Platform

[![Production Status](https://img.shields.io/badge/status-production%20ready-brightgreen)](https://github.com/disaster-response-sl/resq)
[![Real-Time Data](https://img.shields.io/badge/data-live%20DMC%20API-blue)](https://lk-flood-api.vercel.app)
[![Relief Coordination](https://img.shields.io/badge/relief-Supabase%20API-green)](https://supabase.com)
[![Built For](https://img.shields.io/badge/built%20for-Sri%20Lanka-red)](https://www.dmc.gov.lk)

> **🎯 Real-World Disaster Response Platform**  
> Production-ready emergency response system with **real-time flood monitoring**, **relief coordination**, and **volunteer management**.  
> **39 DMC gauging stations** • **Live relief camps** • **Emergency SOS** • **Volunteer registration** • **No login required for citizens**

## 🚀 Production Ready: 100% Real APIs

Comprehensive disaster response platform powered by **verified government and production data sources**.

### 🌊 Core Features

#### For Citizens (Public Access)
- ✅ **Real-Time Flood Monitoring** - Live water levels from 39 DMC gauging stations (15-min updates)
- ✅ **Interactive Risk Map** - Leaflet-powered map with flood alerts, relief camps, and user location
- ✅ **Emergency SOS** - One-tap distress signal with GPS location (no authentication required)
- ✅ **Incident Reporting** - Submit reports with photos and location data
- ✅ **Relief Demand & Supply Tracker** - Find nearby help or volunteer to assist
- ✅ **Volunteer Registration** - Comprehensive form to offer goods, services, or labor
- ✅ **AI Safety Assistant** - Google Gemini-powered emergency guidance chatbot
- ✅ **Recent Alerts Dashboard** - Real-time DMC flood alerts with severity levels

#### For Admins & Responders
- ✅ **SOS Dashboard** - Real-time emergency signal monitoring with auto-escalation
- ✅ **Disaster Management** - Create, track, and manage disaster events
- ✅ **Live Disaster Heat Map** - Real-time DMC flood data visualization
- ✅ **Resource Management** - Allocate and track emergency supplies
- ✅ **Reports Dashboard** - Citizen incident report review and verification
- ✅ **Relief Camp Dashboard** - Manage help requests and volunteer contributions
- ✅ **Analytics & Metrics** - Comprehensive dashboard with emergency statistics

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

### Citizen Web Portal (Public Access - No Login Required)
- 🌊 **Live Flood Monitoring**: Real-time water levels from 39 DMC gauging stations with 15-min updates
- 🗺️ **Interactive Risk Map**: Leaflet map with flood alerts (🌊), relief camps (⛺), and user location (📍)
- 🚨 **Emergency SOS**: One-tap distress signal with GPS location and priority levels
- 📝 **Incident Reporting**: Submit reports with photos, location, and detailed descriptions
- 💬 **AI Safety Assistant**: Google Gemini-powered chatbot for emergency guidance and safety tips
- 🆘 **Relief Demand Tracker**: Find nearby help within 5-200km radius
- 💚 **Volunteer Registration**: Comprehensive form to offer goods, services, or labor
- 📊 **Recent Alerts Dashboard**: Live DMC flood alerts with severity badges and water level trends
- 🎯 **Location-Based Search**: Distance-sorted relief camps with urgency filtering

### Admin & Responder Dashboard
- 👥 **Role-based Access**: Individual ID + OTP authentication for government officials
- 🚨 **SOS Dashboard**: Live emergency signal monitoring with auto-escalation (5-min intervals)
- 🗺️ **Live Disaster Heat Map**: Real-time DMC flood data with 39 station markers and alert status
- 📊 **Analytics Dashboard**: 
  - Emergency Statistics (replacing payment metrics)
  - Citizen Reports tracking (total/pending)
  - Active disasters monitoring
  - Pending SOS signals overview
- 📝 **Reports Dashboard**: Citizen incident report review and status management
- ⛺ **Relief Camp Management**: Track help requests and volunteer contributions from Supabase
- 📦 **Resource Management**: Allocate and track emergency supplies and equipment
- 🔄 **Real-time Updates**: Auto-refresh dashboards with latest DMC flood data

### Recent Updates (Production Migration)
- ✅ **Fixed Map Display**: Added explicit height (600px) to resolve Leaflet rendering issue
- ✅ **Enhanced Login UX**: Added "Back to Citizen Portal" navigation button
- ✅ **Removed Payment System**: Replaced donation metrics with emergency statistics
- ✅ **DMC Timestamp Clarity**: Added "Last DMC Update" badge showing batch update time
- ✅ **Volunteer System**: Complete CRUD workflow for relief contributions
- ✅ **Admin Map Fix**: Disaster heat map now uses live DMC flood data instead of MongoDB
- ✅ **Relief Tracker**: "Offer Support" button navigates to volunteer registration form

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3.1 + Vite 7.1.0
- **Routing**: React Router DOM v7
- **UI Components**: Tailwind CSS + Lucide React icons
- **Maps**: Leaflet 1.9.4 + React-Leaflet 4.2.1
- **HTTP Client**: Axios 1.7.9
- **Notifications**: React Hot Toast
- **State Management**: React Context API
- **Mobile App**: React Native (separate development)

### Backend
- **Runtime**: Node.js with Express.js 5.1.0
- **Database**: MongoDB Atlas with geospatial indexing
- **Authentication**: Mock SLUDI (Individual ID + OTP)
- **AI Integration**: Google Gemini AI for safety chatbot
- **HTTP Client**: Axios for external API calls
- **Middleware**: CORS, body-parser, dotenv

### Production APIs
- **DMC Flood API**: Real-time water level monitoring (39 stations)
- **Supabase Relief API**: Relief camp coordination and volunteer management
- **MongoDB**: User-generated data (SOS signals, reports, chat logs)

### Deployment
- **Frontend**: Vercel (Static hosting with CDN)
- **Backend**: Render / Railway / Fly.io (recommended)
- **Database**: MongoDB Atlas (Cloud cluster)
- **Version Control**: GitHub (disaster-response-sl/resq)

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
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git
- Code editor (VS Code recommended)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/disaster-response-sl/resq.git
   cd resq
   ```

2. **Install backend dependencies**
   ```bash
   cd src/web-dashboard/backend
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in `src/web-dashboard/backend/`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/disaster_platform
   JWT_SECRET=your-secure-jwt-secret
   GEMINI_API_KEY=your-google-gemini-api-key
   SLUDI_MOCK_ENABLED=true
   # Full .env template available in repository
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd src/web-dashboard/frontend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

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

### Test Credentials
- **Citizen Login**: `citizen001` / `123456`
- **Responder Login**: `responder001` / `123456`
- **Admin Login**: `admin001` / `123456`

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
- **Shalon** - Software Architect & Lead Software engineer
- **Gaindu** - Mobile App Development
- **Lehan** - Web Dashboard Development  
- **Pavith** - Web Dashboard Development

### Roles & Responsibilities
- **Shalon**: Technical architecture, Mobile app development, React Native implementation
- **Gaindu & Shalon**: Mobile app development, React Native implementation
- **Lehan & Pavith**: Web dashboard development, React implementation
- **All Members**: Testing, documentation, and quality assurance

## 📅 Development Timeline

### Phase 1 (July 31 - Aug 2)
- ✅ Repository setup and project structure
- ✅ Static UI development for mobile and web
- ✅ Database schema implementation
- ✅ Mock data population

### Phase 2 (Aug 3 - Aug 5)
- ✅ Backend API development
- ✅ Frontend-backend integration
- ✅ Real-time features implementation
- 🔄 AI chatbot integration

### Final Phase (Aug 6 - Aug 7)
- 🔄 DPI integration (SLUDI, NDX, PayDPI)
- 🔄 Testing and bug fixes
- 🔄 Documentation completion
- 🔄 Demo preparation

## 🎯 Expected Outcomes

1. **Faster Emergency Response**: Real-time SOS and disaster alerts
2. **Optimized Resource Allocation**: AI-powered supply distribution
3. **Enhanced Citizen Engagement**: Two-way communication platform
4. **Transparent Operations**: Public visibility into relief efforts
5. **Scalable Solution**: Exportable to other disaster-prone regions

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

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MONGO_URI in .env file
   - Check network connectivity
   - Ensure IP whitelist in MongoDB Atlas

2. **Mobile App API Connection**
   - Use `10.0.2.2` for Android emulator
   - Use `localhost` for iOS simulator
   - Check backend server is running

3. **GPS Location Issues**
   - Enable location permissions
   - Check device GPS settings
   - Verify location services are enabled

### Debug Commands
```bash
# Check backend logs
cd src/web-dashboard/backend
npm start

# Check mobile app logs
cd src/MobileApp
npx react-native log-android
npx react-native log-ios

# Reset database
npm run seed
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 📄 License

This project is developed for Codefest's Revive Nation hackathon and is intended for educational and demonstration purposes.

## 🙏 Acknowledgments

- Sri Lanka Digital Public Infrastructure (DPI) team
- React Native and React communities
- MongoDB Atlas for database hosting
- OpenWeatherMap for weather data
- Google Maps for mapping services

---

**Built with ❤️ for Sri Lanka's disaster response needs**

*This platform demonstrates the potential of AI and modern technology in addressing critical national challenges.* 