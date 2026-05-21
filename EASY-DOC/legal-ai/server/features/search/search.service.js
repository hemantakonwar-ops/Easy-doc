import { callSearch } from '../../core/services/pythonClient.js';

export const searchDocuments = async (query, documentId) => {
  const result = await callSearch(query, documentId);
  
  return {
    success: true,
    results: result.results || [],
    query: result.query,
  };
};

export default { searchDocuments };
