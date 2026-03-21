const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    domain: { type: String, default: '' },
    rollNumber: { type: String, required: true },
    department: { type: String, default: '' },
    email: { type: String, default: '' },
    description: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    telegram: { type: String, default: '' },
    status: { type: String, default: 'Online' },
    photoUrl: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Member', memberSchema);
