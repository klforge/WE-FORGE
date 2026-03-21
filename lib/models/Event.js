import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: '' },
    points: { type: Number, default: 0 },
    slots: { type: Number, default: 50 },
    registeredCount: { type: Number, default: 0 },
    registrationDeadline: { type: Date },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    eventDate: { type: Date, required: true },
    venue: { type: String, default: '' },
    status: { type: String, default: 'upcoming' },
    posterUrl: { type: String, default: '' },
    // Advanced Access
    accessType: { type: String, enum: ['public', 'domain', 'private'], default: 'public' },
    allowedDomains: { type: [String], default: [] },
    allowedMembers: { type: [String], default: [] }, // Roll numbers
    roles: { type: [String], default: ['Participant', 'Volunteer', 'Organizer'] },
    isRegistrationOpen: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
