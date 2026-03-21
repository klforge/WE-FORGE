import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnailUrl: { type: String }, // For video previews
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  eventName: { type: String, default: 'General' },
  s3Key: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  uploadedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

mediaSchema.set('toJSON', { virtuals: true });
mediaSchema.set('toObject', { virtuals: true });

export default mongoose.models.Media || mongoose.model('Media', mediaSchema);
