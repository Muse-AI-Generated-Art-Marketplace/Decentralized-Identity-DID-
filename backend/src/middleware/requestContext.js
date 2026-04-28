const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');
const { trace } = require('@opentelemetry/api');

const requestContextStorage = new AsyncLocalStorage();

function getTraceId() {
  const activeSpan = trace.getActiveSpan();
  return activeSpan?.spanContext()?.traceId;
}

function buildRequestContext(req) {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || randomUUID();

  return {
    correlationId,
    requestId: correlationId,
    method: req.method,
    path: req.originalUrl || req.url,
    traceId: getTraceId(),
  };
}

function requestContextMiddleware(req, res, next) {
  const context = buildRequestContext(req);

  req.correlationId = context.correlationId;
  res.setHeader('x-correlation-id', context.correlationId);

  requestContextStorage.run(context, next);
}

function getRequestContext() {
  return requestContextStorage.getStore();
}

module.exports = {
  getRequestContext,
  requestContextMiddleware,
};
