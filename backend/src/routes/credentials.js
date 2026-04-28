const express = require('express');
const router = express.Router();
const credentialService = require('../services/credentialService');
const { logger } = require('../middleware');
const { validateEndpoint, validateInput, sanitizeQuery, sanitizeParams } = require('../middleware/inputValidation');

// Apply sanitization middleware globally
router.use(sanitizeQuery);
router.use(sanitizeParams);

/**
 * @route   GET /api/credentials
 * @desc    Get paginated list of credentials
 * @access  Public
 */
router.get('/', validateInput('listCredentialsQuery', 'query'), async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'issued',
      sortOrder = 'desc',
      issuer,
      subject,
      credentialType,
      revoked,
      expired,
      search
    } = req.query;

    let credentials;
    let total;

    if (search) {
      credentials = await credentialService.searchCredentials(search, parseInt(limit));
      total = credentials.length;
    } else {
      const filters = {};
      if (issuer) filters.issuer = issuer;
      if (subject) filters.subject = subject;
      if (credentialType) filters.credentialType = credentialType;
      if (revoked !== undefined) filters.revoked = revoked;
      if (expired !== undefined) filters.expired = expired;

      credentials = await credentialService.getCredentials(filters, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder
      });

      total = await credentialService.getCredentialCount(filters);
    }

    res.json({
      credentials,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + credentials.length) < total
    });
  } catch (error) {
    logger.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credentials',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credentials/:id
 * @desc    Get single credential by ID
 * @access  Public
 */
router.get('/:id', validateInput('credentialId', 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await credentialService.getCredential(id);
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential not found',
        message: `No credential found with ID: ${id}`
      });
    }

    res.json(credential);
  } catch (error) {
    logger.error('Error fetching credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credential',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credentials/count
 * @desc    Get total count of credentials with filters
 * @access  Public
 */
router.get('/count', validateInput('countQuery', 'query'), async (req, res) => {
  try {
    const { issuer, subject, credentialType, revoked, expired } = req.query;
    
    const filters = {};
    if (issuer) filters.issuer = issuer;
    if (subject) filters.subject = subject;
    if (credentialType) filters.credentialType = credentialType;
    if (revoked !== undefined) filters.revoked = revoked;
    if (expired !== undefined) filters.expired = expired;

    const count = await credentialService.getCredentialCount(filters);
    
    res.json({ count });
  } catch (error) {
    logger.error('Error fetching credential count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credential count',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credentials/search
 * @desc    Search credentials
 * @access  Public
 */
router.get('/search', validateInput('searchQuery', 'query'), async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    const results = await credentialService.searchCredentials(query, parseInt(limit));
    
    res.json({
      credentials: results,
      total: results.length,
      query
    });
  } catch (error) {
    logger.error('Error searching credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search credentials',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/credentials/issue
 * @desc    Issue new credential
 * @access  Public
 */
router.post('/issue', validateEndpoint('issueCredential'), async (req, res) => {
  try {
    const credentialData = req.body;
    const credential = await credentialService.issueCredential(credentialData);
    
    res.status(201).json({
      success: true,
      message: 'Credential issued successfully',
      credential
    });
  } catch (error) {
    logger.error('Error issuing credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to issue credential',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/credentials/verify
 * @desc    Verify credential
 * @access  Public
 */
router.post('/verify', validateEndpoint('verifyCredential'), async (req, res) => {
  try {
    const { credentialId, credential } = req.body;
    
    let result;
    if (credential) {
      result = await credentialService.verifyCredential(credential);
    } else {
      const storedCredential = await credentialService.getCredential(credentialId);
      if (!storedCredential) {
        return res.status(404).json({
          success: false,
          error: 'Credential not found',
          message: `No credential found with ID: ${credentialId}`
        });
      }
      result = await credentialService.verifyCredential(storedCredential);
    }
    
    res.json({
      success: true,
      credentialId,
      verifiedAt: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    logger.error('Error verifying credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify credential',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/credentials/revoke
 * @desc    Revoke credential
 * @access  Public
 */
router.post('/revoke', validateEndpoint('revokeCredential'), async (req, res) => {
  try {
    const { credentialId } = req.body;
    const revokedCredential = await credentialService.revokeCredential(credentialId);
    
    res.json({
      success: true,
      message: 'Credential revoked successfully',
      credential: revokedCredential
    });
  } catch (error) {
    logger.error('Error revoking credential:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke credential',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credentials/templates
 * @desc    Get credential templates
 * @access  Public
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'university-degree',
        name: 'University Degree',
        claims: {
          degree: 'Bachelor of Science',
          university: 'Example University',
          field: 'Computer Science',
          gpa: '3.8',
          graduationYear: '2023'
        }
      },
      {
        id: 'professional-license',
        name: 'Professional License',
        claims: {
          licenseType: 'Medical Doctor',
          licenseNumber: 'MD123456',
          issuingBoard: 'State Medical Board',
          expirationDate: '2025-12-31',
          status: 'Active'
        }
      },
      {
        id: 'age-verification',
        name: 'Age Verification',
        claims: {
          ageVerified: true,
          minimumAge: 18,
          verificationMethod: 'Government ID',
          verifiedAt: new Date().toISOString()
        }
      },
      {
        id: 'employment-verification',
        name: 'Employment Verification',
        claims: {
          employer: 'Tech Company Inc.',
          position: 'Software Engineer',
          employmentStatus: 'Active',
          startDate: '2022-01-15',
          department: 'Engineering'
        }
      }
    ];

    res.json(templates);
  } catch (error) {
    logger.error('Error fetching credential templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credential templates',
      message: error.message
    });
  }
});

module.exports = router;

