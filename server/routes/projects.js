const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { upload, saveFile, deleteFile } = require('../lib/uploadHelper');

const router = express.Router();
const DATA_FILE  = path.resolve(__dirname, '..', 'data', 'projects.json');
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'projects');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const readProjects  = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeProjects = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
const toSlug        = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Removed repeated multer setup and R2 helper functions

// GET /api/projects — public
router.get('/', (_req, res) => {
    res.json(readProjects());
});

// POST /api/projects — admin
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { name, description, github, demo, technologies } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const id = String(Date.now());
        const newProject = {
            id,
            name: name.trim(),
            description: description?.trim() || '',
            github: github?.trim() || '',
            demo: demo?.trim() || '',
            technologies: technologies ? JSON.parse(technologies) : [],
            createdAt: new Date().toISOString(),
        };

        if (req.file) {
            const slug = toSlug(name);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${id}.${ext}`;
            newProject.imageUrl = await saveFile(req.file.buffer, req.file.mimetype, 'projects', UPLOAD_DIR, filename);
        }

        const projects = readProjects();
        projects.push(newProject);
        writeProjects(projects);
        res.status(201).json(newProject);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:id — admin
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const projects = readProjects();
        const idx = projects.findIndex((p) => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Project not found' });

        const { name, description, github, demo, technologies } = req.body;
        const updated = { ...projects[idx] };

        if (name)                   updated.name = name.trim();
        if (description !== undefined) updated.description = description.trim();
        if (github !== undefined)   updated.github = github.trim();
        if (demo !== undefined)     updated.demo = demo.trim();
        if (technologies)           updated.technologies = JSON.parse(technologies);

        if (req.file) {
            await deleteFile(updated.imageUrl, UPLOAD_DIR);
            const slug = toSlug(updated.name);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${updated.id}.${ext}`;
            updated.imageUrl = await saveFile(req.file.buffer, req.file.mimetype, 'projects', UPLOAD_DIR, filename);
        }

        projects[idx] = updated;
        writeProjects(projects);
        res.json(updated);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:id — admin
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const projects = readProjects();
        const idx = projects.findIndex((p) => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Project not found' });

        await deleteFile(projects[idx].imageUrl, UPLOAD_DIR);
        projects.splice(idx, 1);
        writeProjects(projects);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
