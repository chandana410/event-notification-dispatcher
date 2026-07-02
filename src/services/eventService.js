const db = require('../db/database');

const insertEvent = db.prepare(
  'INSERT INTO events (event_type, payload) VALUES (?, ?)'
);

function saveEvent(event_type, payload) {
  const result = insertEvent.run(event_type, JSON.stringify(payload));
  return { id: result.lastInsertRowid };
}

module.exports = { saveEvent };
