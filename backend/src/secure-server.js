const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const MetricsMiddleware = require('./middleware/metricsMiddleware');
require('dotenv').config();

const app = express();

// Initialize metrics middleware
// Temporarily disabled for testing
// const metricsMiddleware = new MetricsMiddleware();

// Metrics tracking middleware (must be before other middleware)
// app.use(metricsMiddleware.requestTracker());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API configuration endpoint (secure)
app.get('/api/config', (req, res) => {
  // Only expose non-sensitive configuration to frontend
  const publicConfig = {
    STELLAR_NETWORK: process.env.STELLAR_NETWORK,
    DID_METHOD: process.env.DID_METHOD,
    ENABLE_FREIGHTER: process.env.ENABLE_FREIGHTER !== 'false',
    ENABLE_ADVANCED_FEATURES: process.env.ENABLE_ADVANCED_FEATURES !== 'false',
  };

  res.json(publicConfig);
});

// Health check endpoint with metrics
// app.get('/health', metricsMiddleware.healthWithMetrics());
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint
// app.get('/metrics', metricsMiddleware.metricsEndpoint());

// API routes
app.use('/api/v1', require('./routes'));

// Analytics routes (directly mounted for testing)
const analyticsService = require('./services/analyticsService');
app.get('/api/v1/analytics/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
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
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error tracking middleware
// app.use(metricsMiddleware.errorTracker());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS origin: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
