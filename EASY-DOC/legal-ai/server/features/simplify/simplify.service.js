import { callSimplify } from '../../core/services/pythonClient.js';

export const simplifyText = async (text) => {
  const result = await callSimplify(text);
  
  return {
    success: true,
    original: text,
    simplified: result.simplified,
  };
};
