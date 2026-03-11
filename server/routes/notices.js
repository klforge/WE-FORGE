const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'notices.json');

const readNotices = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeNotices = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

// GET /api/notices — public
router.get('/', (_req, res) => {
    const notices = readNotices();
    notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notices);
});

// POST /api/notices — admin
router.post('/', authMiddleware, (req, res) => {
    const { title, message, priority } = req.body;
    if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
    }
    const notices = readNotices();
    const newNotice = {
        id: String(Date.now()),
        title: title.trim(),
        message: message.trim(),
        priority: priority || 'low',
        createdAt: new Date().toISOString(),
    };
    notices.push(newNotice);
    writeNotices(notices);
    res.status(201).json(newNotice);
});

// PUT /api/notices/:id — admin
router.put('/:id', authMiddleware, (req, res) => {
    const notices = readNotices();
    const idx = notices.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Notice not found' });

    const { title, message, priority } = req.body;
    const updated = { ...notices[idx] };
    if (title) updated.title = title.trim();
    if (message) updated.message = message.trim();
    if (priority) updated.priority = priority;

    notices[idx] = updated;
    writeNotices(notices);
    res.json(updated);
});

// DELETE /api/notices/:id — admin
router.delete('/:id', authMiddleware, (req, res) => {
    const notices = readNotices();
    const idx = notices.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Notice not found' });
    notices.splice(idx, 1);
    writeNotices(notices);
    res.json({ success: true });
});

module.exports = router;
