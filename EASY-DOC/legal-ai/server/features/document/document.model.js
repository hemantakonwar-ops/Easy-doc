import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  filePath: { type: String, default: '' }, // Path to local PDF file
  text: { type: String, default: '' },
  chunks: [{ type: String }],
  status: { type: String, enum: ['analyzed', 'pending', 'processing'], default: 'pending' },
  riskScore: { type: Number, default: null },
  metadata: {
    pageCount: Number,
    isScanned: Boolean,
    parsedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Document = mongoose.model('Document', documentSchema);
export default Document;
