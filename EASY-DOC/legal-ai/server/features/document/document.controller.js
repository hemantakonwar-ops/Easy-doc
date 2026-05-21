import { getDocument } from './document.service.js';

export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getDocument(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default { getDocumentById };
