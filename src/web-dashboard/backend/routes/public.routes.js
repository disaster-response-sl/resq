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

// GET /api/public/recent-alerts - Get recent public alerts
router.get('/recent-alerts', async (req, res) => {
  try {
    // Get recent disasters as alerts
    const disasters = await Disaster.find({ status: 'active' })
      .sort({ timestamp: -1 })
      .limit(10);

    const alerts = disasters.map(d => ({
      _id: d._id,
      type: d.type,
      location: d.affected_areas?.join(', ') || 'Multiple areas',
      severity: d.severity,
      timestamp: d.timestamp,
      message: `${d.type} alert: ${d.description || 'Stay safe and follow safety guidelines'}`
    }));

    res.json({
      success: true,
      data: alerts
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
