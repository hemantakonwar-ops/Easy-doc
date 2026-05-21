import api from '../../lib/axiosInstance';

export interface SimplifyResponse {
  original: string;
  simplified: string;
}

export interface Document {
  success: boolean;
  documentId: string;
  filename: string;
  filePath?: string;
  text: string;
  chunks: string[];
  status: string;
  riskScore?: number;
  metadata?: {
    pageCount?: number;
    isScanned?: boolean;
    parsedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const getDocument = async (documentId: string): Promise<Document> => {
  const data = await api.get(`/documents/${documentId}`);
  return (data as unknown) as Document;
};

export const getRecentDocuments = async (limit: number = 10): Promise<any[]> => {
  const data = await api.get(`/documents?limit=${limit}`);
  return (data as unknown) as any[];
};

export const getDocumentPDFUrl = (documentId: string): string => {
  // Return the API endpoint URL for the PDF file
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${baseURL}/documents/${documentId}/file`;
};

export const simplifyDocument = async (text: string): Promise<SimplifyResponse> => {
  const data = await api.post('/simplify', { text });
  return (data as unknown) as SimplifyResponse;
};
