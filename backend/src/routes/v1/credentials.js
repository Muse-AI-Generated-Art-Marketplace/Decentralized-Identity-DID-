const express = require('express');
const router = express.Router();
const credentialService = require('../services/credentialService');
const { logger } = require('../middleware');
const { body, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @openapi
 * tags:
 *   name: Credentials
 *   description: Verifiable Credentials management
 */

/**
 * @openapi
 * /credentials:
 *   get:
 *     summary: Get paginated list of credentials
 *     tags: [Credentials]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [issued, expires, credentialType, issuer]
 *           default: issued
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: issuer
 *         schema:
 *           type: string
 *         description: Filter by issuer DID
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject DID
 *       - in: query
 *         name: credentialType
 *         schema:
 *           type: string
 *         description: Filter by credential type
 *       - in: query
 *         name: revoked
 *         schema:
 *           type: boolean
 *         description: Filter by revoked status
 *       - in: query
 *         name: expired
 *         schema:
 *           type: boolean
 *         description: Filter by expired status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search query
 *     responses:
 *       200:
 *         description: List of credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */

// GET /credentials - Get paginated list of credentials
router.get('/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('sortBy').optional().isIn(['issued', 'expires', 'credentialType', 'issuer']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('issuer').optional().isString().withMessage('Issuer must be a string'),
    query('subject').optional().isString().withMessage('Subject must be a string'),
    query('credentialType').optional().isString().withMessage('Credential type must be a string'),
    query('revoked').optional().isBoolean().withMessage('Revoked must be boolean'),
    query('expired').optional().isBoolean().withMessage('Expired must be boolean'),
    query('search').optional().isString().withMessage('Search must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
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
        // Use search endpoint for text search
        credentials = await credentialService.searchCredentials(search, parseInt(limit));
        total = credentials.length;
      } else {
        // Use filtered query
        const filters = {};
        if (issuer) filters.issuer = issuer;
        if (subject) filters.subject = subject;
        if (credentialType) filters.credentialType = credentialType;
        if (revoked !== undefined) filters.revoked = revoked === 'true';
        if (expired !== undefined) filters.expired = expired === 'true';

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
        error: 'Failed to fetch credentials',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/{id}:
 *   get:
 *     summary: Get single credential by ID
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credential details
 *       404:
 *         description: Credential not found
 */
// GET /credentials/:id - Get single credential by ID
router.get('/:id',
  [
    body('id').isString().withMessage('Credential ID must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const credential = await credentialService.getCredential(id);
      
      if (!credential) {
        return res.status(404).json({
          error: 'Credential not found',
          message: `No credential found with ID: ${id}`
        });
      }

      res.json(credential);
    } catch (error) {
      logger.error('Error fetching credential:', error);
      res.status(500).json({
        error: 'Failed to fetch credential',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/count:
 *   get:
 *     summary: Get total count of credentials with filters
 *     tags: [Credentials]
 *     parameters:
 *       - in: query
 *         name: issuer
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: credentialType
 *         schema:
 *           type: string
 *       - in: query
 *         name: revoked
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: expired
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
// GET /credentials/count - Get total count of credentials with filters
router.get('/count',
  [
    query('issuer').optional().isString().withMessage('Issuer must be a string'),
    query('subject').optional().isString().withMessage('Subject must be a string'),
    query('credentialType').optional().isString().withMessage('Credential type must be a string'),
    query('revoked').optional().isBoolean().withMessage('Revoked must be boolean'),
    query('expired').optional().isBoolean().withMessage('Expired must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { issuer, subject, credentialType, revoked, expired } = req.query;
      
      const filters = {};
      if (issuer) filters.issuer = issuer;
      if (subject) filters.subject = subject;
      if (credentialType) filters.credentialType = credentialType;
      if (revoked !== undefined) filters.revoked = revoked === 'true';
      if (expired !== undefined) filters.expired = expired === 'true';

      const count = await credentialService.getCredentialCount(filters);
      
      res.json({ count });
    } catch (error) {
      logger.error('Error fetching credential count:', error);
      res.status(500).json({
        error: 'Failed to fetch credential count',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/search:
 *   get:
 *     summary: Search credentials
 *     tags: [Credentials]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 query:
 *                   type: string
 */
// GET /credentials/search - Search credentials
router.get('/search',
  [
    query('q').isString().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  async (req, res) => {
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
        error: 'Failed to search credentials',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/issue:
 *   post:
 *     summary: Issue new credential
 *     tags: [Credentials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issuer, subject, credentialType, claims]
 *             properties:
 *               issuer:
 *                 type: string
 *                 description: Issuer DID
 *               subject:
 *                 type: string
 *                 description: Subject DID
 *               credentialType:
 *                 type: string
 *               claims:
 *                 type: object
 *                 description: Credential claims data
 *               expires:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date (ISO8601)
 *     responses:
 *       201:
 *         description: Credential issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 credential:
 *                   type: object
 */
// POST /credentials/issue - Issue new credential
router.post('/issue',
  [
    body('issuer').isString().withMessage('Issuer DID is required'),
    body('subject').isString().withMessage('Subject DID is required'),
    body('credentialType').isString().withMessage('Credential type is required'),
    body('claims').isObject().withMessage('Claims must be an object'),
    body('expires').optional().isISO8601().withMessage('Expiration date must be valid ISO8601')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const credentialData = req.body;
      const credential = await credentialService.issueCredential(credentialData);
      
      res.status(201).json({
        message: 'Credential issued successfully',
        credential
      });
    } catch (error) {
      logger.error('Error issuing credential:', error);
      res.status(500).json({
        error: 'Failed to issue credential',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/verify:
 *   post:
 *     summary: Verify credential
 *     tags: [Credentials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credentialId]
 *             properties:
 *               credentialId:
 *                 type: string
 *               credential:
 *                 type: object
 *                 description: Optional credential data to verify directly
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 credentialId:
 *                   type: string
 *                 verifiedAt:
 *                   type: string
 *                   format: date-time
 *                 valid:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                 details:
 *                   type: object
 */
// POST /credentials/verify - Verify credential
router.post('/verify',
  [
    body('credentialId').isString().withMessage('Credential ID is required'),
    body('credential').optional().isObject().withMessage('Credential data must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { credentialId, credential } = req.body;
      
      let result;
      if (credential) {
        // Verify provided credential data
        result = await credentialService.verifyCredential(credential);
      } else {
        // Verify credential by ID (fetch first, then verify)
        const storedCredential = await credentialService.getCredential(credentialId);
        if (!storedCredential) {
          return res.status(404).json({
            error: 'Credential not found',
            message: `No credential found with ID: ${credentialId}`
          });
        }
        result = await credentialService.verifyCredential(storedCredential);
      }
      
      res.json({
        credentialId,
        verifiedAt: new Date().toISOString(),
        ...result
      });
    } catch (error) {
      logger.error('Error verifying credential:', error);
      res.status(500).json({
        error: 'Failed to verify credential',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/revoke:
 *   post:
 *     summary: Revoke credential
 *     tags: [Credentials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credentialId]
 *             properties:
 *               credentialId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credential revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 credential:
 *                   type: object
 */
// POST /credentials/revoke - Revoke credential
router.post('/revoke',
  [
    body('credentialId').isString().withMessage('Credential ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { credentialId } = req.body;
      const revokedCredential = await credentialService.revokeCredential(credentialId);
      
      res.json({
        message: 'Credential revoked successfully',
        credential: revokedCredential
      });
    } catch (error) {
      logger.error('Error revoking credential:', error);
      res.status(500).json({
        error: 'Failed to revoke credential',
        message: error.message
      });
    }
  }
);

/**
 * @openapi
 * /credentials/templates:
 *   get:
 *     summary: Get available credential templates
 *     tags: [Credentials]
 *     responses:
 *       200:
 *         description: List of credential templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   claims:
 *                     type: object
 */
// GET /credentials/templates - Get credential templates
router.get('/templates', async (req, res) => {
  try {
    // Mock templates for now - in a real implementation, these would come from a database
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
      error: 'Failed to fetch credential templates',
      message: error.message
    });
  }
});

module.exports = router;
