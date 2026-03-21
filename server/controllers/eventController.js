const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { saveFile, deleteFile } = require('../lib/uploadHelper');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'events');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const checkStatus = async (events) => {
    const now = new Date();
    let updated = false;
    for (const e of events) {
        if (e.status !== 'ended' && new Date(e.eventDate) < now) {
            e.status = 'ended';
            await e.save();
            updated = true;
        }
    }
    return updated;
};

exports.getEvents = async (req, res) => {
    try {
        let events = await Event.find().sort({ eventDate: 1 });
        await checkStatus(events);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findOne({ id: req.params.id });
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, type, points, slots, registrationDeadline, eventDate, venue, location, status } = req.body;
        if (!title || !eventDate) return res.status(400).json({ error: 'Title and event date are required' });

        const id = String(Date.now());
        let posterUrl = '';

        if (req.file) {
            const slug = toSlug(title);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${id}.${ext}`;
            posterUrl = await saveFile(req.file.buffer, req.file.mimetype, 'events', UPLOAD_DIR, filename);
        }

        const newEvent = new Event({
            id,
            title: title.trim(),
            description: description?.trim() || '',
            type: type?.trim() || '',
            points: Number(points) || 0,
            slots: Number(slots) || 50,
            registrationDeadline: registrationDeadline || eventDate,
            eventDate,
            venue: (venue || location || '').trim(),
            status: status || 'upcoming',
            posterUrl
        });

        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ id: req.params.id });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const { title, description, type, points, slots, registrationDeadline, eventDate, venue, location, status } = req.body;

        if (title) event.title = title.trim();
        if (description !== undefined) event.description = description.trim();
        if (type !== undefined) event.type = type.trim();
        if (points !== undefined) event.points = Number(points);
        if (slots !== undefined) event.slots = Number(slots);
        if (registrationDeadline) event.registrationDeadline = registrationDeadline;
        if (eventDate) event.eventDate = eventDate;
        if (venue !== undefined) event.venue = venue.trim();
        else if (location !== undefined) event.venue = location.trim();
        if (status) event.status = status;

        if (req.file) {
            await deleteFile(event.posterUrl, UPLOAD_DIR);
            const slug = toSlug(event.title);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${event.id}.${ext}`;
            event.posterUrl = await saveFile(req.file.buffer, req.file.mimetype, 'events', UPLOAD_DIR, filename);
        }

        await event.save();
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ id: req.params.id });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        await deleteFile(event.posterUrl, UPLOAD_DIR);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.registerForEvent = async (req, res) => {
    try {
        const { name, rollNumber, email } = req.body;
        if (!name || !rollNumber || !email) return res.status(400).json({ error: 'Fields required' });

        const event = await Event.findOne({ id: req.params.id });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (new Date(event.registrationDeadline) < new Date()) {
            return res.status(400).json({ error: 'Registration deadline passed' });
        }
        if (event.registeredCount >= event.slots) {
            return res.status(400).json({ error: 'No slots remaining' });
        }

        const duplicate = await Registration.findOne({ eventId: event.id, rollNumber: rollNumber.trim() });
        if (duplicate) return res.status(409).json({ error: 'Already registered' });

        const newReg = new Registration({
            id: String(Date.now()),
            eventId: event.id,
            name: name.trim(),
            rollNumber: rollNumber.trim(),
            email: email.trim()
        });

        await newReg.save();
        
        event.registeredCount += 1;
        await event.save();

        res.status(201).json({ success: true, registration: newReg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRegistrations = async (req, res) => {
    try {
        const regs = await Registration.find({ eventId: req.params.id });
        res.json(regs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
