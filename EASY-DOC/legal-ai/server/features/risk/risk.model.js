import mongoose from 'mongoose';

const riskSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  flags: [{
    type: { type: String },
    term: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    context: { type: String },
  }],
  summary: { type: String },
  analyzedAt: { type: Date, default: Date.now },
});

export const Risk = mongoose.model('Risk', riskSchema);
export default Risk;
