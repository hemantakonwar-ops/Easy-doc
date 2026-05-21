import { Document } from './document.model.js';

export const getDocument = async (documentId) => {
  const document = await Document.findOne({ documentId });
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  return {
    success: true,
    documentId: document.documentId,
    filename: document.filename,
    text: document.text,
    chunks: document.chunks,
    status: document.status,
    riskScore: document.riskScore,
    metadata: document.metadata,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

export default { getDocument };
