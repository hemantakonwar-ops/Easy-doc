'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Settings, Loader2, Sparkles, X, User, Bot, Send } from 'lucide-react';
import EditableTextEditor from '../../../components/EditableTextEditor';
import ControlBar from '../../../components/ControlBar';
import {
  Agreement,
  getAgreement,
  generateAgreement,
  editAgreement,
  setVersion,
  approveAgreement,
  injectPdf
} from '../../../features/agreement/agreementService';
import { cn } from '../../../lib/utils/cn';

export default function AgreementPage() {
  const params = useParams();
  const router = useRouter();
  const agreementId = params.id as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'What would you like to draft or modify in this agreement?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!agreementId) return;
    getAgreement(agreementId)
      .then(res => setAgreement(res.agreement))
      .catch((err) => {
        console.error(err);
        // Could handle error here
      })
      .finally(() => setLoading(false));
  }, [agreementId]);

  const currentText = agreement?.versions[agreement.currentVersion]?.text || '';
  const canUndo = agreement ? agreement.currentVersion > 0 : false;
  const canRedo = agreement ? agreement.currentVersion < agreement.versions.length - 1 : false;

  const handleSendChat = async () => {
    if (!chatInput.trim() || actionLoading || !agreement) return;

    const input = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setChatInput('');
    setActionLoading(true);

    try {
      const res = await generateAgreement(agreement.agreementId, input, currentText);
      setAgreement(res.agreement);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I have updated the agreement text based on your request.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, failed to generate text.' }]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTextEdit = async (newText: string) => {
    if (!agreement || newText === currentText || agreement.status !== 'draft') return;
    try {
      const res = await editAgreement(agreement.agreementId, newText);
      setAgreement(res.agreement);
    } catch (error) {
      console.error('Failed to save manual edit', error);
    }
  };

  const handleUndo = async () => {
    if (!agreement || !canUndo) return;
    setActionLoading(true);
    try {
      const res = await setVersion(agreement.agreementId, agreement.currentVersion - 1);
      setAgreement(res.agreement);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedo = async () => {
    if (!agreement || !canRedo) return;
    setActionLoading(true);
    try {
      const res = await setVersion(agreement.agreementId, agreement.currentVersion + 1);
      setAgreement(res.agreement);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!agreement) return;
    setActionLoading(true);
    try {
      const res = await approveAgreement(agreement.agreementId);
      setAgreement(res.agreement);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInject = async () => {
    if (!agreement) return;
    setActionLoading(true);
    try {
      const res = await injectPdf(agreement.agreementId);
      setAgreement(res.agreement);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = () => {
    if (!agreement) return;
    // Use API base URL and append the endpoint path
    // The base URL from axiosInstance already includes /api, so we just add the path
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const downloadUrl = `${baseUrl}/agreement/${agreement.agreementId}/download`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--vscode-bg)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--vscode-accent)]" />
      </div>
    );
  }

  if (!agreement) {
    return <div className="p-8 text-white">Agreement not found.</div>;
  }

  // Fetch the PDF file via the new API endpoint
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('localhost', '127.0.0.1');
  const pdfUrl = `${baseUrl}/agreement/${agreement.agreementId}/file`;
  
  // Security: Never use file:// URLs - always use API endpoint
  const safePdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${baseUrl}/agreement/${agreement.agreementId}/file`;

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[#2d2d2d] bg-[#181818] py-2">
        <Link href="/" className="mb-1 flex h-10 w-10 items-center justify-center text-[#858585] hover:bg-[#2a2d2e] hover:text-white">
          <LayoutDashboard className="h-5 w-5" />
        </Link>
        <div className="w-full h-px bg-[#2d2d2d] my-1" />
        <Link href="/settings" className="mt-auto flex h-10 w-10 items-center justify-center text-[#858585] hover:bg-[#2a2d2e] hover:text-white">
          <Settings className="h-5 w-5" />
        </Link>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-[#2d2d2d] bg-[#181818]/80 backdrop-blur-md px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium tracking-tight text-[#e1e1e1]">{agreement.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3c3c3c] uppercase text-[#cccccc] font-bold tracking-wider border border-[#4d4d4d]">
              {agreement.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#858585] uppercase font-bold tracking-widest">
            <Bot className="w-3 h-3" />
            AI-Assisted Drafting Mode
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: PDF Template Preview */}
          <div className="flex-1 border-r border-[#2d2d2d] bg-[#252526] p-4 flex flex-col">
            <h3 className="text-xs uppercase text-[#858585] mb-2 font-semibold">Template Preview</h3>
            <div className="flex-1 bg-white rounded overflow-hidden">
              <iframe
                src={safePdfUrl}
                className="w-full h-full border-0 bg-white"
                title="PDF Template"
                onError={(e) => {
                  console.error('PDF iframe error:', e);
                  (e.target as HTMLIFrameElement).src = 'about:blank';
                }}
              />
            </div>
          </div>

          {/* Right: Chat and Editor */}
          <div className="w-[450px] flex flex-col bg-[#1e1e1e] shrink-0">
            {/* Chat Section */}
            <div className="flex flex-col h-1/2 border-b border-[#2d2d2d]">
              <div className="px-4 py-2.5 border-b border-[#2d2d2d] bg-[#181818]/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#0e639c]/10 flex items-center justify-center rounded">
                    <Sparkles className="w-3.5 h-3.5 text-[#0e639c]" />
                  </div>
                  <h3 className="text-[10px] uppercase text-[#858585] font-bold tracking-widest">AI Drafter</h3>
                </div>
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-[#0e639c]/40" />
                   <div className="w-1 h-1 rounded-full bg-[#0e639c]/40" />
                   <div className="w-1 h-1 rounded-full bg-[#0e639c]/40" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex gap-3", m.role === 'user' ? 'flex-row-reverse' : '')}>
                    <div className={cn("w-8 h-8 flex items-center justify-center shrink-0 rounded-full", m.role === 'user' ? 'bg-[#0e639c] text-white shadow-lg shadow-[#0e639c]/20' : 'bg-[#37373d] text-[#cccccc] border border-[#4d4d4d]')}>
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={cn("max-w-[85%] p-3.5 text-sm leading-relaxed rounded-2xl", m.role === 'user' ? 'bg-[#0e639c] text-white rounded-tr-none' : 'bg-[#37373d] text-[#cccccc] rounded-tl-none border border-[#4d4d4d]')}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {actionLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-[#37373d] flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-[#37373d] p-3 flex gap-1">
                      <span className="w-2 h-2 bg-[#858585] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#858585] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#858585] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-[#2d2d2d] bg-[#181818] shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                    disabled={agreement.status !== 'draft'}
                    placeholder={agreement.status === 'draft' ? "Instruct AI to draft..." : "Editing locked."}
                    className="flex-1 px-3 py-2 bg-[#3c3c3c] text-white text-sm focus:outline-none focus:border-[#0e639c] disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={actionLoading || !chatInput.trim() || agreement.status !== 'draft'}
                    className="px-3 py-2 bg-[#0e639c] text-white hover:bg-[#1177bb] disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Section */}
            <div className="flex-1 min-h-0 flex flex-col">
              <EditableTextEditor 
                value={currentText} 
                onChange={handleTextEdit} 
                disabled={agreement.status !== 'draft'} 
              />
            </div>
            
            {/* Control Bar */}
            <ControlBar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onApprove={handleApprove}
              onInject={handleInject}
              onDownload={handleDownload}
              status={agreement.status}
              loading={actionLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
