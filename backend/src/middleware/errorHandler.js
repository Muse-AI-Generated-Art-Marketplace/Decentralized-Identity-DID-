const logger = require('./logger');
const { formatErrorResponse } = require('../utils/errorMessages');
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const monitoringService = require('../services/monitoringService');
const { metricsService } = require('../services/metricsService');

/**
 * Global Error Handling Middleware
 * Catch all errors in the application, log them, and send a user-friendly JSON error response
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Determine error status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const resolvedStatusCode = err.status || statusCode;
  const route = `${req.baseUrl || ''}${req.route?.path || req.path || req.originalUrl || 'unknown'}`;
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    activeSpan.recordException(err);
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
  }

  const errorEvent = {
    correlationId: req.correlationId,
    errorName: err.name || 'Error',
    message: err.message,
    stack: err.stack,
    statusCode: resolvedStatusCode,
    method: req.method,
    route,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  if (!req.errorMetricRecorded) {
    metricsService.recordError(errorEvent.errorName, route);
  }
  monitoringService.captureApplicationError(errorEvent);
  logger.error('Unhandled request error', { error: err, ...errorEvent });

  // Format the user-friendly error response
  const errorResponse = formatErrorResponse(err, req);
  errorResponse.error.correlationId = req.correlationId;

  // Send the response
  res.status(resolvedStatusCode).json(errorResponse);
};

module.exports = errorHandler;
