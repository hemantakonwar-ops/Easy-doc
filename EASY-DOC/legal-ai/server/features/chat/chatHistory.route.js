import express from 'express';
import { getChatHistory, addChatMessage, clearChatHistory } from './chatHistory.service.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Get chat history for a document
router.get('/:documentId', authenticateToken, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const history = await getChatHistory(documentId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Add a message to chat history
router.post('/:documentId', authenticateToken, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { role, content } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }
    
    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({ error: 'Role must be user or assistant' });
    }
    
    const history = await addChatMessage(documentId, role, content);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Clear chat history
router.delete('/:documentId', authenticateToken, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const result = await clearChatHistory(documentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
