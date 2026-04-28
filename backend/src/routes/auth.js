const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEndpoint, sanitizeQuery, sanitizeParams } = require('../middleware/inputValidation');
const { logger } = require('../middleware');

// Apply sanitization middleware globally
router.use(sanitizeQuery);
router.use(sanitizeParams);

/**
 * @route   GET /api/auth
 * @desc    Get auth routes info
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({ 
    message: 'Auth routes works',
    endpoints: [
      'POST /register - Register new user',
      'POST /login - User login',
      'GET /profile - Get user profile',
      'PUT /profile - Update user profile',
      'POST /logout - User logout'
    ]
  });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateEndpoint('register'), async (req, res) => {
  const { username, email, password, publicKey } = req.body;

  // Generate JWT token
  const token = jwt.sign(
    { username, email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      username,
      email,
      publicKey
    },
    token
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', validateEndpoint('login'), async (req, res) => {
  const { email, password } = req.body;

  // Generate JWT token
  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      email
    },
    token
  });
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private (would need auth middleware in production)
 */
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      username: 'example_user',
      email: 'user@example.com'
    }
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validateEndpoint('updateProfile'), (req, res) => {
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: req.body
  });
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', validateEndpoint('changePassword'), (req, res) => {
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;

