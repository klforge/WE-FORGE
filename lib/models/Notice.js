import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Notice || mongoose.model('Notice', noticeSchema);
