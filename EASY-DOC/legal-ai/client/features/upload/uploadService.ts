import api from '../../lib/axiosInstance';

export interface UploadResponse {
  success: boolean;
  documentId: string;
  filename: string;
  chunkCount?: number;
  documentType?: string;
  message?: string;
}

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  // Don't set Content-Type - let browser set it with proper boundary
  try {
    const response = await api.post('/upload', formData, { timeout: 180000 });
    return response as unknown as UploadResponse;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Upload failed';
    throw new Error(message);
  }
};
