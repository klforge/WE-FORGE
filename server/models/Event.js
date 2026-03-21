const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: '' },
    points: { type: Number, default: 0 },
    slots: { type: Number, default: 50 },
    registeredCount: { type: Number, default: 0 },
    registrationDeadline: { type: Date },
    eventDate: { type: Date, required: true },
    venue: { type: String, default: '' },
    status: { type: String, default: 'upcoming' },
    posterUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
