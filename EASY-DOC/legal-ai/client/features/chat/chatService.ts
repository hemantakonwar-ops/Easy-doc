import api from '../../lib/axiosInstance';

export interface ChatResponse {
  answer: string;
  sources: any[];
  query: string;
  documentId?: string;
}

export const sendChatMessage = async (query: string, documentId?: string): Promise<ChatResponse> => {
  const data = await api.post('/chat', {
    query,
    documentId,
  });
  return (data as unknown) as ChatResponse;
};
