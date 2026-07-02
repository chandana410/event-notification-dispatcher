const { updateNotificationStatus } = require('./notificationService');

const queue = [];
let isProcessing = false;

function enqueue(task) {
  queue.push(task);
  if (!isProcessing) {
    startWorker();
  }
}

async function startWorker() {
  isProcessing = true;
  while (queue.length > 0) {
    const task = queue.shift();
    await processTask(task);
  }
  isProcessing = false;
}

async function processTask(task) {
  const { notification_id, recipient, event_type } = task;

  const delay = Math.floor(Math.random() * 501) + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const failed = Math.random() < 0.1;

  if (failed) {
    updateNotificationStatus(notification_id, 'failed', true);
    console.log(
      `[Worker] notification_id=${notification_id} | event=${event_type} | recipient=${recipient} | status=failed | delay=${delay}ms`
    );
  } else {
    updateNotificationStatus(notification_id, 'completed', false);
    console.log(
      `[Worker] notification_id=${notification_id} | event=${event_type} | recipient=${recipient} | status=completed | delay=${delay}ms`
    );
  }
}

function getQueueLength() {
  return queue.length;
}

module.exports = { enqueue, getQueueLength };
