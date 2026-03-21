const express = require('express');
const authMiddleware = require('../middleware/auth');
const noticeController = require('../controllers/noticeController');

const router = express.Router();

router.get('/', noticeController.getNotices);
router.post('/', authMiddleware, noticeController.createNotice);
router.put('/:id', authMiddleware, noticeController.updateNotice);
router.delete('/:id', authMiddleware, noticeController.deleteNotice);

module.exports = router;
