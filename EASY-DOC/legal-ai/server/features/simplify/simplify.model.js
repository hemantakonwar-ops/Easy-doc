import mongoose from 'mongoose';

const simplifySchema = new mongoose.Schema({
  originalText: { type: String, required: true },
  simplifiedText: { type: String, required: true },
  documentId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Simplify = mongoose.model('Simplify', simplifySchema);
export default Simplify;
