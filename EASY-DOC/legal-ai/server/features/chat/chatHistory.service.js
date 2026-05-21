import { ChatHistory } from './chatHistory.model.js';

/**
 * Get chat history for a document
 */
export const getChatHistory = async (documentId) => {
  const history = await ChatHistory.findOne({ documentId });
  
  if (!history) {
    return {
      documentId,
      messages: [],
      totalMessages: 0
    };
  }
  
  return {
    documentId: history.documentId,
    messages: history.messages,
    totalMessages: history.messages.length,
    createdAt: history.createdAt,
    updatedAt: history.updatedAt
  };
};

/**
 * Add a message to chat history
 */
export const addChatMessage = async (documentId, role, content) => {
  let history = await ChatHistory.findOne({ documentId });
  
  if (!history) {
    history = new ChatHistory({
      documentId,
      messages: []
    });
  }
  
  history.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  
  await history.save();
  
  return {
    documentId: history.documentId,
    messages: history.messages,
    totalMessages: history.messages.length
  };
};

/**
 * Clear chat history for a document
 */
export const clearChatHistory = async (documentId) => {
  await ChatHistory.deleteOne({ documentId });
  return { success: true, message: 'Chat history cleared' };
};

export default { getChatHistory, addChatMessage, clearChatHistory };
