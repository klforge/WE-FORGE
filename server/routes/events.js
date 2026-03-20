const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { upload, saveFile, deleteFile } = require('../lib/uploadHelper');

const router = express.Router();
const EVENTS_FILE = path.resolve(__dirname, '..', 'data', 'events.json');
const REGS_FILE   = path.resolve(__dirname, '..', 'data', 'registrations.json');
const UPLOAD_DIR  = path.resolve(__dirname, '..', 'uploads', 'events');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const readJson  = (f) => JSON.parse(fs.readFileSync(f, 'utf-8'));
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const toSlug    = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Sync status: mark past events as ended
const syncStatus = (events) => {
    const now = new Date();
    return events.map((e) => {
        if (e.status !== 'ended' && new Date(e.eventDate) < now) {
            return { ...e, status: 'ended' };
        }
        return e;
    });
};

// ─── Public ─────────────────────────────────────────────

router.get('/', (req, res) => {
    let events = readJson(EVENTS_FILE);
    events = syncStatus(events);
    writeJson(EVENTS_FILE, events);
    events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    res.json(events);
});

router.get('/:id', (req, res) => {
    const events = readJson(EVENTS_FILE);
    const event = events.find((e) => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
});

// ─── Registration (public, validated) ───────────────────

router.post('/:id/register', (req, res) => {
    const { name, rollNumber, email } = req.body;
    if (!name || !rollNumber || !email) {
        return res.status(400).json({ error: 'Name, roll number, and email are required' });
    }

    const events = readJson(EVENTS_FILE);
    const idx = events.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Event not found' });

    const event = events[idx];

    if (new Date(event.registrationDeadline) < new Date()) {
        return res.status(400).json({ error: 'Registration deadline has passed' });
    }
    if (event.registeredCount >= event.slots) {
        return res.status(400).json({ error: 'No slots remaining for this event' });
    }

    const regs = readJson(REGS_FILE);
    const duplicate = regs.find(
        (r) => r.eventId === req.params.id && r.rollNumber === rollNumber.trim()
    );
    if (duplicate) {
        return res.status(409).json({ error: 'This roll number is already registered for this event' });
    }

    const newReg = {
        id: String(Date.now()),
        eventId: req.params.id,
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        email: email.trim(),
        registeredAt: new Date().toISOString(),
    };

    regs.push(newReg);
    writeJson(REGS_FILE, regs);

    events[idx].registeredCount += 1;
    writeJson(EVENTS_FILE, events);

    res.status(201).json({ success: true, registration: newReg });
});

// ─── Admin ───────────────────────────────────────────────

router.post('/', authMiddleware, upload.single('poster'), async (req, res) => {
    try {
        const { title, description, type, points, slots, registrationDeadline, eventDate, venue, location, status } = req.body;
        if (!title || !eventDate) {
            return res.status(400).json({ error: 'Title and event date are required' });
        }

        const id = String(Date.now());
        const newEvent = {
            id,
            title: title.trim(),
            description: description?.trim() || '',
            type: type?.trim() || '',
            points: Number(points) || 0,
            slots: Number(slots) || 50,
            registeredCount: 0,
            registrationDeadline: registrationDeadline || eventDate,
            eventDate,
            venue: (venue || location || '').trim(),
            status: status || 'upcoming',
            createdAt: new Date().toISOString(),
        };

        if (req.file) {
            const slug = toSlug(title);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${id}.${ext}`;
            newEvent.posterUrl = await saveFile(req.file.buffer, req.file.mimetype, 'events', UPLOAD_DIR, filename);
        }

        const events = readJson(EVENTS_FILE);
        events.push(newEvent);
        writeJson(EVENTS_FILE, events);
        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authMiddleware, upload.single('poster'), async (req, res) => {
    try {
        const events = readJson(EVENTS_FILE);
        const idx = events.findIndex((e) => e.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Event not found' });

        const updated = { ...events[idx] };
        const { title, description, type, points, slots, registrationDeadline, eventDate, venue, location, status } = req.body;

        if (title)                  updated.title = title.trim();
        if (description !== undefined) updated.description = description.trim();
        if (type !== undefined)     updated.type = type.trim();
        if (points !== undefined)   updated.points = Number(points);
        if (slots !== undefined)    updated.slots = Number(slots);
        if (registrationDeadline)   updated.registrationDeadline = registrationDeadline;
        if (eventDate)              updated.eventDate = eventDate;
        if (venue !== undefined)    updated.venue = venue.trim();
        else if (location !== undefined) updated.venue = location.trim();
        if (status)                 updated.status = status;

        if (req.file) {
            await deleteFile(updated.posterUrl, UPLOAD_DIR);
            const slug = toSlug(updated.title);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${updated.id}.${ext}`;
            updated.posterUrl = await saveFile(req.file.buffer, req.file.mimetype, 'events', UPLOAD_DIR, filename);
        }

        events[idx] = updated;
        writeJson(EVENTS_FILE, events);
        res.json(updated);
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const events = readJson(EVENTS_FILE);
        const idx = events.findIndex((e) => e.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Event not found' });

        await deleteFile(events[idx].posterUrl, UPLOAD_DIR);
        events.splice(idx, 1);
        writeJson(EVENTS_FILE, events);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/registrations', authMiddleware, (req, res) => {
    const events = readJson(EVENTS_FILE);
    if (!events.find((e) => e.id === req.params.id)) {
        return res.status(404).json({ error: 'Event not found' });
    }
    const regs = readJson(REGS_FILE).filter((r) => r.eventId === req.params.id);
    res.json(regs);
});

module.exports = router;
