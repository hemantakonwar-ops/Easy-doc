import { searchDocuments } from './search.service.js';

export const search = async (req, res, next) => {
  try {
    const { query, documentId } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const result = await searchDocuments(query, documentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default { search };
