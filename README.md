# 🚨 National Disaster Response Platform for Sri Lanka

[![Production Status](https://img.shields.io/badge/status-production-brightgreen)](https://your-domain.com)
[![Real-Time Data](https://img.shields.io/badge/data-live%20DMC%20API-blue)](https://lk-flood-api.vercel.app)
[![Built For](https://img.shields.io/badge/built%20for-Sri%20Lanka%20Disasters-red)](https://www.dmc.gov.lk)

> **🎯 From Hackathon Prototype to Real-World Disaster Response**  
> Originally built for SLIIT Hackathon, now **deployed in production** during Sri Lanka's ongoing disaster crisis.  
> **Real-time flood monitoring** • **Relief camp locations** • **Emergency SOS** • **No login required**

## 🚀 Production Status: LIVE

Real-time disaster response platform with **actual government data sources** replacing all mock APIs.

**Key Changes (Hackathon → Production):**
- ✅ **Real DMC Flood Data** - 39 gauging stations, live water levels, 15-min updates
- ✅ **Real Relief Camps** - Supabase API with verified camp locations across Sri Lanka
- ✅ **Public Access** - Citizens can access emergency features without authentication
- ✅ **AI Safety Assistant** - Google Gemini-powered disaster guidance
- ❌ **Removed Mock APIs** - NDX, PayDPI, SLUDI sandbox integrations disabled
- ❌ **Removed Payments** - Focusing on core disaster response features

📖 **[View Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)** | **[Repository Strategy](./REPOSITORY_STRATEGY.md)**

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

## ✅ Solution Features

#### Mobile App (Citizen Interface)
- 🔐 **SLUDI Authentication**: Secure login using Sri Lanka's Digital Public Infrastructure
- 📍 **Real-time Location Services**: GPS-based emergency reporting
- 🚨 **One-tap SOS**: Emergency signal with automatic location capture
- 📝 **Incident Reporting**: Food, shelter, medical, and danger reports with photo upload
- 🤖 **AI Safety Assistant**: Contextual chatbot for safety guidance
- 🗺️ **Risk Map**: Color-coded disaster zones with real-time updates
- 📊 **Dashboard**: Weather, risk assessment, and recent alerts

#### Web Dashboard (Government Interface)
- 👥 **Role-based Access**: SLUDI authentication for government officials
- 📈 **Analytics Dashboard**: Overview statistics and real-time monitoring
- 🚨 **SOS Monitor**: Live emergency signal tracking with priority sorting
- 🗺️ **Reports Heatmap**: Geographic visualization of citizen needs
- 📦 **Resource Management**: AI-powered supply allocation and tracking
- ⚡ **Real-time Updates**: WebSocket connections for live data

## 🛠️ Technology Stack

### Frontend
- **Mobile App**: React Native with offline-first design
- **Web Dashboard**: React with responsive design
- **Maps**: React Native Maps / Google Maps API
- **State Management**: React Context API

### Backend
- **API Gateway**: Express.js with middleware
- **Database**: MongoDB Atlas with geospatial indexing
- **Authentication**: SLUDI mock implementation
- **Real-time**: WebSocket connections
- **AI Integration**: Dialogflow/Rasa for chatbot

### Data Integration
- **NDX**: Mock JSON APIs for disaster data
- **SLUDI**: OAuth2 mock for authentication
- **PayDPI**: Optional payment simulation

## DPI Integration (Government-Ready Architecture)

This platform is architected to integrate with Sri Lanka's Digital Public Infrastructure (SLUDI, NDX, PayDPI).

For the hackathon, mock/sandbox endpoints were used.

Upon approval and access from the Ministry/ICTA, the platform can immediately connect to the production-grade DPI services without any code restructuring.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- React Native development environment
- Android Studio / Xcode (for mobile development)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/disaster-response-sl/national-disaster-platform.git
   cd national-disaster-platform
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
   MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/disaster_platform
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRES_IN=24h
   SLUDI_MOCK_ENABLED=true
   SLUDI_BASE_URL=http://localhost:5000/mock-sludi
   //.env full file provided in documentaion not provided here due to security reasons.
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```

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