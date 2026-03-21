const Member = require('../models/Member');
const { saveFile, deleteFile } = require('../lib/uploadHelper');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'members');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const nameToSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.getMembers = async (req, res) => {
    try {
        const members = await Member.find().sort({ orderIndex: 1, createdAt: 1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { name, role, domain, rollNumber, department, email, description, bio, skills, status, telegram } = req.body;
        if (!name || !role || !rollNumber) return res.status(400).json({ error: 'Name, role, and roll number are required' });

        const slug = nameToSlug(name);
        const exists = await Member.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (exists) return res.status(409).json({ error: 'A member with this name already exists' });

        const count = await Member.countDocuments();

        const id = String(Date.now());
        let photoUrl = '';

        if (req.file) {
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}.${ext}`;
            photoUrl = await saveFile(req.file.buffer, req.file.mimetype, 'members', UPLOAD_DIR, filename);
        }

        const newMember = new Member({
            id,
            name,
            role,
            domain: domain || '',
            rollNumber,
            department: department || '',
            email: email || '',
            description: description || '',
            bio: bio || '',
            skills: skills ? JSON.parse(skills) : [],
            telegram: telegram || '',
            status: status || 'Online',
            photoUrl,
            orderIndex: count
        });

        await newMember.save();
        res.status(201).json(newMember);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const member = await Member.findOne({ id: req.params.id });
        if (!member) return res.status(404).json({ error: 'Member not found' });

        const { name, role, domain, rollNumber, department, email, description, bio, skills, status, telegram } = req.body;
        
        if (name) member.name = name;
        if (role) member.role = role;
        if (domain !== undefined) member.domain = domain;
        if (rollNumber) member.rollNumber = rollNumber;
        if (department !== undefined) member.department = department;
        if (email !== undefined) member.email = email;
        if (description !== undefined) member.description = description;
        if (bio !== undefined) member.bio = bio;
        if (skills) member.skills = JSON.parse(skills);
        if (telegram !== undefined) member.telegram = telegram;
        if (status) member.status = status;

        if (req.file) {
            await deleteFile(member.photoUrl, UPLOAD_DIR);
            const slug = nameToSlug(member.name);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}.${ext}`;
            member.photoUrl = await saveFile(req.file.buffer, req.file.mimetype, 'members', UPLOAD_DIR, filename);
        }

        await member.save();
        res.json(member);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        const member = await Member.findOneAndDelete({ id: req.params.id });
        if (!member) return res.status(404).json({ error: 'Member not found' });

        await deleteFile(member.photoUrl, UPLOAD_DIR);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.reorderMembers = async (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) return res.status(400).json({ error: 'Order must be an array of IDs' });

        const bulkOps = order.map((id, index) => ({
            updateOne: {
                filter: { id },
                update: { orderIndex: index }
            }
        }));

        await Member.bulkWrite(bulkOps);
        const members = await Member.find().sort({ orderIndex: 1, createdAt: 1 });
        res.json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
