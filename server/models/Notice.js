const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notice', noticeSchema);
