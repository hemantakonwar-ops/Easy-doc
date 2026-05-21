import axios from 'axios';
import { config } from '../config/env.js';

const pythonApi = axios.create({
  baseURL: config.fastApiUrl,
  timeout: 15000, // 15s - unified timeout; long ops use async
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and FormData handling
pythonApi.interceptors.request.use(
  (config) => {
    console.log(`[Python API] ${config.method.toUpperCase()} ${config.url}`);
    
    // Remove Content-Type for FormData to let axios set proper boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
pythonApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Python API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Retry wrapper for resilient API calls
const withRetry = async (fn, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`[Python API] Retry ${attempt}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
};

export const callParser = async (fileBuffer, filename) => {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename);
    
    // Don't set Content-Type - let axios set it with proper boundary
    try {
      const response = await pythonApi.post('/parse/', formData, {
        timeout: 300000, // 5 minutes - parsing can take a long time for large PDFs
      });
      return response.data;
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
      throw new Error(`Parser failed: ${detail}`);
    }
  });
};

export const callChat = async (query, documentId) => {
  return withRetry(async () => {
    const response = await pythonApi.post('/chat/', {
      query,
      document_id: documentId,
    });
    return response.data;
  });
};

export const callRisk = async (documentId) => {
  return withRetry(async () => {
    const response = await pythonApi.post('/risk/', {
      document_id: documentId,
    });
    return response.data;
  });
};

export const callSimplify = async (text) => {
  try {
    return await withRetry(async () => {
      const response = await pythonApi.post('/simplify/', {
        text,
      });
      return response.data;
    });
  } catch (error) {
    // Log detailed error info
    if (error.response?.status === 422) {
      console.error('[Python API] 422 Validation Error:', error.response?.data);
      console.error('[Python API] Request body was:', { text: text?.substring(0, 100) + '...' });
    }
    
    // Return fallback simplified text (first 500 chars)
    console.warn('[Python API] Simplify failed, returning fallback');
    return {
      simplified: text?.substring(0, 1000) || 'Unable to simplify document. The AI service is temporarily unavailable.',
      original_length: text?.length || 0,
      simplified_length: Math.min(text?.length || 0, 1000),
      fallback: true
    };
  }
};

export const callSearch = async (query, documentId) => {
  return withRetry(async () => {
    const response = await pythonApi.post('/search/', {
      query,
      document_id: documentId,
    });
    return response.data;
  });
};

export const callClause = async (documentId, clauseTypes) => {
  return withRetry(async () => {
    const response = await pythonApi.post('/clause/', {
      document_id: documentId,
      clause_types: clauseTypes,
    });
    return response.data;
  });
};

export const callAsyncParser = async (fileBuffer, filename) => {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename);
    const response = await pythonApi.post('/parse/upload-pdf', formData);
    return response.data;
  });
};

export const callParseStatus = async (jobId) => {
  return withRetry(async () => {
    const response = await pythonApi.get(`/parse/status/${jobId}`);
    return response.data;
  });
};

export const callAnalyzeLaws = async (documentId, text, jurisdiction = null) => {
  return withRetry(async () => {
    // Use longer timeout for law analysis (30s) since it involves LLM calls
    const response = await pythonApi.post('/laws/analyze', {
      document_id: documentId,
      text,
      jurisdiction
    }, {
      timeout: 30000 // 30 seconds for law analysis
    });
    return response.data;
  }, 2); // 2 retries
};

export default pythonApi;
