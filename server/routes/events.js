const express = require('express');
const authMiddleware = require('../middleware/auth');
const eventController = require('../controllers/eventController');
const { upload } = require('../lib/uploadHelper');

const router = express.Router();

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/:id/register', eventController.registerForEvent);
router.get('/:id/registrations', authMiddleware, eventController.getRegistrations);

router.post('/', authMiddleware, upload.single('poster'), eventController.createEvent);
router.put('/:id', authMiddleware, upload.single('poster'), eventController.updateEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;
