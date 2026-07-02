require('dotenv').config();

require('./db/database');

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Event Notification Dispatcher running on port ${PORT}`);
  console.log(`[Server] POST http://localhost:${PORT}/api/v1/events`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received — shutting down gracefully');
  server.close(() => process.exit(0));
});
