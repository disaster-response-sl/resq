// routes/public.routes.js - Public routes for citizen access without authentication
const express = require('express');
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
    const { location, message, priority } = req.body;
    
    console.log('Public SOS request received:', { location, message, priority });

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: "Valid location coordinates are required"
      });
    }

    const sos = new SosSignal({
      user_id: 'anonymous', // Anonymous user for public SOS
      location,
      message: message || 'Emergency SOS - Need immediate assistance',
      priority: priority || 'high',
      status: 'pending'
    });

    await sos.save();
    console.log('Public SOS signal saved successfully');

    res.json({
      success: true,
      message: "SOS signal sent successfully. Emergency responders have been notified.",
      data: {
        id: sos._id,
        timestamp: sos.timestamp
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

// POST /api/public/volunteer - Submit volunteer/contribution registration
router.post('/volunteer', async (req, res) => {
  try {
    console.log('💚 VOLUNTEER REGISTRATION received:', req.body);

    // Forward to Supabase Relief API as a contribution
    const supabaseResponse = await axios.post(
      'https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api/contributions',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ VOLUNTEER registered successfully in Supabase');

    res.json({
      success: true,
      message: "Volunteer registration submitted successfully",
      data: supabaseResponse.data
    });
  } catch (error) {
    console.error('❌ VOLUNTEER REGISTRATION ERROR:', error.response?.data || error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error || "Server error submitting volunteer registration"
    });
  }
});

// GET /api/public/sos-signals - Get user-submitted SOS signals from MongoDB
router.get('/sos-signals', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;

    console.log('📡 FETCHING MongoDB SOS signals...');

    let query = {};
    if (status) {
      query.status = status;
    }

    const sosSignals = await SosSignal.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${sosSignals.length} SOS signals in MongoDB`);

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

// GET /api/public/relief-camps - Get real-time relief camp data from Supabase
router.get('/relief-camps', async (req, res) => {
  try {
    const { lat, lng, radius_km, urgency, establishment, status, type } = req.query;
    
    // Build query params for Supabase API
    const params = new URLSearchParams();
    params.append('type', type || 'all');
    params.append('limit', '100');
    
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
      `https://cynwvkagfmhlpsvkparv.supabase.co/functions/v1/public-data-api?${params.toString()}`
    );

    res.json({
      success: true,
      data: response.data,
      source: 'supabase_public_api'
    });
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

module.exports = router;
