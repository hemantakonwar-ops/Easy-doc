// Global type declarations

export interface Document {
  id: string;
  documentId: string;
  filename: string;
  text: string;
  chunks: string[];
  metadata?: {
    pageCount?: number;
    isScanned?: boolean;
    parsedAt?: string;
  };
}

export interface RiskFlag {
  type: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RiskAnalysis {
  riskScore: number;
  flags: RiskFlag[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources?: string[];
}

export interface SearchResult {
  text: string;
  score: number;
  documentId?: string;
}

export interface UploadResponse {
  documentId: string;
  filename: string;
  chunkCount: number;
  isScanned: boolean;
  message: string;
}

export interface Clause {
  id: string;
  title: string;
  description: string;
  icon: 'confidentiality' | 'obligations' | 'term' | 'governing';
  clauseNumber: string;
}
