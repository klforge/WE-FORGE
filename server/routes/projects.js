const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'projects.json');

const readProjects = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeProjects = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

// GET /api/projects — public
router.get('/', (_req, res) => {
    const projects = readProjects();
    res.json(projects);
});

// POST /api/projects — admin
router.post('/', authMiddleware, (req, res) => {
    const { name, description, github, demo, technologies } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    const projects = readProjects();
    const newProject = {
        id: String(Date.now()),
        name: name.trim(),
        description: description?.trim() || '',
        github: github?.trim() || '',
        demo: demo?.trim() || '',
        technologies: technologies ? JSON.parse(technologies) : [],
        createdAt: new Date().toISOString(),
    };
    projects.push(newProject);
    writeProjects(projects);
    res.status(201).json(newProject);
});

// PUT /api/projects/:id — admin
router.put('/:id', authMiddleware, (req, res) => {
    const projects = readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    const { name, description, github, demo, technologies } = req.body;
    const updated = { ...projects[idx] };
    if (name) updated.name = name.trim();
    if (description !== undefined) updated.description = description.trim();
    if (github !== undefined) updated.github = github.trim();
    if (demo !== undefined) updated.demo = demo.trim();
    if (technologies) updated.technologies = JSON.parse(technologies);

    projects[idx] = updated;
    writeProjects(projects);
    res.json(updated);
});

// DELETE /api/projects/:id — admin
router.delete('/:id', authMiddleware, (req, res) => {
    const projects = readProjects();
    const idx = projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });
    projects.splice(idx, 1);
    writeProjects(projects);
    res.json({ success: true });
});

module.exports = router;
