const { metricsService } = require('../services/metricsService');
const logger = require('./logger');

function getRouteLabel(req) {
  const routePath = req.route?.path;
  const baseUrl = req.baseUrl || '';

  if (routePath) {
    return `${baseUrl}${routePath}`;
  }

  return req.path || req.originalUrl || 'unknown';
}

class MetricsMiddleware {
  constructor(service = metricsService) {
    this.metricsService = service;
    this.systemMetricsInterval = null;
    
    // Start system metrics collection interval
    this.startSystemMetricsCollection();
  }

  // Start collecting system metrics periodically
  startSystemMetricsCollection() {
    if (this.systemMetricsInterval) {
      return;
    }

    // Collect system metrics every 30 seconds
    this.systemMetricsInterval = setInterval(() => {
      this.metricsService.collectSystemMetrics();
    }, 30000);

    if (typeof this.systemMetricsInterval.unref === 'function') {
      this.systemMetricsInterval.unref();
    }
  }

  // Middleware to track HTTP requests
  requestTracker() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        const route = getRouteLabel(req);
        const method = req.method;
        const statusCode = res.statusCode;

        // Calculate response size
        const responseSize = res.get('content-length') ? parseInt(res.get('content-length')) : 0;

        // Record metrics
        this.metricsService.recordHttpRequest(method, route, statusCode, duration);
        this.metricsService.recordApiResponseSize(route, method, responseSize);

        if (route !== '/metrics') {
          const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
          logger.log(level, 'HTTP request completed', {
            correlationId: req.correlationId,
            method,
            route,
            statusCode,
            durationMs: Date.now() - startTime,
            responseSize,
          });
        }
      });

      next();
    };
  }

  // Middleware to track errors
  errorTracker() {
    return (err, req, res, next) => {
      const endpoint = getRouteLabel(req);
      const errorType = err.name || 'UnknownError';
      
      // Record error metric
      this.metricsService.recordError(errorType, endpoint);
      req.errorMetricRecorded = true;
      
      next(err);
    };
  }

  // Metrics endpoint for Prometheus
  metricsEndpoint() {
    return async (req, res) => {
      res.set('Content-Type', this.metricsService.register.contentType);
      res.end(await this.metricsService.getMetrics());
    };
  }

  // Health check with metrics
  healthWithMetrics() {
    return (req, res) => {
      const memUsage = process.memoryUsage();
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external
        },
        metrics: {
          activeConnections: 'available via /metrics',
          didRegistrySize: 'available via /metrics',
          cacheHitRate: 'available via /metrics',
          databaseConnections: 'available via /metrics',
          queueSize: 'available via /metrics',
          resourceUtilization: 'available via /metrics',
          blockchainSyncStatus: 'available via /metrics'
        },
        performance: {
          averageResponseTime: this.getAverageResponseTime(),
          requestsPerSecond: this.getRequestsPerSecond(),
          errorRate: this.getErrorRate()
        }
      };
      
      res.json(health);
    };
  }

  // Helper methods for performance metrics
  getAverageResponseTime() {
    // This would typically be calculated from stored metrics
    // For now, return a placeholder
    return '0.5s';
  }

  getRequestsPerSecond() {
    // This would typically be calculated from stored metrics
    // For now, return a placeholder
    return '10';
  }

  getErrorRate() {
    // This would typically be calculated from stored metrics
    // For now, return a placeholder
    return '0.01';
  }

  // Get metrics service instance
  getMetricsService() {
    return this.metricsService;
  }
}

module.exports = MetricsMiddleware;
