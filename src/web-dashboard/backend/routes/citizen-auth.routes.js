// routes/citizen-auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CitizenUser = require('../models/CitizenUser');
const { authenticateToken } = require('../middleware/auth');

// Generate JWT token for citizen
const generateCitizenToken = (citizen) => {
  return jwt.sign(
    {
      citizenId: citizen._id,
      phone: citizen.phone,
      email: citizen.email,
      name: citizen.name,
      role: 'citizen',
      account_type: citizen.account_type
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * POST /api/citizen-auth/signup
 * Register a new citizen account
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validation
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and password are required'
      });
    }

    // Validate phone format (Sri Lankan format)
    const phoneRegex = /^(\+94|0)?[1-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use format: 0771234567 or +94771234567'
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Check if user already exists
    const existingUser = await CitizenUser.findOne({
      $or: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
      if (email && existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new citizen user
    const newCitizen = new CitizenUser({
      name,
      phone,
      email: email || undefined,
      password: hashedPassword,
      account_type: 'verified', // Full account with password
      role: 'citizen'
    });

    await newCitizen.save();

    // Generate token
    const token = generateCitizenToken(newCitizen);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      citizen: {
        id: newCitizen._id,
        name: newCitizen.name,
        phone: newCitizen.phone,
        email: newCitizen.email,
        role: newCitizen.role,
        account_type: newCitizen.account_type
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message
    });
  }
});

/**
 * POST /api/citizen-auth/login
 * Login citizen with phone/email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be phone or email

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone/Email and password are required'
      });
    }

    // Find user by phone or email
    const citizen = await CitizenUser.findOne({
      $or: [
        { phone: identifier },
        { email: identifier }
      ]
    });

    if (!citizen) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account has password (not a shadow account)
    if (!citizen.password) {
      return res.status(400).json({
        success: false,
        message: 'This account was created automatically. Please use "Complete Registration" to set a password.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, citizen.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last active
    citizen.last_active = new Date();
    await citizen.save();

    // Generate token
    const token = generateCitizenToken(citizen);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      citizen: {
        id: citizen._id,
        name: citizen.name,
        phone: citizen.phone,
        email: citizen.email,
        role: citizen.role,
        account_type: citizen.account_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

/**
 * POST /api/citizen-auth/complete-registration
 * Upgrade shadow account to full account by setting password
 */
router.post('/complete-registration', authenticateToken, async (req, res) => {
  try {
    const { password, email } = req.body;
    const citizenId = req.user.citizenId;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const citizen = await CitizenUser.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already has password
    if (citizen.password) {
      return res.status(400).json({
        success: false,
        message: 'Account already has a password'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update citizen
    citizen.password = hashedPassword;
    citizen.account_type = 'verified';
    if (email) {
      // Check if email already exists
      const emailExists = await CitizenUser.findOne({ email, _id: { $ne: citizenId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      citizen.email = email;
    }
    await citizen.save();

    // Generate new token with updated info
    const token = generateCitizenToken(citizen);

    res.json({
      success: true,
      message: 'Registration completed successfully',
      token,
      citizen: {
        id: citizen._id,
        name: citizen.name,
        phone: citizen.phone,
        email: citizen.email,
        role: citizen.role,
        account_type: citizen.account_type
      }
    });

  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/citizen-auth/profile
 * Get citizen profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.citizenId;
    
    const citizen = await CitizenUser.findById(citizenId).select('-password');
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      citizen: {
        id: citizen._id,
        name: citizen.name,
        phone: citizen.phone,
        email: citizen.email,
        role: citizen.role,
        account_type: citizen.account_type,
        sos_submitted: citizen.sos_submitted,
        missing_persons_reported: citizen.missing_persons_reported,
        created_at: citizen.created_at,
        last_active: citizen.last_active
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/citizen-auth/profile
 * Update citizen profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.citizenId;
    const { name, email, nic } = req.body;

    const citizen = await CitizenUser.findById(citizenId);
    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) citizen.name = name;
    if (email) {
      // Check if email already exists
      const emailExists = await CitizenUser.findOne({ email, _id: { $ne: citizenId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      citizen.email = email;
    }
    if (nic) citizen.nic = nic;

    await citizen.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      citizen: {
        id: citizen._id,
        name: citizen.name,
        phone: citizen.phone,
        email: citizen.email,
        nic: citizen.nic,
        role: citizen.role,
        account_type: citizen.account_type
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
