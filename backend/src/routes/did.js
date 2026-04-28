const express = require('express');
const router = express.Router();
const { validateEndpoint, validateInput, sanitizeParams, sanitizeQuery } = require('../middleware/inputValidation');

// Apply sanitization middleware globally
router.use(sanitizeQuery);
router.use(sanitizeParams);

/**
 * @route   GET /api/did
 * @desc    Get list of DIDs with optional filters
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({ 
    message: 'DID routes works',
    endpoints: [
      'GET / - List DIDs',
      'POST / - Register new DID',
      'GET /:did - Get DID by ID',
      'PUT /:did - Update DID',
      'DELETE /:did - Delete DID'
    ]
  });
});

/**
 * @route   POST /api/did
 * @desc    Register a new DID
 * @access  Public
 */
router.post('/', validateEndpoint('registerDID'), (req, res) => {
  const { did, publicKey, serviceEndpoint } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'DID registered successfully',
    data: {
      did,
      publicKey,
      serviceEndpoint
    }
  });
});

/**
 * @route   GET /api/did/:did
 * @desc    Get DID by ID
 * @access  Public
 */
router.get('/:did', validateInput('did', 'params'), (req, res) => {
  const { did } = req.params;
  
  res.json({
    success: true,
    data: {
      did,
      document: {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did
      }
    }
  });
});

/**
 * @route   PUT /api/did/:did
 * @desc    Update an existing DID
 * @access  Public
 */
router.put('/:did', validateEndpoint('updateDID'), (req, res) => {
  const { did, updates } = req.body;
  
  res.json({
    success: true,
    message: 'DID updated successfully',
    data: {
      did,
      updates
    }
  });
});

/**
 * @route   DELETE /api/did/:did
 * @desc    Delete a DID
 * @access  Public
 */
router.delete('/:did', validateInput('did', 'params'), (req, res) => {
  const { did } = req.params;
  
  res.json({
    success: true,
    message: 'DID deleted successfully',
    data: { did }
  });
});

module.exports = router;

