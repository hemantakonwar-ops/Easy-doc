import { getRisk } from './risk.service.js';

export const getRiskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getRisk(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default { getRiskById };
