import { handleChat } from './chat.service.js';

export const chat = async (req, res, next) => {
  try {
    const { query, documentId } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await handleChat(query, documentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default { chat };
