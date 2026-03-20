const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { upload, saveFile, deleteFile } = require('../lib/uploadHelper');

const router = express.Router();
const DATA_FILE  = path.resolve(__dirname, '..', 'data', 'members.json');
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'members');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const nameToSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const readMembers  = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeMembers = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// GET /api/members — public
router.get('/', (req, res) => {
    res.json(readMembers());
});

// POST /api/members — admin only
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const members = readMembers();
        const { name, role, rollNumber, description, bio, skills, status, telegram } = req.body;

        if (!name || !role || !rollNumber) {
            return res.status(400).json({ error: 'Name, role, and roll number are required' });
        }

        const slug = nameToSlug(name);
        if (members.some(m => nameToSlug(m.name) === slug)) {
            return res.status(409).json({ error: 'A member with this name already exists' });
        }

        const newMember = {
            id: String(Date.now()),
            name,
            role,
            rollNumber,
            description: description || '',
            bio: bio || '',
            skills: skills ? JSON.parse(skills) : [],
            telegram: telegram || '',
            status: status || 'Online',
        };

        if (req.file) {
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}.${ext}`;
            newMember.photoUrl = await saveFile(req.file.buffer, req.file.mimetype, 'members', UPLOAD_DIR, filename);
        }

        members.push(newMember);
        writeMembers(members);
        res.status(201).json(newMember);
    } catch (err) {
        console.error('Error adding member:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/members/:id — admin only
router.put('/:id', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const members = readMembers();
        const idx = members.findIndex(m => m.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Member not found' });

        const { name, role, rollNumber, description, bio, skills, status, telegram } = req.body;
        const updated = { ...members[idx] };

        if (name)                   updated.name = name;
        if (role)                   updated.role = role;
        if (rollNumber)             updated.rollNumber = rollNumber;
        if (description !== undefined) updated.description = description;
        if (bio !== undefined)      updated.bio = bio;
        if (skills)                 updated.skills = JSON.parse(skills);
        if (telegram !== undefined) updated.telegram = telegram;
        if (status)                 updated.status = status;

        if (req.file) {
            await deleteFile(updated.photoUrl, UPLOAD_DIR);
            const slug = nameToSlug(updated.name);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}.${ext}`;
            updated.photoUrl = await saveFile(req.file.buffer, req.file.mimetype, 'members', UPLOAD_DIR, filename);
        }

        members[idx] = updated;
        writeMembers(members);
        res.json(updated);
    } catch (err) {
        console.error('Error updating member:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/members/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const members = readMembers();
        const idx = members.findIndex(m => m.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Member not found' });

        await deleteFile(members[idx].photoUrl, UPLOAD_DIR);
        members.splice(idx, 1);
        writeMembers(members);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting member:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/members/reorder/list — admin only
router.put('/reorder/list', authMiddleware, (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ error: 'Order must be an array of IDs' });

        const members = readMembers();
        const reordered = order.map(id => members.find(m => m.id === id)).filter(Boolean);
        members.forEach(m => { if (!reordered.some(r => r.id === m.id)) reordered.push(m); });

        writeMembers(reordered);
        res.json(reordered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
