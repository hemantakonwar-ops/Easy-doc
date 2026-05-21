// Feature flags configuration
export interface FeatureFlags {
  chatbot: boolean;
  riskAnalysis: boolean;
  documentSummary: boolean;
  clauseExtraction: boolean;
  pdfExport: boolean;
  shareReport: boolean;
  uploadDocument: boolean;
  notifications: boolean;
  compareDocuments: boolean;
  savedQueries: boolean;
  templates: boolean;
  aiAssistant: boolean;
}

// Default feature flags - all enabled by default
export const defaultFeatures: FeatureFlags = {
  chatbot: true,
  riskAnalysis: true,
  documentSummary: true,
  clauseExtraction: true,
  pdfExport: true,
  shareReport: true,
  uploadDocument: true,
  notifications: true,
  compareDocuments: true,
  savedQueries: true,
  templates: true,
  aiAssistant: true,
};

// Feature descriptions for the settings page
export const featureDescriptions: Record<keyof FeatureFlags, { label: string; description: string; icon: string }> = {
  chatbot: {
    label: 'AI Legal Assistant Chat',
    description: 'Enable chat functionality to ask questions about documents',
    icon: 'MessageSquare',
  },
  riskAnalysis: {
    label: 'Risk Analysis',
    description: 'Show risk scores and flags for uploaded documents',
    icon: 'ShieldAlert',
  },
  documentSummary: {
    label: 'AI Document Summary',
    description: 'Generate AI summaries of legal documents',
    icon: 'FileText',
  },
  clauseExtraction: {
    label: 'Key Clause Extraction',
    description: 'Automatically extract and highlight important clauses',
    icon: 'Scissors',
  },
  pdfExport: {
    label: 'Export to PDF',
    description: 'Allow exporting analysis reports as PDF files',
    icon: 'Download',
  },
  shareReport: {
    label: 'Share Reports',
    description: 'Share document analysis reports with others',
    icon: 'Share2',
  },
  uploadDocument: {
    label: 'Document Upload',
    description: 'Enable uploading new documents for analysis',
    icon: 'Upload',
  },
  notifications: {
    label: 'Notifications',
    description: 'Show notification alerts and bell icon',
    icon: 'Bell',
  },
  compareDocuments: {
    label: 'Compare Documents',
    description: 'Compare multiple documents side by side',
    icon: 'GitCompare',
  },
  savedQueries: {
    label: 'Saved Queries',
    description: 'Save and reuse common search queries',
    icon: 'Bookmark',
  },
  templates: {
    label: 'Document Templates',
    description: 'Access to legal document templates library',
    icon: 'FileStack',
  },
  aiAssistant: {
    label: 'AI Assistant Features',
    description: 'General AI-powered assistance throughout the app',
    icon: 'Bot',
  },
};

// Local storage key
const STORAGE_KEY = 'legalai-features';

// Get features from localStorage or use defaults
export function getFeatures(): FeatureFlags {
  if (typeof window === 'undefined') return defaultFeatures;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultFeatures, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading features:', e);
  }
  return defaultFeatures;
}

// Save features to localStorage
export function saveFeatures(features: FeatureFlags): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
  } catch (e) {
    console.error('Error saving features:', e);
  }
}

// Check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getFeatures()[feature];
}
