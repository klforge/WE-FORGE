const Project = require('../models/Project');
const { saveFile, deleteFile } = require('../lib/uploadHelper');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'projects');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { name, description, github, demo, technologies } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required' });

        const id = String(Date.now());
        let imageUrl = '';

        if (req.file) {
            const slug = toSlug(name);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${id}.${ext}`;
            imageUrl = await saveFile(req.file.buffer, req.file.mimetype, 'projects', UPLOAD_DIR, filename);
        }

        const newProject = new Project({
            id,
            name: name.trim(),
            description: description?.trim() || '',
            github: github?.trim() || '',
            demo: demo?.trim() || '',
            technologies: technologies ? JSON.parse(technologies) : [],
            imageUrl
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { name, description, github, demo, technologies } = req.body;
        const project = await Project.findOne({ id: req.params.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (name) project.name = name.trim();
        if (description !== undefined) project.description = description.trim();
        if (github !== undefined) project.github = github.trim();
        if (demo !== undefined) project.demo = demo.trim();
        if (technologies) project.technologies = JSON.parse(technologies);

        if (req.file) {
            await deleteFile(project.imageUrl, UPLOAD_DIR);
            const slug = toSlug(project.name);
            const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${project.id}.${ext}`;
            project.imageUrl = await saveFile(req.file.buffer, req.file.mimetype, 'projects', UPLOAD_DIR, filename);
        }

        await project.save();
        res.json(project);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({ id: req.params.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        await deleteFile(project.imageUrl, UPLOAD_DIR);
        await Project.findOneAndDelete({ id: req.params.id });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
