# Event-Driven Notification Dispatcher

A lightweight asynchronous notification system built with Express.js, Node.js, and SQLite. It exposes a REST API endpoint that accepts business events, persists them to a database, queues notification tasks, and returns an immediate `202 Accepted` response — while a background worker processes notifications asynchronously.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (≥ 18) |
| Framework | Express.js |
| Database | SQLite via `sqlite3` |
| Queue | Native JS array-based in-memory queue |
| Config | `dotenv` |

---

## Project Structure

```
event-notification-dispatcher/
├── src/
│   ├── app.js                        # Express app, middleware, routes
│   ├── server.js                     # Entry point, server startup
│   ├── controllers/
│   │   └── eventController.js        # Request handler for POST /api/v1/events
│   ├── services/
│   │   ├── eventService.js           # Saves event to SQLite
│   │   ├── notificationService.js    # Creates and updates notifications in SQLite
│   │   └── queueWorker.js            # In-memory queue + background async worker
│   ├── db/
│   │   ├── database.js               # SQLite connection singleton + schema init
│   │   └── schema.sql                # Table definitions
│   └── routes/
│       └── eventRoutes.js            # Route definitions
├── scripts/
│   └── generate-diagram.js           # Generates architecture-diagram.png
├── architecture-diagram.png
├── package.json
├── .env.example
└── README.md
```

---

## Installation

```bash
git clone <repo-url>
cd event-notification-dispatcher
npm install
```

---

## Configuration

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `DB_PATH` | `./data/notifications.db` | SQLite database file path |

---

## Database Setup

The database and tables are created automatically on first startup — no manual migration needed. SQLite creates the `data/` directory and the `.db` file if they do not exist.

To inspect the database manually:

```bash
sqlite3 data/notifications.db "SELECT * FROM notifications;"
```

---

## Running the Application

```bash
# Production
npm start

# Development (auto-restarts on file change, Node.js ≥ 18)
npm run dev
```

Server output on start:

```
[DB] SQLite connected at /path/to/data/notifications.db
[Server] Event Notification Dispatcher running on port 3000
[Server] POST http://localhost:3000/api/v1/events
```

---

## API Endpoint

### `POST /api/v1/events`

Accepts a business event, persists it, queues a notification task, and immediately returns `202 Accepted`.

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
  "event_type": "order_placed",
  "recipient": "user@example.com",
  "data": {
    "order_id": 101
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `event_type` | string | Yes | Type of business event |
| `recipient` | string | Yes | Notification recipient (email address) |
| `data` | object | No | Arbitrary event payload |

#### Success Response — `202 Accepted`

```json
{
  "message": "Event accepted for processing",
  "tracking_id": 1,
  "notification_id": 1,
  "status": "pending"
}
```

#### Error Responses

**400 Bad Request** — missing required fields:
```json
{ "error": "event_type and recipient are required" }
```

**400 Bad Request** — malformed JSON:
```json
{ "error": "Invalid JSON payload" }
```

**500 Internal Server Error** — database or unexpected failure:
```json
{ "error": "Internal server error" }
```

---

## Sample cURL Request

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "order_placed",
    "recipient": "user@example.com",
    "data": {
      "order_id": 101
    }
  }'
```

Expected response (immediate):

```json
{
  "message": "Event accepted for processing",
  "tracking_id": 1,
  "notification_id": 1,
  "status": "pending"
}
```

After 500–1000 ms, the server logs:

```
[Worker] notification_id=1 | event=order_placed | recipient=user@example.com | status=completed | delay=742ms
```

And the notification row in SQLite is updated to `completed` (or `failed`).

---

## How the Asynchronous Queue Works

```
POST /api/v1/events
       │
       ▼
  Validate input
       │
       ▼
  INSERT into events table  ──► event_id
       │
       ▼
  INSERT into notifications table (status: pending)  ──► notification_id
       │
       ▼
  enqueue({ notification_id, recipient, event_type })
       │
       ├──► Return 202 immediately  ◄── (client receives response here)
       │
       ▼  (background — non-blocking)
  Queue Worker picks up task
       │
       ▼
  setTimeout(random 500–1000ms)   ← simulates notification sending
       │
       ├── 90%: UPDATE status = 'completed'
       └── 10%: UPDATE status = 'failed', retry_count += 1
```

**Queue implementation** (`src/services/queueWorker.js`):
- `queue` — plain JavaScript array acting as a FIFO queue
- `enqueue(task)` — pushes task and starts the worker loop if not already running
- `startWorker()` — drains the queue sequentially using `async/await`; a `isProcessing` flag prevents concurrent worker loops
- `processTask(task)` — simulates sending with `setTimeout`, applies 10% failure rate, updates SQLite

The worker runs entirely within Node.js's event loop — no threads, no child processes, no external services.

---

## Assumptions and Limitations

- **In-memory queue** — tasks are lost if the server restarts before they are processed. A persistent queue (Redis, BullMQ) would be needed for production reliability.
- **10% failure rate** is simulated randomly; no actual email sending occurs.
- **No retry mechanism** — `retry_count` is incremented on failure but failed tasks are not re-queued. Production systems would implement exponential-backoff retries.
- **Single-process** — the API server and queue worker share the same Node.js process. For high throughput, a separate worker process with a proper message broker would be preferred.
- **SQLite** — suitable for local/demo use. For multi-instance deployments, a networked database (PostgreSQL, MySQL) would be required.
