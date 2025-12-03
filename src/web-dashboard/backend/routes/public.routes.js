// routes/public.routes.js - Public routes for citizen access without authentication
const express = require('express');
const jwt = require('jsonwebtoken');
const SosSignal = require('../models/SosSignal');
const Disaster = require('../models/Disaster');
const Report = require('../models/Report');
const ChatLog = require('../models/ChatLog');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Safety system prompt for AI responses
const SAFETY_SYSTEM_PROMPT = `You are an AI Safety Assistant for emergency preparedness and crisis response in Sri Lanka.

CRITICAL SAFETY GUIDELINES:
- Always prioritize user safety in your responses
- Provide clear, step-by-step instructions for emergency situations
- Include relevant safety warnings and precautions
- Suggest appropriate emergency contacts when necessary (119 for emergencies in Sri Lanka, 1990 for ambulance, 110 for fire)
- Be supportive but factual and accurate
- If someone is in immediate danger, immediately direct them to call emergency services
- For disaster-related queries, provide location-specific guidance when possible
- Always include preventive measures and preparation tips

RESPONSE FORMAT:
- Start with immediate safety action if urgent
- Provide step-by-step instructions
- Include relevant warnings and precautions
- End with follow-up resources or contacts`;

// POST /api/public/sos - Send SOS signal (no auth required for emergencies)
router.post('/sos', async (req, res) => {
  try {
    const { location, message, priority, contact, locationDetails, emergencyDetails, currentSituation, resources } = req.body;
    
    console.log('Public SOS request received:', { location, message, priority });

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: "Valid location coordinates are required"
      });
    }

    // Try to get user_id from token if provided
    let userId = 'anonymous';
    const authHeader = req.headers.authorization;
    console.log('[PUBLIC SOS] Auth header:', authHeader ? 'Present' : 'Missing');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('[PUBLIC SOS] Token decoded:', decoded);
        userId = decoded.citizenId || decoded.individualId || decoded.id || 'anonymous';
        console.log('[PUBLIC SOS] Authenticated user:', userId);
      } catch (err) {
        console.log('[PUBLIC SOS] Token verification failed:', err.message);
      }
    } else {
      console.log('[PUBLIC SOS] No token provided, using anonymous');
    }

    const sos = new SosSignal({
      user_id: userId,
      location,
      message: message || 'Emergency SOS - Need immediate assistance',
      priority: priority || 'high',
      status: 'pending',
      // Optional additional details
      contact,
      locationDetails,
      emergencyDetails,
      currentSituation,
      resources
    });

    await sos.save();
    console.log('Public SOS signal saved successfully with user_id:', userId);

    res.json({
      success: true,
      message: "SOS signal sent successfully. Emergency responders have been notified.",
      data: {
        id: sos._id,
        timestamp: sos.timestamp,
        user_id: userId
      }
    });
  } catch (error) {
    console.error('[PUBLIC SOS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Server error sending SOS. Please call 119 for immediate assistance."
    });
  }
});

// POST /api/public/reports - Submit incident report (no auth required)
router.post('/reports', async (req, res) => {
  try {
    const { type, description, location } = req.body;

    console.log('Public report received:', { type, description, location });

    if (!type || !description || !location) {
      return res.status(400).json({
        success: false,
        message: "Type, description, and location are required"
      });
    }

    const report = new Report({
      user_id: 'anonymous',
      type,
      description,
      location,
      status: 'pending'
    });

    await report.save();
    console.log('Public report saved successfully');

    res.json({
      success: true,
      message: "Report submitted successfully",
      data: {
        id: report._id,
        timestamp: report.timestamp
      }
    });
  } catch (error) {
    console.error('[PUBLIC REPORT ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Server error submitting report"
    });
  }
});

// POST /api/public/volunteer - Submit volunteer/contribution registration (MongoDB Primary)
router.post('/volunteer', async (req, res) => {
  try {
    console.log('💚 VOLUNTEER REGISTRATION received:', req.body);

    const Volunteer = require('../models/Volunteer');

    // Save to MongoDB (Primary)
    const volunteer = new Volunteer(req.body);
    await volunteer.save();

    console.log('✅ VOLUNTEER registered successfully in MongoDB');

    // Also try to forward to Supabase as backup (don't fail if this fails)
    try {
      await axios.post(
        'https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api/contributions',
        req.body,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ VOLUNTEER also saved to Supabase as backup');
    } catch (supabaseError) {
      console.warn('⚠️ Supabase backup failed (non-critical):', supabaseError.message);
    }

    res.json({
      success: true,
      message: "Volunteer registration submitted successfully",
      data: volunteer
    });
  } catch (error) {
    console.error('❌ VOLUNTEER REGISTRATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error submitting volunteer registration"
    });
  }
});

// GET /api/public/volunteer - Get volunteer list (HYBRID: MongoDB + Supabase)
router.get('/volunteer', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;

    console.log('💚 FETCHING HYBRID volunteers...');

    const Volunteer = require('../models/Volunteer');

    // Fetch from MongoDB
    let mongoQuery = {};
    if (status) {
      mongoQuery.status = status;
    }

    const mongoVolunteers = await Volunteer.find(mongoQuery)
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    console.log(`✅ MongoDB volunteers: ${mongoVolunteers.length}`);

    // Fetch from Supabase
    let supabaseVolunteers = [];
    try {
      const supabaseResponse = await axios.get(
        'https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api/contributions',
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (supabaseResponse.data && Array.isArray(supabaseResponse.data)) {
        supabaseVolunteers = supabaseResponse.data;
      }
      console.log(`✅ Supabase contributions: ${supabaseVolunteers.length}`);
    } catch (supabaseError) {
      console.warn('⚠️ Supabase fetch failed:', supabaseError.message);
    }

    // Merge both sources
    const allVolunteers = [...mongoVolunteers, ...supabaseVolunteers];

    console.log(`✅ HYBRID volunteers: ${mongoVolunteers.length} MongoDB + ${supabaseVolunteers.length} Supabase = ${allVolunteers.length} total`);

    res.json({
      success: true,
      data: allVolunteers,
      source: 'hybrid',
      counts: {
        mongodb: mongoVolunteers.length,
        supabase: supabaseVolunteers.length,
        total: allVolunteers.length
      }
    });
  } catch (error) {
    console.error('❌ VOLUNTEER FETCH ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error fetching volunteers"
    });
  }
});

// GET /api/public/sos-signals - Get user-submitted SOS signals from MongoDB
router.get('/sos-signals', async (req, res) => {
  try {
    const { status, limit = 100, public_visibility } = req.query;

    console.log('📡 FETCHING MongoDB SOS signals...', { status, public_visibility, limit });

    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by public_visibility if provided
    // For public endpoint, show all documents if no explicit filter
    // (This allows documents without public_visibility field to be shown)
    if (public_visibility === 'true' || public_visibility === true) {
      // Show both documents with public_visibility=true AND documents without the field
      query.$or = [
        { public_visibility: true },
        { public_visibility: { $exists: false } }
      ];
    } else if (public_visibility === 'false') {
      query.public_visibility = false;
    }
    // If no public_visibility param, show all

    const sosSignals = await SosSignal.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${sosSignals.length} SOS signals in MongoDB matching query:`, JSON.stringify(query));

    res.json({
      success: true,
      data: sosSignals,
      source: 'mongodb',
      count: sosSignals.length
    });
  } catch (error) {
    console.error('❌ ERROR fetching MongoDB SOS signals:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching SOS signals",
      error: error.message
    });
  }
});

// GET /api/public/user-reports - Get user-submitted incident reports from MongoDB
router.get('/user-reports', async (req, res) => {
  try {
    const { type, status, limit = 100 } = req.query;

    console.log('📡 FETCHING MongoDB user reports...');

    let query = {};
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${reports.length} user reports in MongoDB`);

    res.json({
      success: true,
      data: reports,
      source: 'mongodb',
      count: reports.length
    });
  } catch (error) {
    console.error('❌ ERROR fetching MongoDB reports:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching user reports",
      error: error.message
    });
  }
});

// GET /api/public/reports - Get all incident reports from MongoDB (for backward compatibility)
router.get('/reports', async (req, res) => {
  try {
    const { type, status, limit = 100 } = req.query;

    console.log('📡 FETCHING MongoDB incident reports via /reports endpoint...');

    let query = {};
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${reports.length} incident reports in MongoDB`);

    res.json({
      success: true,
      data: reports,
      source: 'mongodb',
      count: reports.length
    });
  } catch (error) {
    console.error('❌ ERROR fetching MongoDB reports:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching incident reports",
      error: error.message
    });
  }
});

// GET /api/public/disasters - Get active disasters (public access)
router.get('/disasters', async (req, res) => {
  try {
    const disasters = await Disaster.find({ status: 'active' })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      data: disasters
    });
  } catch (error) {
    console.error('[PUBLIC DISASTERS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching disasters"
    });
  }
});

// GET /api/public/relief-camps - Get real-time relief camp data from Supabase (with MongoDB fallback)
router.get('/relief-camps', async (req, res) => {
  try {
    const { lat, lng, radius_km, urgency, establishment, status, type, limit } = req.query;
    
    // Try Supabase API first
    try {
      const params = new URLSearchParams();
      params.append('type', type || 'all');
      params.append('limit', limit || '100');
      
      if (status) params.append('status', status);
      if (urgency) params.append('urgency', urgency);
      if (establishment) params.append('establishment', establishment);
      
      // Location-based filtering
      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
        params.append('radius_km', radius_km || '50');
        params.append('sort', 'distance');
      } else {
        params.append('sort', 'newest');
      }

      const response = await axios.get(
        `https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?${params.toString()}`,
        { 
          timeout: 15000, // 15 second timeout (increased)
          headers: {
            'x-api-key': process.env.SUPABASE_API_KEY || '',
          }
        }
      );

      console.log('✅ Supabase relief camps loaded:', {
        totalRequests: response.data.meta?.total_requests,
        totalContributions: response.data.meta?.total_contributions,
        returned: response.data.meta?.pagination
      });
      
      return res.json({
        success: true,
        data: response.data,
        source: 'supabase_public_api'
      });
    } catch (supabaseError) {
      console.error('⚠️ Supabase API error:', {
        status: supabaseError.response?.status,
        message: supabaseError.message,
        data: supabaseError.response?.data
      });
      
      // Fallback to MongoDB - return empty array since we don't have relief camps collection
      // Frontend will handle empty state gracefully
      return res.json({
        success: true,
        data: { requests: [] },
        source: 'mongodb_fallback',
        message: 'Relief camps service temporarily unavailable'
      });
    }
  } catch (error) {
    console.error('[PUBLIC RELIEF CAMPS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching relief camp data",
      error: error.message
    });
  }
});

// GET /api/public/flood-alerts - Get real-time flood data from Sri Lanka Flood API
router.get('/flood-alerts', async (req, res) => {
  try {
    // Fetch active flood alerts from the official Sri Lanka Flood API
    const [alertsResponse, levelsResponse, stationsResponse] = await Promise.all([
      axios.get('https://lk-flood-api.vercel.app/alerts'),
      axios.get('https://lk-flood-api.vercel.app/levels/latest'),
      axios.get('https://lk-flood-api.vercel.app/stations')
    ]);

    const alerts = alertsResponse.data || [];
    const levels = levelsResponse.data || [];
    const stations = stationsResponse.data || [];

    // Create a station lookup map
    const stationMap = {};
    stations.forEach(station => {
      stationMap[station.name] = station;
    });

    // Transform to our format with location data
    const floodAlerts = alerts.map(alert => {
      const station = stationMap[alert.station_name] || {};
      const latLng = station.lat_lng || [6.9271, 79.8612];
      
      return {
        id: alert.station_name,
        station_name: alert.station_name,
        river_name: alert.river_name,
        location: alert.station_name,
        lat: latLng[0],
        lng: latLng[1],
        water_level: alert.water_level,
        previous_water_level: alert.previous_water_level,
        alert_status: alert.alert_status,
        flood_score: alert.flood_score,
        rising_or_falling: alert.rising_or_falling,
        rainfall_mm: alert.rainfall_mm,
        remarks: alert.remarks,
        timestamp: alert.timestamp,
        severity: alert.alert_status === 'MAJOR' ? 'critical' : 
                 alert.alert_status === 'MINOR' ? 'high' : 
                 alert.alert_status === 'ALERT' ? 'medium' : 'low',
        alert_level: station.alert_level,
        minor_flood_level: station.minor_flood_level,
        major_flood_level: station.major_flood_level
      };
    });

    res.json({
      success: true,
      data: floodAlerts,
      all_levels: levels,
      source: 'lk_flood_api',
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PUBLIC FLOOD ALERTS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching flood alert data",
      error: error.message
    });
  }
});

// GET /api/public/recent-alerts - Get recent public alerts (combines local disasters + real flood alerts)
router.get('/recent-alerts', async (req, res) => {
  try {
    // Fetch both local disasters and real-time flood alerts
    const [disasters, floodResponse] = await Promise.all([
      Disaster.find({ status: 'active' })
        .sort({ timestamp: -1 })
        .limit(5),
      axios.get('https://lk-flood-api.vercel.app/alerts').catch(() => ({ data: [] }))
    ]);

    // Map local disasters to alert format
    const disasterAlerts = disasters.map(d => ({
      _id: d._id,
      type: d.type,
      location: d.affected_areas?.join(', ') || 'Multiple areas',
      severity: d.severity,
      timestamp: d.timestamp,
      message: `${d.type} alert: ${d.description || 'Stay safe and follow safety guidelines'}`,
      source: 'local'
    }));

    // Map flood alerts
    const floodAlerts = (floodResponse.data || []).slice(0, 5).map(alert => ({
      _id: `flood-${alert.station_name}`,
      type: 'flood',
      location: `${alert.station_name} - ${alert.river_name}`,
      severity: alert.alert_status === 'MAJOR' ? 'critical' : 
               alert.alert_status === 'MINOR' ? 'high' : 'medium',
      timestamp: alert.timestamp,
      message: `${alert.alert_status} flood alert at ${alert.station_name}. Water level: ${alert.water_level}m (${alert.rising_or_falling})`,
      source: 'flood_api',
      water_level: alert.water_level,
      alert_status: alert.alert_status
    }));

    // Combine and sort by timestamp
    const allAlerts = [...disasterAlerts, ...floodAlerts]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: allAlerts
    });
  } catch (error) {
    console.error('[PUBLIC ALERTS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching alerts"
    });
  }
});

// GET /api/public/weather - Get weather data (public access)
router.get('/weather', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Call OpenWeatherMap API if configured
    if (process.env.OPENWEATHER_API_KEY) {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const weatherData = {
        temperature: `${Math.round(response.data.main.temp)}°C`,
        condition: response.data.weather[0].main,
        humidity: `${response.data.main.humidity}%`,
        windSpeed: `${Math.round(response.data.wind.speed * 3.6)} km/h`
      };

      return res.json({
        success: true,
        data: weatherData
      });
    }

    // Fallback to mock data
    res.json({
      success: true,
      data: {
        temperature: '28°C',
        condition: 'Partly Cloudy',
        humidity: '75%',
        windSpeed: '12 km/h'
      }
    });
  } catch (error) {
    console.error('[PUBLIC WEATHER ERROR]', error);
    res.json({
      success: true,
      data: {
        temperature: '28°C',
        condition: 'Partly Cloudy',
        humidity: '75%',
        windSpeed: '12 km/h'
      }
    });
  }
});

// GET /api/public/risk-assessment - Calculate risk based on location
router.get('/risk-assessment', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Find nearby active disasters
    const disasters = await Disaster.find({ status: 'active' });

    let riskLevel = 'Low';
    let nearbyDisasters = [];

    disasters.forEach(disaster => {
      if (disaster.location) {
        // Calculate distance (simple approximation)
        const distance = Math.sqrt(
          Math.pow(disaster.location.lat - userLat, 2) +
          Math.pow(disaster.location.lng - userLng, 2)
        ) * 111; // Convert to approximate km

        if (distance < 50) {
          nearbyDisasters.push({
            name: disaster.name,
            type: disaster.type,
            distance: Math.round(distance)
          });

          if (disaster.severity === 'critical' && distance < 10) {
            riskLevel = 'High';
          } else if (disaster.severity === 'high' && distance < 20) {
            if (riskLevel !== 'High') riskLevel = 'Medium';
          } else if (distance < 30) {
            if (riskLevel === 'Low') riskLevel = 'Medium';
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        risk_level: riskLevel,
        nearby_disasters: nearbyDisasters
      }
    });
  } catch (error) {
    console.error('[PUBLIC RISK ASSESSMENT ERROR]', error);
    res.json({
      success: true,
      data: {
        risk_level: 'Low',
        nearby_disasters: []
      }
    });
  }
});

// POST /api/public/chat - AI Safety Assistant (no auth required)
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    console.log('Public chat request:', message);

    // Use Gemini AI if configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `${SAFETY_SYSTEM_PROMPT}\n\nUser Question: ${message}\n\nProvide a helpful, safety-focused response:`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Save to chat log
        const chatLog = new ChatLog({
          user_id: 'anonymous',
          query: message,
          response: aiResponse
        });
        await chatLog.save();

        return res.json({
          success: true,
          data: {
            response: aiResponse
          }
        });
      } catch (aiError) {
        console.error('[GEMINI AI ERROR]', aiError);
        // Fall through to fallback response
      }
    }

    // Fallback responses
    const fallbackResponses = {
      earthquake: "During an earthquake: DROP, COVER, and HOLD ON. Get under sturdy furniture if indoors. If outdoors, move away from buildings. After shaking stops, check for injuries and damage. For immediate help, call 119.",
      flood: "During flooding: Move to higher ground immediately. Avoid walking or driving through flood water. Turn off utilities if instructed. Emergency contact: 119. Stay tuned to local news for updates.",
      cyclone: "Before a cyclone: Secure loose objects, board windows, stock emergency supplies (water, food, medicine, flashlight). Stay indoors during the storm. Emergency number: 119.",
      fire: "In case of fire: Alert others and evacuate immediately. Stay low to avoid smoke. Feel doors before opening. Never use elevators. Call fire department: 110. Meet at designated assembly point.",
      supplies: "Emergency supplies checklist: Water (1 gallon per person per day for 3 days), Non-perishable food, First aid kit, Flashlight, Battery-powered radio, Extra batteries, Medications, Important documents, Cash, Mobile phone charger.",
      default: "I'm here to help with disaster safety and emergency preparedness. For immediate emergencies, call 119. For specific guidance, ask about earthquakes, floods, cyclones, fire safety, or emergency supplies."
    };

    const lowerMessage = message.toLowerCase();
    let response = fallbackResponses.default;

    if (lowerMessage.includes('earthquake') || lowerMessage.includes('quake')) {
      response = fallbackResponses.earthquake;
    } else if (lowerMessage.includes('flood') || lowerMessage.includes('water')) {
      response = fallbackResponses.flood;
    } else if (lowerMessage.includes('cyclone') || lowerMessage.includes('hurricane') || lowerMessage.includes('storm')) {
      response = fallbackResponses.cyclone;
    } else if (lowerMessage.includes('fire')) {
      response = fallbackResponses.fire;
    } else if (lowerMessage.includes('supplies') || lowerMessage.includes('kit') || lowerMessage.includes('prepare')) {
      response = fallbackResponses.supplies;
    }

    // Save to chat log
    const chatLog = new ChatLog({
      user_id: 'anonymous',
      query: message,
      response: response
    });
    await chatLog.save();

    res.json({
      success: true,
      data: { response }
    });
  } catch (error) {
    console.error('[PUBLIC CHAT ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error processing chat request",
      data: {
        response: "I apologize for the technical difficulty. For emergencies, please call 119. I'll be back online shortly."
      }
    });
  }
});

// GET /api/public/ddmcu-contacts - Get District Disaster Management Centre Unit contacts
router.get('/ddmcu-contacts', async (req, res) => {
  try {
    const { district } = req.query;
    
    console.log(`📞 Fetching DDMCU contacts${district ? ` for district: ${district}` : ' (all districts)'}`);

    // Official DDMCU contact data for all 25 districts of Sri Lanka (from DMC)
    const ddmcuContacts = {
      'Ampara': {
        district: 'Ampara',
        district_si: 'අම්පාර',
        district_ta: 'அம்பாறை',
        officer_name: 'Mr.M.A.C.M.Riyas',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 632 222 218',
        mobile_phone: '+94 773 957 883',
        email: 'ampara.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Ampara'
      },
      'Anuradhapura': {
        district: 'Anuradhapura',
        district_si: 'අනුරාධපුරය',
        district_ta: 'அனுராதபுரம்',
        officer_name: 'Lt Col SMDM Samarakoon',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 252 234 817',
        mobile_phone: '+94 773 957 881',
        email: 'anuradhapura.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Anuradhapura'
      },
      'Badulla': {
        district: 'Badulla',
        district_si: 'බදුල්ල',
        district_ta: 'பதுளை',
        officer_name: 'Mr. E. M. L. U. Kumara',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 552 224 751',
        mobile_phone: '+94 773 957 880',
        email: 'badulla.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Badulla'
      },
      'Batticaloa': {
        district: 'Batticaloa',
        district_si: 'මඩකලපුව',
        district_ta: 'மட்டக்களப்பு',
        officer_name: 'Mr.A.S.M.Ziyath',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 652 227 701',
        mobile_phone: '+94 773 957 885',
        email: 'batticaloa.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Batticaloa'
      },
      'Colombo': {
        district: 'Colombo',
        district_si: 'කොළඹ',
        district_ta: 'கொழும்பு',
        officer_name: 'Wing Comm. G P Dissanayaka',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 112 434 028',
        mobile_phone: '+94 773 957 870',
        email: 'colombo.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Colombo'
      },
      'Galle': {
        district: 'Galle',
        district_si: 'ගාල්ල',
        district_ta: 'காலி',
        officer_name: 'Lt Col JNP Liyanagama',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 912 227 315',
        mobile_phone: '+94 773 957 873',
        email: 'galle.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Galle'
      },
      'Gampaha': {
        district: 'Gampaha',
        district_si: 'ගම්පහ',
        district_ta: 'கம்பஹா',
        officer_name: 'Mr. A. M. A. N. Chandrasiri',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 332 234 671',
        mobile_phone: '+94 773 957 871',
        email: 'gampaha.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Gampaha'
      },
      'Hambantota': {
        district: 'Hambantota',
        district_si: 'හම්බන්තොට',
        district_ta: 'அம்பாந்தோட்டை',
        officer_name: 'Sqn Ldr KA Kumara',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 472 256 463',
        mobile_phone: '+94 773 957 875',
        email: 'hambantota.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Hambantota'
      },
      'Jaffna': {
        district: 'Jaffna',
        district_si: 'යාපනය',
        district_ta: 'யாழ்ப்பாணம்',
        officer_name: 'Mr.N.Sooriyarajah',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 212 221 676',
        mobile_phone: '+94 773 957 894',
        email: 'jaffna.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Jaffna'
      },
      'Kalutara': {
        district: 'Kalutara',
        district_si: 'කළුතර',
        district_ta: 'களுத்துறை',
        officer_name: 'Lt Col T V N De Saa',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 342 222 912',
        mobile_phone: '+94 773 957 872',
        email: 'kalutara.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Kalutara'
      },
      'Kandy': {
        district: 'Kandy',
        district_si: 'මහනුවර',
        district_ta: 'கண்டி',
        officer_name: 'Mr.I.A.K.Ranaweera',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 812 202 697',
        mobile_phone: '+94 773 957 878',
        email: 'kandy.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Kandy'
      },
      'Kegalle': {
        district: 'Kegalle',
        district_si: 'කෑගල්ල',
        district_ta: 'கேகாலை',
        officer_name: 'Mr.K.A.D.K.S.D Bandara',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 352 222 603',
        mobile_phone: '+94 773 957 876',
        email: 'kegalle.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Kegalle'
      },
      'Kilinochchi': {
        district: 'Kilinochchi',
        district_si: 'කිලිනොච්චිය',
        district_ta: 'கிளிநொச்சி',
        officer_name: 'Mr.A.M.R.M.K.Alahakoon',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 212 285 330',
        mobile_phone: '+94 772 320 528',
        email: 'kilinochchi.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Kilinochchi'
      },
      'Kurunegala': {
        district: 'Kurunegala',
        district_si: 'කුරුණෑගල',
        district_ta: 'குருநாகல்',
        officer_name: 'Mr.Anura Viraj Dissanayake',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 372 221 709',
        mobile_phone: '+94 773 957 887',
        email: 'kurunegala.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Kurunegala'
      },
      'Mannar': {
        district: 'Mannar',
        district_si: 'මන්නාරම',
        district_ta: 'மன்னார்',
        officer_name: 'Mr.K.Thileepan',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 232 250 133',
        mobile_phone: '+94 772 320 529',
        email: 'mannar.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Mannar'
      },
      'Matale': {
        district: 'Matale',
        district_si: 'මාතලේ',
        district_ta: 'மாத்தளை',
        officer_name: 'Mr.Chaminda Amaraweera',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 662 230 926',
        mobile_phone: '+94 773 957 890',
        email: 'matale.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Matale'
      },
      'Matara': {
        district: 'Matara',
        district_si: 'මාතර',
        district_ta: 'மாத்தறை',
        officer_name: 'Lt.Col.K.G.C.K.Kudagamage',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 412 234 134',
        mobile_phone: '+94 773 957 874',
        email: 'matara.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Matara'
      },
      'Moneragala': {
        district: 'Moneragala',
        district_si: 'මොණරාගල',
        district_ta: 'மொணராகலை',
        officer_name: 'Mr.A.H.Ravindra Kumara',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 552 276 867',
        mobile_phone: '+94 773 957 889',
        email: 'monaragala.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Moneragala'
      },
      'Mullaitivu': {
        district: 'Mullaitivu',
        district_si: 'මුලතිව්',
        district_ta: 'முல்லைத்தீவு',
        officer_name: 'Acting Mr.S.Kokularajah',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 212 290 054',
        mobile_phone: '+94 773 957 886',
        email: 'mullaitivu.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Mullaitivu'
      },
      'Nuwara Eliya': {
        district: 'Nuwara Eliya',
        district_si: 'නුවරඑළිය',
        district_ta: 'நுவரெலியா',
        officer_name: 'Lt Col H B M B N Bandra RWP RSP USP SLA',
        officer_title: 'Asst. Director (District)',
        office_phone: '+94 522 222 113',
        mobile_phone: '+94 773 957 879',
        email: 'nuwaraeliya.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Nuwara Eliya'
      },
      'Polonnaruwa': {
        district: 'Polonnaruwa',
        district_si: 'පොළොන්නරුව',
        district_ta: 'பொலன்னறுவை',
        officer_name: 'Lt Col AJS Abenayaka',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 272 226 676',
        mobile_phone: '+94 773 957 882',
        email: 'polonnaruwa.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Polonnaruwa'
      },
      'Puttalam': {
        district: 'Puttalam',
        district_si: 'පුත්තලම',
        district_ta: 'புத்தளம்',
        officer_name: 'Wing Comm. W.M.D.T.Bandara',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 322 265 756',
        mobile_phone: '+94 773 957 888',
        email: 'puttalam.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Puttalam'
      },
      'Ratnapura': {
        district: 'Ratnapura',
        district_si: 'රත්නපුර',
        district_ta: 'இரத்தினபுரி',
        officer_name: 'Mr.S.H.M.Manjula',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 452 222 991',
        mobile_phone: '+94 773 957 877',
        email: 'ratnapura.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Ratnapura'
      },
      'Trincomalee': {
        district: 'Trincomalee',
        district_si: 'ත්‍රිකුණාමලය',
        district_ta: 'திருகோணமலை',
        officer_name: 'Mr.K.Sugunathas',
        officer_title: 'Deputy Director (District)',
        office_phone: '+94 262 224 711',
        mobile_phone: '+94 773 957 884',
        email: 'trincomalee.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Trincomalee'
      },
      'Vavuniya': {
        district: 'Vavuniya',
        district_si: 'වව්නියාව',
        district_ta: 'வவுனியா',
        officer_name: 'Mr.Ruwan Rathnayake',
        officer_title: 'Asst.Director (District)',
        office_phone: '+94 242 225 553',
        mobile_phone: '+94 773 957 892',
        email: 'vavuniya.ddmc@dmc.gov.lk',
        address: 'District Disaster Management Centre, Vavuniya'
      }
    };

    if (district) {
      const contact = ddmcuContacts[district];
      if (contact) {
        console.log(`✅ Found DDMCU contact for ${district}`);
        return res.json({
          success: true,
          data: contact,
          source: 'dmc_official',
          note: 'Official DDMCU contact data from Sri Lanka Disaster Management Center (DMC).'
        });
      } else {
        console.log(`⚠️ No DDMCU contact found for ${district}`);
        return res.json({
          success: true,
          data: {
            district: district,
            officer_name: 'Contact Information Not Available',
            officer_title: 'Deputy Director (District)',
            office_phone: 'N/A',
            mobile_phone: 'N/A',
            note: 'Please contact National DMC: +94 11 2 136136'
          },
          source: 'local'
        });
      }
    }

    // Return all contacts if no district specified
    console.log(`✅ Returning all DDMCU contacts (${Object.keys(ddmcuContacts).length} districts)`);
    res.json({
      success: true,
      data: Object.values(ddmcuContacts),
      count: Object.keys(ddmcuContacts).length,
      source: 'dmc_official',
      note: 'Official DDMCU contact data from Sri Lanka Disaster Management Center (DMC).'
    });

  } catch (error) {
    console.error('❌ ERROR fetching DDMCU contacts:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching DDMCU contacts",
      error: error.message
    });
  }
});

module.exports = router;
