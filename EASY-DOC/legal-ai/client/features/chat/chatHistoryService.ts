import api from '../../lib/axiosInstance';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  documentId: string;
  messages: ChatMessage[];
  totalMessages: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get chat history for a document
 */
export const getChatHistory = async (documentId: string): Promise<ChatHistory> => {
  const data = await api.get(`/chat-history/${documentId}`);
  return (data as unknown) as ChatHistory;
};

/**
 * Add a message to chat history
 */
export const addChatMessage = async (
  documentId: string, 
  role: 'user' | 'assistant', 
  content: string
): Promise<ChatHistory> => {
  const data = await api.post(`/chat-history/${documentId}`, { role, content });
  return (data as unknown) as ChatHistory;
};

/**
 * Clear chat history for a document
 */
export const clearChatHistory = async (documentId: string): Promise<{ success: boolean; message: string }> => {
  const data = await api.delete(`/chat-history/${documentId}`);
  return (data as unknown) as { success: boolean; message: string };
};
