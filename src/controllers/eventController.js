const { saveEvent } = require('../services/eventService');
const { createNotification } = require('../services/notificationService');
const { enqueue } = require('../services/queueWorker');

async function handleEvent(req, res) {
  try {
    const { event_type, recipient, data } = req.body;

    if (!event_type || !recipient) {
      return res.status(400).json({ error: 'event_type and recipient are required' });
    }

    const event = await saveEvent(event_type, { recipient, data });
    const event_id = event.id;

    const notification = await createNotification(event_id, recipient, 'email');
    const notification_id = notification.id;

    enqueue({ notification_id, recipient, event_type });

    return res.status(202).json({
      message: 'Event accepted for processing',
      tracking_id: event_id,
      notification_id,
      status: 'pending',
    });
  } catch (err) {
    console.error('[Controller] Error handling event:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleEvent };
