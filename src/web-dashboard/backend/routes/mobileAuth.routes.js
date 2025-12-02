// routes/mobileAuth.routes.js
const SosSignal = require('../models/SosSignal');
const Disaster = require('../models/Disaster');
const Report = require('../models/Report');
const Resource = require('../models/Resource');
const ChatLog = require('../models/ChatLog');

const express = require('express');
const jwt = require('jsonwebtoken');
const MockSLUDIService = require('../services/mock-sludi-service');

// Gemini AI integration
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Safety system prompt for AI responses
const SAFETY_SYSTEM_PROMPT = `You are an AI Safety Assistant for emergency preparedness and crisis response. 

CRITICAL SAFETY GUIDELINES:
- Always prioritize user safety in your responses
- Provide clear, step-by-step instructions for emergency situations
- Include relevant safety warnings and precautions
- Suggest appropriate emergency contacts when necessary (112 for emergencies in Sri Lanka, 119 for police, 110 for fire)
- Be supportive but factual and accurate
- If someone is in immediate danger, immediately direct them to call emergency services
- For disaster-related queries, provide location-specific guidance when possible
- Always include preventive measures and preparation tips

RESPONSE FORMAT:
- Start with immediate safety action if urgent
- Provide step-by-step instructions
- Include relevant warnings and precautions
- End with follow-up resources or contacts`;

const router = express.Router();
const sludiService = new MockSLUDIService();
const { authenticateToken } = require('../middleware/auth');

// Utility function to validate NIC (simplified)
const validateNIC = (nic) => /^[a-zA-Z0-9]{6,20}$/.test(nic);

// POST /api/mobile/login
router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);
  
  try {
    const { individualId, otp } = req.body;
    console.log('Processing login for:', { individualId, otp });
    
    // Mock SLUDI authentication
    const authRequest = {
      id: "mosip.identity.auth",
      version: "1.0",
      individualId: individualId,
      individualIdType: "UIN",
      transactionID: `TXN_${Date.now()}`,
      requestTime: new Date().toISOString(),
      request: {
        otp: otp,
        timestamp: new Date().toISOString()
      },
      consentObtained: true
    };
    
    console.log('Calling SLUDI service with:', authRequest);
    const authResponse = await sludiService.authenticate(authRequest);
    console.log('SLUDI response:', authResponse);
    
    if (authResponse.response.authStatus) {
      // Simulate user DB lookup
      const userData = sludiService.mockUsers.find(u => u.individualId === individualId);
      console.log('Found user data:', userData);
      
      // Generate a mock _id for user
      const user = {
        _id: userData ? userData.individualId : individualId,
        individualId: userData ? userData.individualId : individualId,
        name: userData ? userData.name : 'Unknown',
        role: userData ? userData.role : 'Citizen'
      };
      
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error: JWT_SECRET not set'
        });
      }
      const appToken = jwt.sign(
        {
          _id: user._id,
          individualId: user.individualId,
          role: user.role,
          name: user.name,
          sludiToken: authResponse.response.authToken
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      console.log('Sending success response with user:', user);
      res.json({
        success: true,
        token: appToken,
        user,
        message: "Authentication successful"
      });
    } else {
      console.log('Authentication failed:', authResponse.errors);
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        errors: authResponse.errors
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

  // POST /api/mobile/sos
  router.post('/sos', authenticateToken, async (req, res) => {
  try {
    const { location, message, priority } = req.body;
    const userId = req.user._id || req.user.user_id || req.user.individualId;
    
    console.log('SOS request received:', { location, message, priority, userId });

    if (!location || !message) {
      return res.status(400).json({
        success: false,
        message: "Location and message are required"
      });
    }

    const sos = new SosSignal({
      user_id: userId,
      location,
      message,
      priority: priority || 'medium'
    });

    console.log('Saving SOS signal:', sos);
    await sos.save();
    console.log('SOS signal saved successfully to sos_signals collection');

    res.json({
      success: true,
      message: "SOS signal sent",
      data: sos
    });
  } catch (error) {
    console.error('[SOS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Server error sending SOS"
    });
  }
});

// GET /api/mobile/disasters - Get all disasters (active and resolved)
router.get('/disasters', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status; // Allow filtering by status if specified
    }
    
         const disasters = await Disaster.find(query)
       .sort({ timestamp: -1 })
       .limit(50); // Increased limit to show more disasters
     
     console.log('Found disasters:', disasters.length);
     
     const response = {
       success: true,
       data: disasters
     };
    
    res.json(response);
  } catch (error) {
    console.error('[DISASTERS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching disasters"
    });
  }
});

// POST /api/mobile/populate-test-disasters - Populate test disaster data with proper coordinates
router.post('/populate-test-disasters', authenticateToken, async (req, res) => {
  try {
    // Clear existing disasters
    await Disaster.deleteMany({});
    
         // Create test disasters matching the actual database structure
     const testDisasters = [
       {
         type: 'flood',
         severity: 'high',
         description: 'Severe flooding in Ratnapura district after continuous rainfall',
         location: { lat: 6.6847, lng: 80.4025 },
         timestamp: new Date('2025-08-08T16:28:52.933Z'),
         status: 'active'
       },
       {
         type: 'landslide',
         severity: 'high',
         description: 'Landslide disaster in Nuwara Eliya district, Sri Lanka',
         location: { lat: 6.9497, lng: 80.7718 },
         timestamp: new Date('2025-08-08T11:04:27.670Z'),
         status: 'active'
       },
       {
         type: 'flood',
         severity: 'medium',
         description: 'Urban flooding in Colombo due to heavy monsoon rains',
         location: { lat: 6.9271, lng: 79.8612 },
         timestamp: new Date('2025-08-08T00:15:04.537Z'),
         status: 'resolved'
       }
     ];
    
    const createdDisasters = await Disaster.insertMany(testDisasters);
    
    res.json({
      success: true,
      message: 'Test disaster data populated successfully',
      data: createdDisasters
    });
  } catch (error) {
    console.error('[POPULATE TEST DISASTERS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error populating test disaster data"
    });
  }
});

// GET /api/mobile/reports - Get recent reports
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('[REPORTS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching reports"
    });
  }
});

// GET /api/mobile/sos-signals - Get recent SOS signals
router.get('/sos-signals', authenticateToken, async (req, res) => {
  try {
    const sosSignals = await SosSignal.find()
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: sosSignals
    });
  } catch (error) {
    console.error('[SOS SIGNALS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching SOS signals"
    });
  }
});

// GET /api/mobile/resources - Get available resources
router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'available' })
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('[RESOURCES ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching resources"
    });
  }
});

// GET /api/mobile/chat-logs - Get user's chat history
router.get('/chat-logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.user_id || req.user.individualId;
    const chatLogs = await ChatLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json({
      success: true,
      data: chatLogs
    });
  } catch (error) {
    console.error('[CHAT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat logs"
    });
  }
});

// Test endpoint for debugging
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working',
    timestamp: new Date().toISOString()
  });
});

// POST /api/mobile/reports - Submit a new report
router.post('/reports', authenticateToken, async (req, res) => {
  try {
    const { type, description, disaster_id, image_url, location } = req.body;
    const userId = req.user._id || req.user.user_id || req.user.individualId;
    
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: "Type and description are required"
      });
    }

    const report = new Report({
      user_id: userId,
      disaster_id: disaster_id || null,
      type,
      description,
      image_url: image_url || null,
      location: location || null,
      status: 'pending'
    });

    await report.save();

    res.json({
      success: true,
      message: "Report submitted successfully",
      data: report
    });
  } catch (error) {
    console.error('[REPORT SUBMISSION ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error submitting report"
    });
  }
});

// POST /api/mobile/chat - Submit a chat message
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id || req.user.user_id || req.user.individualId;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }

    // Mock response - in real app, this would be AI/chatbot response
    const response = "Thank you for your message. Our support team will get back to you shortly.";

    const chatLog = new ChatLog({
      user_id: userId,
      query,
      response
    });

    await chatLog.save();

    res.json({
      success: true,
      message: "Chat message sent",
      data: {
        query,
        response,
        timestamp: chatLog.timestamp
      }
    });
  } catch (error) {
    console.error('[CHAT ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error sending chat message"
    });
  }
});

// POST /api/mobile/chat/gemini - AI Safety Assistant with Gemini
router.post('/chat/gemini', authenticateToken, async (req, res) => {
  try {
    const { query, context } = req.body;
    const userId = req.user._id || req.user.user_id || req.user.individualId;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }

    console.log('Gemini chat request:', { query, userId });

    // Initialize Gemini model - using flash for better rate limits
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Use simple generateContent instead of chat session to reduce token usage
    const prompt = `${SAFETY_SYSTEM_PROMPT}

User Query: ${query}
${context ? `Context: ${context}` : ''}

Please provide a helpful response with safety recommendations. Keep your response concise and actionable.`;

    // Get response from Gemini with reduced token usage
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Analyze response for safety level and extract recommendations
    const safetyAnalysis = analyzeSafetyLevel(query, text);
    
    // Extract recommendations from the response
    const recommendations = extractRecommendations(text);

    const chatLog = new ChatLog({
      user_id: userId,
      query,
      response: text,
      type: 'assistant',
      safetyLevel: safetyAnalysis.level,
      recommendations: recommendations
    });

    await chatLog.save();

    res.json({
      success: true,
      message: "AI Safety Assistant response generated",
      data: {
        query,
        response: text,
        timestamp: chatLog.timestamp,
        safetyLevel: safetyAnalysis.level,
        recommendations: recommendations
      }
    });
  } catch (error) {
    console.error('[GEMINI CHAT ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Error processing AI Safety Assistant request",
      error: error.message,
      details: error.stack
    });
  }
});

// Helper function to analyze safety level
function analyzeSafetyLevel(query, response) {
  const emergencyKeywords = ['emergency', 'urgent', 'danger', 'fire', 'flood', 'earthquake', 'hurricane', 'tornado', 'tsunami', 'evacuate', 'immediate', 'critical'];
  const safetyKeywords = ['safe', 'preparation', 'plan', 'supplies', 'checklist', 'guidance', 'information'];
  
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();
  
  let emergencyCount = 0;
  let safetyCount = 0;
  
  emergencyKeywords.forEach(keyword => {
    if (queryLower.includes(keyword) || responseLower.includes(keyword)) {
      emergencyCount++;
    }
  });
  
  safetyKeywords.forEach(keyword => {
    if (queryLower.includes(keyword) || responseLower.includes(keyword)) {
      safetyCount++;
    }
  });
  
  if (emergencyCount > 2) {
    return { level: 'high', reason: 'Emergency situation detected' };
  } else if (emergencyCount > 0 || safetyCount > 2) {
    return { level: 'medium', reason: 'Safety concern identified' };
  } else {
    return { level: 'low', reason: 'General information request' };
  }
}

// Helper function to extract recommendations from response
function extractRecommendations(response) {
  const recommendations = [];
  const lines = response.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      recommendations.push(trimmed.substring(1).trim());
    } else if (trimmed.includes('recommend') || trimmed.includes('suggest') || trimmed.includes('should')) {
      recommendations.push(trimmed);
    }
  });
  
  // If no structured recommendations found, create general ones
  if (recommendations.length === 0) {
    if (response.toLowerCase().includes('emergency')) {
      recommendations.push('Contact emergency services if immediate danger');
      recommendations.push('Follow evacuation procedures if instructed');
    }
    if (response.toLowerCase().includes('preparation')) {
      recommendations.push('Create an emergency preparedness kit');
      recommendations.push('Develop a family emergency plan');
    }
  }
  
  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

// GET /api/mobile/test-gemini - Test Gemini AI integration
router.get('/test-gemini', async (req, res) => {
  try {
    console.log('Testing Gemini AI integration...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key not configured",
        details: "Please set GEMINI_API_KEY in environment variables"
      });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Test prompt
    const prompt = "Respond with exactly: 'Gemini AI is working correctly for disaster response assistance.'";

    // Get response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini test response:', text);

    res.json({
      success: true,
      message: "Gemini AI integration test successful",
      data: {
        response: text,
        timestamp: new Date().toISOString(),
        model: "gemini-1.5-flash"
      }
    });
  } catch (error) {
    console.error('[GEMINI TEST ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Gemini AI integration test failed",
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router;