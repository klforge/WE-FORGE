const express = require('express');
const authMiddleware = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const { upload } = require('../lib/uploadHelper');

const router = express.Router();

router.get('/', projectController.getProjects);
router.post('/', authMiddleware, upload.single('image'), projectController.createProject);
router.put('/:id', authMiddleware, upload.single('image'), projectController.updateProject);
router.delete('/:id', authMiddleware, projectController.deleteProject);

module.exports = router;
