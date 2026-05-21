import { simplifyText } from './simplify.service.js';

export const simplify = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const result = await simplifyText(text);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default { simplify };
