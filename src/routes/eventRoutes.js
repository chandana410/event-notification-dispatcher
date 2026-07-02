const { Router } = require('express');
const { handleEvent } = require('../controllers/eventController');

const router = Router();

router.post('/events', handleEvent);

module.exports = router;
