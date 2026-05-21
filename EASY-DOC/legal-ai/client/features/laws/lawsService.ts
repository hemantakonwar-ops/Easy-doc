import api from '../../lib/axiosInstance';

export interface LawReference {
  law_name: string;
  section?: string;
  article?: string;
  context: string;
  link: string;
  importance: 'high' | 'medium' | 'low';
  category: 'statute' | 'regulation' | 'case_law' | 'constitutional';
  relevance_score?: number;
}

interface LawsApiResponse {
  success: boolean;
  laws: LawReference[];
  document_id: string;
  generated_at: string;
  cached: boolean;
  source: string;
  error?: string;
}

export const analyzeLaws = async (documentId: string, text?: string, jurisdiction?: string): Promise<LawReference[]> => {
  try {
    console.log('[LawsService] Starting law analysis for document:', documentId);
    
    const data = await api.post('/laws/analyze', {
      documentId,
      text,
      jurisdiction
    }, {
      timeout: 40000 // 40 seconds
    }) as LawsApiResponse;
    
    console.log('[LawsService] Response data:', data);
    
    // Handle case where data is undefined/null
    if (!data) {
      console.error('[LawsService] No data received from server');
      throw new Error('No response from server');
    }
    
    // Check if response has the expected structure
    if (data.laws === undefined) {
      console.error('[LawsService] Invalid response structure - no laws field:', data);
      throw new Error(data.error || 'Invalid response structure from server');
    }
    
    console.log('[LawsService] Successfully received laws:', data.laws.length);
    return data.laws || [];
  } catch (error: any) {
    console.error('[LawsService] Error analyzing laws:', error);
    
    // If it's an axios error with response data, extract the error message
    if (error.response?.data) {
      const serverError = error.response.data.error || error.response.data.message || 'Server error';
      throw new Error(serverError);
    }
    
    // Provide more specific error information
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The law analysis is taking too long.');
    }
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      throw new Error('Cannot connect to server. Please check if the server is running.');
    }
    
    throw error;
  }
};
