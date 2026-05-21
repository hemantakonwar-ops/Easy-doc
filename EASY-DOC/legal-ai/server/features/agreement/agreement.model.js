import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  text: { type: String, default: '' },
  source: { type: String, enum: ['ai', 'manual'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const agreementSchema = new mongoose.Schema({
  agreementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  templateUrl: { type: String, default: '' }, // path to the original uploaded template
  pdfUrl: { type: String, default: '' }, // path to the generated/injected PDF
  parsedContent: { type: String, default: '' }, // extracted text from PDF for AI context
  versions: [versionSchema],
  currentVersion: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'approved', 'injected'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Agreement = mongoose.model('Agreement', agreementSchema);
export default Agreement;
