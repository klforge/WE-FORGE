import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Legacy ID for smooth frontend compat
    name: { type: String, required: true },
    description: { type: String, default: '' },
    github: { type: String, default: '' },
    demo: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    imageUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
