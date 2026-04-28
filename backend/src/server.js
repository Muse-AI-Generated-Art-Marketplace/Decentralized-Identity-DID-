// Initialize tracing before any other module
// require('./tracing'); // Temporarily disabled due to OpenTelemetry compatibility issue

const app = require('./secure-server');

module.exports = app;
