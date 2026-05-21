import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  parsedData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const Upload = mongoose.model('Upload', uploadSchema);
export default Upload;
