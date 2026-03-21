const Notice = require('../models/Notice');

exports.getNotices = async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createNotice = async (req, res) => {
    try {
        const { title, message, priority } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }
        
        const newNotice = new Notice({
            id: String(Date.now()),
            title: title.trim(),
            message: message.trim(),
            priority: priority || 'low',
        });
        
        await newNotice.save();
        res.status(201).json(newNotice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateNotice = async (req, res) => {
    try {
        const { title, message, priority } = req.body;
        const updated = await Notice.findOneAndUpdate(
            { id: req.params.id }, 
            { $set: { 
                ...(title && { title: title.trim() }), 
                ...(message && { message: message.trim() }), 
                ...(priority && { priority }) 
            }},
            { new: true }
        );
        
        if (!updated) return res.status(404).json({ error: 'Notice not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNotice = async (req, res) => {
    try {
        const deleted = await Notice.findOneAndDelete({ id: req.params.id });
        if (!deleted) return res.status(404).json({ error: 'Notice not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
