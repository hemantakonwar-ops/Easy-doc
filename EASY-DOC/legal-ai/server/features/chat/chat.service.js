import { callChat } from '../../core/services/pythonClient.js';

export const handleChat = async (query, documentId) => {
  // Forward to FastAPI RAG service
  const result = await callChat(query, documentId);
  
  return {
    success: true,
    answer: result.answer,
    sources: result.sources || [],
  };
};
