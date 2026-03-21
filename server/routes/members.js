const express = require('express');
const authMiddleware = require('../middleware/auth');
const memberController = require('../controllers/memberController');
const { upload } = require('../lib/uploadHelper');

const router = express.Router();

router.get('/', memberController.getMembers);
router.post('/', authMiddleware, upload.single('photo'), memberController.createMember);
router.put('/:id', authMiddleware, upload.single('photo'), memberController.updateMember);
router.delete('/:id', authMiddleware, memberController.deleteMember);
router.put('/reorder/list', authMiddleware, memberController.reorderMembers);

module.exports = router;
