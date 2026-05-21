import { callRisk } from '../../core/services/pythonClient.js';

export const getRisk = async (documentId) => {
  const result = await callRisk(documentId);
  
  return {
    success: true,
    documentId,
    riskScore: result.risk_score,
    flags: result.flags || [],
    summary: result.summary,
  };
};
