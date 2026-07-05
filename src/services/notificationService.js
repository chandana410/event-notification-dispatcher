const { run } = require('../db/database');

async function createNotification(event_id, recipient, channel = 'email') {
  const result = await run(
    'INSERT INTO notifications (event_id, recipient, channel, status) VALUES (?, ?, ?, ?)',
    [event_id, recipient, channel, 'pending']
  );
  return { id: result.lastInsertRowid };
}

async function updateNotificationStatus(notification_id, status, increment_retry = false) {
  await run(
    'UPDATE notifications SET status = ?, retry_count = retry_count + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, increment_retry ? 1 : 0, notification_id]
  );
}

module.exports = { createNotification, updateNotificationStatus };
