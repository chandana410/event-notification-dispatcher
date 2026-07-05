const { run } = require('../db/database');

async function saveEvent(event_type, payload) {
  const result = await run(
    'INSERT INTO events (event_type, payload) VALUES (?, ?)',
    [event_type, JSON.stringify(payload)]
  );
  return { id: result.lastInsertRowid };
}

module.exports = { saveEvent };
