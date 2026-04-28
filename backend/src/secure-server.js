const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger, errorHandler, requestContextMiddleware } = require('./middleware');
const MetricsMiddleware = require('./middleware/metricsMiddleware');
require('dotenv').config();

// Initialize job queue workers
require('./workers');

const app = express();

// Initialize metrics middleware
const metricsMiddleware = new MetricsMiddleware();

// Request context must run before anything that logs
app.use(requestContextMiddleware);

// Metrics tracking middleware (must be before other middleware)
app.use(metricsMiddleware.requestTracker());

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
app.get('/health', metricsMiddleware.healthWithMetrics());

// Prometheus metrics endpoint
app.get('/metrics', metricsMiddleware.metricsEndpoint());

// API routes
app.use('/api', require('./routes'));

// Error tracking middleware
app.use(metricsMiddleware.errorTracker());

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      userMessage: 'The requested resource was not found.',
      action: 'Verify the URL and try again.',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    corsOrigin: process.env.FRONTEND_URL,
  });
});

module.exports = app;
