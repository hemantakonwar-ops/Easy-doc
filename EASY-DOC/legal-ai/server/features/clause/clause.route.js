import express from 'express';
import { callClause } from '../../core/services/pythonClient.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { documentId, clauseTypes } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    
    const result = await callClause(documentId, clauseTypes);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
