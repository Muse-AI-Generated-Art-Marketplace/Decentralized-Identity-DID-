const express = require('express');
const router = express.Router();
const analyticsService = require('../../services/analyticsService');
// const { logger } = require('../../middleware');

// Simple logger fallback
const logger = {
  error: console.error,
  info: console.log,
  warn: console.warn
};

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics routes are working' });
});

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Public
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Validate timeRange
    const validTimeRanges = ['7d', '30d', '90d', '1y'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    const analytics = await analyticsService.getDashboardAnalytics(timeRange);

    res.json({
      success: true,
      data: analytics,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/analytics/usage
 * @desc    Get credential usage statistics
 * @access  Public
 */
router.get('/usage', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const validTimeRanges = ['7d', '30d', '90d', '1y'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    const stats = await analyticsService.getCredentialUsageStats(timeRange);

    res.json({
      success: true,
      data: stats,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching usage stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/analytics/verification
 * @desc    Get verification statistics
 * @access  Public
 */
router.get('/verification', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const validTimeRanges = ['7d', '30d', '90d', '1y'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    const stats = await analyticsService.getVerificationStats(timeRange);

    res.json({
      success: true,
      data: stats,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching verification stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/analytics/issuer/:issuerId
 * @desc    Get issuer-specific analytics
 * @access  Public
 */
router.get('/issuer/:issuerId', async (req, res) => {
  try {
    const { issuerId } = req.params;
    const { timeRange = '30d' } = req.query;

    const validTimeRanges = ['7d', '30d', '90d', '1y'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    const stats = await analyticsService.getIssuerAnalytics(issuerId, timeRange);

    res.json({
      success: true,
      data: stats,
      meta: {
        issuerId,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching issuer analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/analytics/credential-type/:credentialType
 * @desc    Get credential type analytics
 * @access  Public
 */
router.get('/credential-type/:credentialType', async (req, res) => {
  try {
    const { credentialType } = req.params;
    const { timeRange = '30d' } = req.query;

    const validTimeRanges = ['7d', '30d', '90d', '1y'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    const stats = await analyticsService.getCredentialTypeAnalytics(credentialType, timeRange);

    res.json({
      success: true,
      data: stats,
      meta: {
        credentialType,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching credential type analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
