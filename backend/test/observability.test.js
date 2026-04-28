const express = require('express');
const request = require('supertest');
const MetricsMiddleware = require('../src/middleware/metricsMiddleware');
const errorHandler = require('../src/middleware/errorHandler');
const { requestContextMiddleware } = require('../src/middleware/requestContext');
const { metricsService } = require('../src/services/metricsService');
const monitoringService = require('../src/services/monitoringService');

describe('Observability integration', () => {
  let app;
  let metricsMiddleware;

  beforeEach(() => {
    metricsService.resetMetrics();
    monitoringService.applicationErrors = [];
    metricsMiddleware = new MetricsMiddleware(metricsService);

    app = express();
    app.use(express.json());
    app.use(requestContextMiddleware);
    app.use(metricsMiddleware.requestTracker());

    app.get('/ok', (req, res) => {
      res.json({ ok: true, correlationId: req.correlationId });
    });

    app.get('/boom', (req, res, next) => {
      next(new Error('boom'));
    });

    app.use(metricsMiddleware.errorTracker());
    app.use(errorHandler);
  });

  test('returns and propagates correlation ids', async () => {
    const response = await request(app)
      .get('/ok')
      .set('x-correlation-id', 'corr-test-123');

    expect(response.status).toBe(200);
    expect(response.headers['x-correlation-id']).toBe('corr-test-123');
    expect(response.body.correlationId).toBe('corr-test-123');
  });

  test('captures structured error context for monitoring and clients', async () => {
    const response = await request(app)
      .get('/boom')
      .set('x-correlation-id', 'corr-error-123');

    expect(response.status).toBe(500);
    expect(response.body.error.correlationId).toBe('corr-error-123');
    expect(monitoringService.getApplicationErrors()).toHaveLength(1);
    expect(monitoringService.getApplicationErrors()[0]).toMatchObject({
      correlationId: 'corr-error-123',
      errorName: 'Error',
      route: '/boom',
    });
  });

  test('records request and error metrics', async () => {
    await request(app).get('/ok');
    await request(app).get('/boom');

    const metrics = await metricsService.getMetrics();
    expect(metrics).toContain('http_requests_total');
    expect(metrics).toContain('error_rate_total');
    expect(metrics).toContain('route="/ok"');
    expect(metrics).toContain('endpoint="/boom"');
  });
});
