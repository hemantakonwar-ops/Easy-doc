'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ActivityBar, BottomPanel, ExplorerPanel, RightPanel } from '../../../components/PanelController';
import RiskPanel from '../../../components/RiskPanel';
import ChatPanel from '../../../components/ChatPanel';
import DocumentSummary from '../../../components/DocumentSummary';
import ClausesPanel from '../../../components/ClausesPanel';
import ApplicableLawsPanel from '../../../components/ApplicableLawsPanel';
import { exportToPDF } from '../../../lib/utils/exportPDF';

import {
  Download,
  Share2,
  FileText,
  Loader2,
  Files,
  ShieldAlert,
  Scissors,
  Terminal,
  Settings,
  X,
  Search,
  Code,
  PanelLeft,
  PanelRight,
  MessageSquare,
  Sparkles,
  LayoutDashboard,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { getDocument, getRecentDocuments, simplifyDocument, Document } from '../../../features/document/documentService';
import { getRiskAnalysis } from '../../../features/risk/riskService';
import { extractClauses } from '../../../features/clause/clauseService';
import { getFeatures, FeatureFlags } from '../../../lib/features';
import { getCurrentUser } from '../../../features/auth/authService';
import { cn } from '../../../lib/utils/cn';

// Sample data - in production, fetch from your API
const sampleClauses = [
  {
    id: '1',
    title: 'Confidentiality',
    description: 'Defines what information is considered confidential.',
    icon: 'confidentiality' as const,
    clauseNumber: '1',
  },
  {
    id: '2',
    title: 'Obligations',
    description: 'Receiving party must maintain confidentiality.',
    icon: 'obligations' as const,
    clauseNumber: '2',
  },
  {
    id: '3',
    title: 'Term',
    description: 'Confidentiality lasts for 3 years from disclosure.',
    icon: 'term' as const,
    clauseNumber: '3',
  },
  {
    id: '4',
    title: 'Governing Law',
    description: 'Agreement governed by the laws of State X.',
    icon: 'governing' as const,
    clauseNumber: '8',
  },
];

const sampleRiskFlags = [
  {
    type: 'liability',
    title: 'Unlimited Liability',
    description: 'The agreement does not limit liability in case of breach.',
    severity: 'high' as const,
  },
  {
    type: 'confidentiality',
    title: 'Broad Confidentiality',
    description: 'The definition of confidential information is too broad and may restrict normal business.',
    severity: 'medium' as const,
  },
  {
    type: 'termination',
    title: 'No Termination Clause',
    description: 'The agreement lacks a clear termination clause for mutual exit.',
    severity: 'medium' as const,
  },
];

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'pdf' | 'original' | 'simplified' | 'clauses' | 'laws' | 'summary'>('pdf');
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [clausesData, setClausesData] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [simplifiedText, setSimplifiedText] = useState<string>('');
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [user, setUser] = useState<any>(null);

  // Panel visibility states
  const [showExplorer, setShowExplorer] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [showClauses, setShowClauses] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [bottomTab, setBottomTab] = useState<'risk' | 'actions' | 'clauses'>('risk');
  const [errors, setErrors] = useState<string[]>([]);

  // NEW: Document view modes and search state - MOVED HERE to fix hooks error
  const [viewMode, setViewMode] = useState<'pdf' | 'parsed'>('pdf');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedRanges, setHighlightedRanges] = useState<Array<{start: number, end: number}>>([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setFeatures(getFeatures());
  }, [router]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('legal-ai-workbench-layout') : null;
    if (!saved) {
      setShowChat(true);
      setShowRisk(true);
      setShowClauses(true);
      setShowSummary(true);
      setShowBottomPanel(true);
      return;
    }

    try {
      const layout = JSON.parse(saved);
      setShowExplorer(layout.showExplorer ?? true);
      setShowChat(layout.showChat ?? true);
      setShowRisk(layout.showRisk ?? true);
      setShowClauses(layout.showClauses ?? true);
      setShowSummary(layout.showSummary ?? true);
      setShowBottomPanel(layout.showBottomPanel ?? true);
      setBottomTab(layout.bottomTab ?? 'risk');
    } catch {
      localStorage.removeItem('legal-ai-workbench-layout');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      'legal-ai-workbench-layout',
      JSON.stringify({ showExplorer, showChat, showRisk, showClauses, showSummary, showBottomPanel, bottomTab })
    );
  }, [showExplorer, showChat, showRisk, showClauses, showSummary, showBottomPanel, bottomTab]);

  // Load view mode preference from local storage
  useEffect(() => {
    const savedViewMode = typeof window !== 'undefined' ? localStorage.getItem('legal-ai-document-view-mode') : null;
    if (savedViewMode === 'pdf' || savedViewMode === 'parsed') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('legal-ai-document-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!user || !documentId) return;
    
    const fetchData = async () => {
      try {
        const [doc, risk, clauses, recentDocs] = await Promise.all([
          getDocument(documentId),
          getRiskAnalysis(documentId),
          extractClauses(documentId).catch(() => []),
          getRecentDocuments(5).catch(() => []),
        ]);
        setDocumentData(doc);
        setRiskData(risk);
        setClausesData(Array.isArray(clauses) ? clauses : []);
        setRecentDocuments(Array.isArray(recentDocs) ? recentDocs : []);
        
        // Fetch simplified text when switching to simplified tab
        if (doc?.text) {
          const simplified = await simplifyDocument(doc.text);
          setSimplifiedText(simplified.simplified);
        }
      } catch (error) {
        console.error('Error fetching document data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId, user]);

  // Fetch PDF blob securely via API
  useEffect(() => {
    if (activeTab === 'pdf' && documentId && !pdfBlobUrl) {
      import('../../../lib/axiosInstance').then(({ default: api }) => {
        api.get(`/documents/${documentId}/file`, { responseType: 'blob' })
          .then((response: any) => {
            const url = URL.createObjectURL(response);
            setPdfBlobUrl(url);
          })
          .catch(err => console.error('Error loading PDF:', err));
      });
    }
  }, [activeTab, documentData?.filePath, documentId, pdfBlobUrl]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  if (!user || !features) return null;

  // Feature flags
  const chatbotEnabled = features?.chatbot ?? true;
  const riskAnalysisEnabled = features?.riskAnalysis ?? true;
  const documentSummaryEnabled = features?.documentSummary ?? true;
  const clauseExtractionEnabled = features?.clauseExtraction ?? true;
  const pdfExportEnabled = features?.pdfExport ?? true;
  const shareReportEnabled = features?.shareReport ?? true;

  const handleExportPDF = () => {
    exportToPDF({
      documentName: documentData?.filename || 'Document.pdf',
      summary: riskData?.summary || 'Summary not available',
      riskScore: riskData?.riskScore || 0,
      riskFlags: riskData?.flags || sampleRiskFlags,
      clauses: clausesData.length > 0 ? clausesData.map((c: any) => ({ title: c.title, description: c.description })) : sampleClauses.map(c => ({ title: c.title, description: c.description })),
    });
  };

  // NEW: Search and highlight function with lime green
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !documentData?.text) {
      setHighlightedRanges([]);
      return;
    }

    // Find all occurrences (case-insensitive)
    const text = documentData.text.toLowerCase();
    const searchLower = query.toLowerCase();
    const ranges: Array<{start: number, end: number}> = [];
    let index = text.indexOf(searchLower);

    while (index !== -1) {
      ranges.push({ start: index, end: index + query.length });
      index = text.indexOf(searchLower, index + 1);
    }

    setHighlightedRanges(ranges);
  };

  const renderHighlightedText = (text: string, lineIndex: number) => {
    if (!searchQuery || highlightedRanges.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    // Calculate offset of this line in the full text
    const lineStartOffset = textLines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
    const elements: React.ReactNode[] = [];
    const lineEndOffset = lineStartOffset + text.length;
    let lastEnd = 0;

    // Filter ranges that intersect with this line
    const lineRanges = highlightedRanges.filter(r =>
      r.start < lineEndOffset && r.end > lineStartOffset
    );

    if (lineRanges.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    lineRanges.forEach((range, i) => {
      const relStart = Math.max(0, range.start - lineStartOffset);
      const relEnd = Math.min(text.length, range.end - lineStartOffset);

      // Add text before highlight
      if (relStart > lastEnd) {
        elements.push(
          <span key={`text-${i}`} className="whitespace-pre-wrap">
            {text.slice(lastEnd, relStart)}
          </span>
        );
      }
      // Add highlighted text in LIME GREEN
      elements.push(
        <span
          key={`highlight-${i}`}
          className="bg-[var(--search-highlight)] text-black font-semibold px-0.5"
        >
          {text.slice(relStart, relEnd)}
        </span>
      );
      lastEnd = relEnd;
    });

    // Add remaining text
    if (lastEnd < text.length) {
      elements.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {text.slice(lastEnd)}
        </span>
      );
    }

    return <>{elements}</>;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--vscode-bg)]">
        <div className="flex items-center gap-3 text-[var(--vscode-text)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--vscode-accent)]" />
          <span className="font-medium">Loading document analysis...</span>
        </div>
      </div>
    );
  }

  const fileName = documentData?.filename || 'Non-Disclosure Agreement.pdf';
  const currentText = activeTab === 'simplified'
    ? simplifiedText || 'Simplified text not available'
    : documentData?.text || 'No document text available';
  const textLines = currentText.split('\n');
  const riskFlags = (riskData?.flags && riskData.flags.length > 0) ? riskData.flags : sampleRiskFlags;
  
  // Map backend clauses to frontend expected format, or use empty array
  const clauseList = clausesData.map(c => ({
    ...c,
    id: c.id || String(Math.random()),
    title: c.title || (c.type ? c.type.charAt(0).toUpperCase() + c.type.slice(1).replace('_', ' ') : 'Clause'),
    description: c.description || c.text || 'No description available',
    type: c.type || 'default'
  }));
  
  const totalWords = documentData?.text?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#2d2d2d] bg-[#181818] px-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden text-xs text-[#858585] sm:inline">LegalAI Workbench</span>
            <span className="hidden text-xs text-[#858585] md:inline">/</span>
            <span className="truncate text-xs text-[#cccccc]">{fileName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowExplorer(!showExplorer)} className="p-2 hover:bg-[#2a2d2e]" title="Toggle Explorer">
              <PanelLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setShowBottomPanel(!showBottomPanel)} className="p-2 hover:bg-[#2a2d2e]" title="Toggle Bottom Panel">
              <Terminal className="h-4 w-4" />
            </button>
            <button onClick={() => setShowChat(!showChat)} className="p-2 hover:bg-[#2a2d2e]" title="Toggle Chat">
              <PanelRight className="h-4 w-4" />
            </button>
            <button onClick={handleExportPDF} className="hidden items-center gap-2 bg-[#0e639c] px-3 py-1.5 text-xs text-white hover:bg-[#1177bb] sm:flex">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[#2d2d2d] bg-[#181818] py-2">
            {/* Dashboard Link - Top */}
            <Link href="/" className="mb-1 flex h-10 w-10 items-center justify-center border-l-2 border-transparent text-[#858585] hover:bg-[#2a2d2e] hover:text-white" title="Dashboard">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
            
            <div className="w-full h-px bg-[#2d2d2d] my-1" />
            
            {[
              { icon: Files, label: 'Explorer', action: () => setShowExplorer(!showExplorer), active: showExplorer },
              { icon: ShieldAlert, label: 'Risk', action: () => { setShowBottomPanel(true); setBottomTab('risk'); }, active: showBottomPanel && bottomTab === 'risk' },
              { icon: MessageSquare, label: 'Chat', action: () => setShowChat(!showChat), active: showChat },
            ].map((item) => {
              const Icon = item.icon;
              const itemClassName = `mb-1 flex h-10 w-10 items-center justify-center border-l-2 ${
                item.active ? 'border-white bg-[#2a2d2e] text-white' : 'border-transparent text-[#858585] hover:bg-[#2a2d2e] hover:text-white'
              }`;
              return (
                <button key={item.label} onClick={item.action} className={itemClassName} title={item.label}>
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
            <Link href="/settings" className="mt-auto flex h-10 w-10 items-center justify-center text-[#858585] hover:bg-[#2a2d2e] hover:text-white" title="Settings">
              <Settings className="h-5 w-5" />
            </Link>
          </aside>

          {showExplorer && (
            <aside className="hidden w-64 shrink-0 flex-col border-r border-[#2d2d2d] bg-[#252526] md:flex">
              <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d] px-3 text-[11px] uppercase tracking-wide text-[#cccccc]">
                Explorer
                <button onClick={() => setShowExplorer(false)} className="hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 overflow-auto p-3 text-sm">
                <div>
                  <p className="mb-2 text-[11px] uppercase text-[#858585]">Open Document</p>
                  <button onClick={() => setActiveTab('original')} className="flex w-full items-center gap-2 bg-[#37373d] px-2 py-1.5 text-left text-[#f3f3f3]">
                    <FileText className="h-4 w-4 text-[#c586c0]" />
                    <span className="truncate">{fileName}</span>
                  </button>
                </div>
                <div className="border-t border-[#3c3c3c] pt-3 text-xs text-[#858585]">
                  <p>Pages: {documentData?.metadata?.pageCount || 0}</p>
                  <p>Words: {totalWords.toLocaleString()}</p>
                  <p>Risk: {riskData?.riskScore ?? 0}/100</p>
                </div>
                
                {/* Recent Documents */}
                <div className="mt-6 border-t border-[#3c3c3c] pt-4">
                  <p className="mb-2 text-[11px] uppercase text-[#858585]">Recent Analysis</p>
                  <div className="space-y-1">
                    {recentDocuments.length > 0 ? (
                      recentDocuments.map((doc) => (
                        <Link 
                          key={doc.id} 
                          href={`/document/${doc.id}`}
                          className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
                            doc.id === documentId 
                              ? 'bg-[#37373d] text-[#f3f3f3]' 
                              : 'text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white'
                          }`}
                        >
                          <FileText className="h-4 w-4 shrink-0 text-[#c586c0]" />
                          <span className="truncate text-xs">{doc.name || doc.filename || 'Untitled Document'}</span>
                        </Link>
                      ))
                    ) : (
                      <p className="px-2 text-xs text-[#858585]">No recent analysis.</p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          )}

          <main className="flex min-w-0 flex-1 flex-col">
            {/* Tab Bar with PDF View and Search */}
            <div className="flex h-9 shrink-0 border-b border-[#2d2d2d] bg-[#252526]">
              {/* Left: Tabs */}
              <div className="flex overflow-x-auto">
                {[
                  { id: 'pdf', label: 'PDF View', enabled: true },
                  { id: 'original', label: 'Parsed Text', enabled: true },
                  { id: 'simplified', label: 'Simplified', enabled: true },
                  { id: 'clauses', label: 'Clauses', enabled: clauseExtractionEnabled },
                  { id: 'laws', label: 'Laws', enabled: true },
                  { id: 'summary', label: 'Summary', enabled: documentSummaryEnabled },
                ].filter(tab => tab.enabled).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex min-w-[100px] items-center gap-2 border-r border-[#2d2d2d] px-3 text-left text-xs ${
                      activeTab === tab.id ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-[#cccccc] hover:bg-[#333333]'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#c586c0]" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Right: Search Box */}
              {(activeTab === 'original' || activeTab === 'simplified') && (
                <div className="flex items-center gap-2 px-3 ml-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#858585]" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-40 bg-[#3c3c3c] border border-[#2d2d2d] text-white text-xs pl-7 pr-2 py-1 focus:outline-none focus:border-[#0e639c]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearch('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-[#858585] hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {highlightedRanges.length > 0 && (
                    <span className="text-xs text-[#858585]">
                      {highlightedRanges.length} matches
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[#1e1e1e]">
              {/* PDF Viewer */}
              {activeTab === 'pdf' && (
                <div className="h-full w-full">
                  {pdfBlobUrl ? (
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-full border-0 bg-white"
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#858585]" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Text View with Search Highlighting */}
              {(activeTab === 'original' || activeTab === 'simplified') && (
                <div className="min-w-full py-4 font-mono text-sm leading-6">
                  {textLines.map((line, index) => (
                    <div key={`${index}-${line.slice(0, 8)}`} className="grid grid-cols-[4rem_minmax(0,1fr)] px-2 hover:bg-[#2a2d2e]">
                      <span className="select-none pr-4 text-right text-[#858585]">{index + 1}</span>
                      <span className="whitespace-pre-wrap pr-6 text-[#d4d4d4]">
                        {renderHighlightedText(line, index)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'clauses' && (
                <div className="p-4">
                  <ClausesPanel clauses={clauseList} />
                </div>
              )}
              {activeTab === 'laws' && (
                <div className="p-4">
                  <ApplicableLawsPanel documentId={documentId} documentText={documentData?.text} />
                </div>
              )}
              {activeTab === 'summary' && (
                <div className="p-4">
                  <DocumentSummary
                    summary={riskData?.summary || 'Summary not available'}
                    totalPages={documentData?.metadata?.pageCount || 0}
                    totalWords={totalWords}
                    analyzedAt={new Date(documentData?.createdAt || Date.now()).toLocaleDateString()}
                  />
                </div>
              )}
            </div>

            {showBottomPanel && (
              <section className="h-56 shrink-0 border-t border-[#2d2d2d] bg-[#181818] md:h-64">
                <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d]">
                  <div className="flex h-full">
                    {[
                      { id: 'risk', label: 'Risks', icon: ShieldAlert },
                      { id: 'actions', label: 'Downloads', icon: Download },
                      { id: 'clauses', label: 'Clauses', icon: Sparkles },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setBottomTab(tab.id as any)}
                          className={`flex items-center gap-2 border-r border-[#2d2d2d] px-3 text-xs ${
                            bottomTab === tab.id ? 'bg-[#1e1e1e] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setShowBottomPanel(false)} className="px-3 text-[#858585] hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-[calc(100%-2.25rem)] overflow-auto p-3">
                  {bottomTab === 'risk' && (
                    <div className="grid gap-3 md:grid-cols-3">
                      {riskFlags.map((flag: any, index: number) => (
                        <div key={index} className="border border-[#3c3c3c] bg-[#1e1e1e] p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#f3f3f3]">{flag.title}</p>
                            <span className="text-[10px] uppercase text-[#f48771]">{flag.severity}</span>
                          </div>
                          <p className="text-xs leading-5 text-[#cccccc]">{flag.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {bottomTab === 'actions' && (
                    <div className="flex flex-wrap gap-3">
                      {pdfExportEnabled && (
                        <>
                          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[#0e639c] px-4 py-2 text-sm text-white hover:bg-[#1177bb]">
                            <Download className="h-4 w-4" />
                            Download Report
                          </button>
                          <button onClick={handleExportPDF} className="flex items-center gap-2 border border-[#3c3c3c] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#2a2d2e]">
                            <FileText className="h-4 w-4" />
                            Export as PDF
                          </button>
                        </>
                      )}
                      {shareReportEnabled && (
                        <button className="flex items-center gap-2 border border-[#3c3c3c] px-4 py-2 text-sm text-[#cccccc] hover:bg-[#2a2d2e]">
                          <Share2 className="h-4 w-4" />
                          Share Report
                        </button>
                      )}
                    </div>
                  )}
                  {bottomTab === 'clauses' && <ClausesPanel clauses={clauseList} />}
                </div>
              </section>
            )}
          </main>

          {chatbotEnabled && showChat && (
            <aside className="hidden w-[360px] shrink-0 border-l border-[#2d2d2d] bg-[#252526] xl:block">
              <div className="flex h-9 items-center justify-between border-b border-[#2d2d2d] px-3 text-xs uppercase tracking-wide text-[#cccccc]">
                AI Chat
                <button onClick={() => setShowChat(false)} className="hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-2.25rem)] p-3">
                <ChatPanel documentId={documentId} className="h-full border-[#3c3c3c] bg-[#1e1e1e]" />
              </div>
            </aside>
          )}
        </div>

        {chatbotEnabled && showChat && (
          <div className="border-t border-[#2d2d2d] bg-[#252526] p-2 xl:hidden">
            <ChatPanel documentId={documentId} className="h-80 border-[#3c3c3c] bg-[#1e1e1e]" />
          </div>
        )}

        <div className="flex h-6 shrink-0 items-center justify-between bg-[#007acc] px-3 text-[11px] text-white">
          <span className="truncate">{fileName}</span>
          <span className="shrink-0">{totalWords.toLocaleString()} words · Risk {riskData?.riskScore ?? 0}/100</span>
        </div>
      </div>
    </div>
  );
}
