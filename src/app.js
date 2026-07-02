const express = require('express');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(express.json());

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

app.get('/', (req, res) => {
  res.json({
    service: 'Event-Driven Notification Dispatcher',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      post_event: 'POST /api/v1/events',
    },
    description: 'Accepts business events and processes notifications asynchronously via an in-memory queue.',
  });
});

app.use('/api/v1', eventRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
