const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    eventId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    email: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);
