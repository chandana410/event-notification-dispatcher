const db = require('../db/database');

const insertNotification = db.prepare(
  'INSERT INTO notifications (event_id, recipient, channel, status) VALUES (?, ?, ?, ?)'
);

const updateStatusStmt = db.prepare(
  "UPDATE notifications SET status = ?, retry_count = retry_count + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
);

function createNotification(event_id, recipient, channel = 'email') {
  const result = insertNotification.run(event_id, recipient, channel, 'pending');
  return { id: result.lastInsertRowid };
}

function updateNotificationStatus(notification_id, status, increment_retry = false) {
  updateStatusStmt.run(status, increment_retry ? 1 : 0, notification_id);
}

module.exports = { createNotification, updateNotificationStatus };
