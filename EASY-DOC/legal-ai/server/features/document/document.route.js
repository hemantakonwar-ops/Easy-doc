import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDocument } from './document.service.js';
import { Document } from './document.model.js';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Public routes with optional auth
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'createdAt:desc';
    const [sortField, sortOrder] = sort.split(':');
    
    const documents = await Document.find()
      .sort({ [sortField]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit);
    
    const formattedDocs = documents.map(doc => ({
      id: doc.documentId,
      name: doc.filename,
      date: doc.createdAt,
      status: doc.status || 'Pending',
      risk: doc.riskScore
    }));
    
    res.json(formattedDocs);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const analyzedThisMonth = await Document.countDocuments({
      status: 'analyzed',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const pendingReview = await Document.countDocuments({ status: 'pending' });
    
    const avgRiskResult = await Document.aggregate([
      { $match: { riskScore: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } }
    ]);
    const averageRiskScore = Math.round(avgRiskResult[0]?.avgRisk || 0);

    res.json({
      totalDocuments,
      analyzedThisMonth,
      averageRiskScore,
      pendingReview
    });
  } catch (error) {
    next(error);
  }
});

// Protected routes - require authentication
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getDocument(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Serve PDF file - protected route
router.get('/:id/file', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findOne({ documentId: id });
    
    if (!doc || !doc.filePath) {
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    // Check if file exists
    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }
    
    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;
