const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const { logger } = require('../middleware');
const { validateEndpoint, sanitizeQuery, sanitizeParams } = require('../middleware/inputValidation');

// Apply sanitization middleware globally
router.use(sanitizeQuery);
router.use(sanitizeParams);

/**
 * @route   GET /api/v1/monitoring
 * @desc    Get monitoring routes info
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({ 
    message: 'Monitoring routes works',
    endpoints: [
      'GET /alerts - Get monitoring alerts',
      'GET /status - Get monitoring status'
    ]
  });
});

/**
 * @swagger
 * /api/v1/monitoring/alerts:
 *   get:
 *     summary: Get contract monitoring alerts
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: A list of recent alerts
 */
router.get('/alerts', validateEndpoint('alertsQuery'), (req, res) => {
  try {
    const { limit = 50, offset = 0, severity, from, to } = req.body || {};
    let alerts = monitoringService.getAlerts();
    
    // Apply filters if provided
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    if (from) {
      const fromDate = new Date(from);
      alerts = alerts.filter(alert => new Date(alert.timestamp) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      alerts = alerts.filter(alert => new Date(alert.timestamp) <= toDate);
    }
    
    // Apply pagination
    const paginatedAlerts = alerts.slice(offset, offset + limit);
    
    res.json({
      success: true,
      count: paginatedAlerts.length,
      total: alerts.length,
      alerts: paginatedAlerts
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

/**
 * @swagger
 * /api/v1/monitoring/status:
 *   get:
 *     summary: Get monitoring service status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Status of the monitoring service
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    active: !!monitoringService.closeStream,
    contractAddress: monitoringService.contractAddress,
    totalAlerts: monitoringService.alerts.length
  });
});

module.exports = router;

