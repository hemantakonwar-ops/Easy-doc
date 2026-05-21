import express from 'express';
import { callAnalyzeLaws } from '../../core/services/pythonClient.js';
import { Document } from '../document/document.model.js';

const router = express.Router();

// In-memory cache for law analysis results (TTL: 1 hour)
const lawCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Extract relevant laws from a document
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { documentId, text, jurisdiction } = req.body;
    
    console.log(`[Laws API] Request received for document: ${documentId || 'text-only'}`);

    if (!documentId && !text) {
      console.log('[Laws API] Rejected: No documentId or text provided');
      return res.status(400).json({ 
        error: 'Either documentId or text is required',
        success: false,
        laws: []
      });
    }

    let documentText = text;

    // Fetch text from DB if not provided
    if (!documentText && documentId) {
      console.log(`[Laws API] Fetching document ${documentId} from database`);
      const doc = await Document.findOne({ documentId });
      
      if (!doc) {
        console.log(`[Laws API] Document ${documentId} not found`);
        return res.status(404).json({ 
          error: 'Document not found',
          success: false,
          laws: []
        });
      }
      
      if (!doc.text || doc.text.trim().length === 0) {
        console.log(`[Laws API] Document ${documentId} has no text content`);
        return res.status(404).json({ 
          error: 'Document has no text content to analyze',
          success: false,
          laws: []
        });
      }
      
      documentText = doc.text;
      console.log(`[Laws API] Retrieved text from DB: ${documentText.length} characters`);
    }

    // Check cache
    const cacheKey = `${documentId || 'text'}-${jurisdiction || 'India'}-${documentText.slice(0, 100)}`;
    const cached = lawCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[Laws API] Cache hit for ${documentId}`);
      return res.json({
        ...cached.data,
        cached: true
      });
    }

    // Truncate very long text to avoid timeouts
    const MAX_TEXT_LENGTH = 10000;
    const textToAnalyze = documentText.length > MAX_TEXT_LENGTH 
      ? documentText.slice(0, MAX_TEXT_LENGTH) + '... [truncated]'
      : documentText;

    console.log(`[Laws API] Calling Python NLP service for law analysis`);
    
    const result = await callAnalyzeLaws(
      documentId || 'unknown', 
      textToAnalyze, 
      jurisdiction || 'India'
    );
    
    // Store in cache
    lawCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Laws API] Analysis complete in ${duration}ms. Found ${result.laws?.length || 0} laws`);
    
    res.json(result);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Laws API] Error after ${duration}ms:`, error.message);
    
    // Provide specific error messages
    let errorMessage = 'Failed to analyze laws';
    let statusCode = 500;
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'NLP service unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = 'Analysis timed out. The document may be too large.';
      statusCode = 504;
    } else if (error.response?.status === 404) {
      errorMessage = 'Document not found in NLP service';
      statusCode = 404;
    }
    
    // Always return 200 with error info in body so frontend gets proper response structure
    res.json({ 
      success: false,
      laws: [],
      document_id: req.body.documentId || 'unknown',
      source: 'error',
      error: errorMessage
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'laws-api',
    cache_size: lawCache.size,
    timestamp: new Date().toISOString()
  });
});

export default router;
