// services/shadow-auth.service.js
const jwt = require('jsonwebtoken');
const CitizenUser = require('../models/CitizenUser');

/**
 * Shadow Authentication Service
 * Creates "implicit authentication" for citizens without passwords
 * Based on phone number identification
 */
class ShadowAuthService {
  
  /**
   * Find or create citizen user by phone number
   * This is the "Shadow Account" magic - no signup required!
   */
  static async findOrCreateCitizen(phone, name, additionalData = {}) {
    try {
      // Normalize phone number (remove spaces, dashes)
      const normalizedPhone = phone.replace(/[\s\-]/g, '');
      
      // Check if user exists
      let citizen = await CitizenUser.findOne({ phone: normalizedPhone });
      
      if (citizen) {
        // Update last active
        citizen.last_active = new Date();
        
        // Update name if different (they might have typed it differently)
        if (name && name !== citizen.name) {
          citizen.name = name;
        }
        
        // Merge additional data (email, NIC, etc.)
        if (additionalData.email && !citizen.email) {
          citizen.email = additionalData.email;
        }
        if (additionalData.nic && !citizen.nic) {
          citizen.nic = additionalData.nic;
        }
        
        await citizen.save();
        
        console.log(`[SHADOW AUTH] Existing citizen found: ${citizen.name} (${citizen.phone})`);
      } else {
        // Create new shadow account
        citizen = new CitizenUser({
          phone: normalizedPhone,
          name,
          email: additionalData.email,
          nic: additionalData.nic,
          account_type: 'shadow'
        });
        
        await citizen.save();
        
        console.log(`[SHADOW AUTH] New shadow account created: ${citizen.name} (${citizen.phone})`);
      }
      
      return citizen;
    } catch (error) {
      console.error('[SHADOW AUTH ERROR]', error);
      throw new Error('Failed to create shadow account');
    }
  }
  
  /**
   * Generate JWT token for citizen
   * Token contains: citizenId, phone, name, role
   */
  static generateToken(citizen) {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    
    const payload = {
      citizenId: citizen._id,
      individualId: citizen._id.toString(), // For compatibility with existing code
      phone: citizen.phone,
      name: citizen.name,
      role: 'citizen',
      account_type: citizen.account_type
    };
    
    // Token expires in 30 days (long-lived for convenience)
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '30d' });
    
    return token;
  }
  
  /**
   * Register push notification token for citizen
   */
  static async registerPushToken(citizenId, pushToken, deviceType = 'web') {
    try {
      const citizen = await CitizenUser.findById(citizenId);
      
      if (!citizen) {
        throw new Error('Citizen not found');
      }
      
      // Check if token already exists
      const existingToken = citizen.push_tokens.find(t => t.token === pushToken);
      
      if (!existingToken) {
        citizen.push_tokens.push({
          token: pushToken,
          device_type: deviceType,
          added_at: new Date()
        });
        
        await citizen.save();
        
        console.log(`[PUSH TOKEN] Registered for ${citizen.name}: ${deviceType}`);
      }
      
      return citizen;
    } catch (error) {
      console.error('[PUSH TOKEN ERROR]', error);
      throw error;
    }
  }
  
  /**
   * Increment activity counter
   */
  static async incrementActivity(citizenId, activityType) {
    try {
      const update = {
        last_active: new Date()
      };
      
      if (activityType === 'sos') {
        update.$inc = { sos_submitted: 1 };
      } else if (activityType === 'missing_person') {
        update.$inc = { missing_persons_reported: 1 };
      }
      
      await CitizenUser.findByIdAndUpdate(citizenId, update);
    } catch (error) {
      console.error('[ACTIVITY INCREMENT ERROR]', error);
    }
  }
}

module.exports = ShadowAuthService;
