import express from 'express';
import { getRisk } from './risk.service.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getRisk(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
