import express from 'express';
import { handleUpload } from './upload.service.js';
import { authenticateToken } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../core/middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, uploadMiddleware.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('Upload request received:', req.file.originalname, req.file.mimetype, req.file.size);
    console.log('File saved to:', req.file.path);
    
    const result = await handleUpload(req.file);
    res.json(result);
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
