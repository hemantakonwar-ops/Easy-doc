import { handleUpload } from './upload.service.js';

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await handleUpload(req.file);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default { uploadDocument };
