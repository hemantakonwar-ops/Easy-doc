import fs from 'fs';
import { callParser } from '../../core/services/pythonClient.js';
import { Upload } from './upload.model.js';
import { Document } from '../document/document.model.js';

export const handleUpload = async (file) => {
  try {
    // Read file from disk for parsing (since we now use disk storage)
    const fileBuffer = fs.readFileSync(file.path);
    
    // Forward to FastAPI for parsing
    const parseResult = await callParser(fileBuffer, file.originalname);
    
    console.log('Parse result from Python:', parseResult);
    
    if (!parseResult || !parseResult.document_id) {
      throw new Error('Failed to parse document - no document_id returned');
    }
    
    const documentId = parseResult.document_id;
    
    // Check if document already exists (prevent duplicates)
    const existingDoc = await Document.findOne({ documentId });
    if (existingDoc) {
      console.log(`Document ${documentId} already exists, returning existing`);
      return {
        success: true,
        documentId: documentId,
        filename: file.originalname,
        filePath: file.path,
        chunkCount: parseResult.chunk_count || 0,
        documentType: parseResult.document_type || 'unknown',
        message: 'Document already processed'
      };
    }
    
    // Store upload record with file path
    await Upload.create({
      documentId: documentId,
      filename: parseResult.filename,
      originalName: file.originalname,
      filePath: file.path, // Store the local file path
      mimeType: file.mimetype,
      size: file.size,
      status: 'completed',
      parsedData: parseResult
    });
    
    // Store document for retrieval with file path
    const doc = await Document.create({
      documentId: documentId,
      filename: parseResult.filename,
      filePath: file.path, // Store the local file path for PDF viewer
      text: parseResult.text || '',
      chunks: parseResult.chunks || [],
      status: 'analyzed',
      metadata: {
        pageCount: parseResult.page_count || parseResult.total_pages || 0,
        isScanned: parseResult.document_type === 'scanned' || parseResult.is_scanned || false,
        parsedAt: new Date()
      }
    });

    // Trigger risk analysis in background for efficiency
    import('../../core/services/pythonClient.js').then(({ callRisk }) => {
      callRisk(documentId).then(riskResult => {
        if (riskResult && riskResult.risk_score !== undefined) {
          doc.riskScore = riskResult.risk_score;
          doc.save();
          console.log(`[Upload] Background risk analysis complete for ${documentId}: ${riskResult.risk_score}`);
        }
      }).catch(err => console.error(`[Upload] Background risk analysis failed for ${documentId}:`, err.message));
    });
    
    return {
      success: true,
      documentId: documentId,
      filename: file.originalname,
      filePath: file.path,
      chunkCount: parseResult.chunk_count || 0,
      documentType: parseResult.document_type || 'unknown',
      message: 'Document uploaded and processed successfully'
    };
    
  } catch (error) {
    console.error('Upload processing error:', error);
    
    // Store failed upload record
    await Upload.create({
      documentId: `failed_${Date.now()}`,
      filename: file.originalname,
      originalName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      status: 'failed',
      parsedData: { error: error.message }
    }).catch(() => {}); // Ignore if DB is down
    
    throw error;
  }
};
