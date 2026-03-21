import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    eventId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'Participant' },
    registeredAt: { type: Date, default: Date.now }
});

export default mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
