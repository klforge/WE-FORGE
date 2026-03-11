const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'members.json');
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'members');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

const nameToSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Read/Write helpers
const readMembers = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeMembers = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// GET /api/members — public (for website)
router.get('/', (req, res) => {
  const members = readMembers();
  res.json(members);
});

// POST /api/members — admin only: add new member
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

    const id = String(Date.now());
    const newMember = {
      id,
      name,
      role,
      rollNumber,
      description: description || '',
      bio: bio || '',
      skills: skills ? JSON.parse(skills) : [],
      telegram: telegram || '',
      status: status || 'Online',
    };

    // Save photo locally
    if (req.file) {
      const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const filename = `${slug}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
      newMember.photoUrl = `/api/uploads/members/${filename}`;
    }

    members.push(newMember);
    writeMembers(members);
    res.status(201).json(newMember);
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/members/:id — admin only: edit member
router.put('/:id', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const members = readMembers();
    const idx = members.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Member not found' });

    const { name, role, rollNumber, description, bio, skills, status, telegram } = req.body;
    const updated = { ...members[idx] };

    if (name) updated.name = name;
    if (role) updated.role = role;
    if (rollNumber) updated.rollNumber = rollNumber;
    if (description !== undefined) updated.description = description;
    if (bio !== undefined) updated.bio = bio;
    if (skills) updated.skills = JSON.parse(skills);
    if (telegram !== undefined) updated.telegram = telegram;
    if (status) updated.status = status;

    // Save new photo locally if provided
    if (req.file) {
      const slug = nameToSlug(updated.name);
      const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const filename = `${slug}.${ext}`;
      // Delete old photo if name changed
      if (updated.photoUrl) {
        const oldFile = path.join(UPLOAD_DIR, path.basename(updated.photoUrl));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
      updated.photoUrl = `/api/uploads/members/${filename}`;
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

    const member = members[idx];

    // Delete local photo if exists
    if (member.photoUrl) {
      const photoFile = path.join(UPLOAD_DIR, path.basename(member.photoUrl));
      if (fs.existsSync(photoFile)) fs.unlinkSync(photoFile);
    }

    members.splice(idx, 1);
    writeMembers(members);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/members/reorder — admin only: reorder members
router.put('/reorder/list', authMiddleware, (req, res) => {
  try {
    const { order } = req.body; // array of ids in new order
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Order must be an array of IDs' });

    const members = readMembers();
    const reordered = order
      .map(id => members.find(m => m.id === id))
      .filter(Boolean);

    // Append any members not in the order list (safety)
    members.forEach(m => {
      if (!reordered.some(r => r.id === m.id)) reordered.push(m);
    });

    writeMembers(reordered);
    res.json(reordered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
