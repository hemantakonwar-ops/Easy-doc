'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ThemeToggle from '../../../components/ThemeToggle';
import { 
  Upload as UploadIcon, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileSignature,
  Edit3,
  Bot,
  ChevronLeft,
  Scale
} from 'lucide-react';
import { uploadTemplate } from '../../../features/agreement/agreementService';
import { getCurrentUser } from '../../../features/auth/authService';
import Link from 'next/link';

export default function AgreementUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      await handleUpload(file);
    } else {
      setError('Please upload a PDF file');
    }
  }, []);

  if (!user) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      const result = await uploadTemplate(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      
      if (result.success && result.agreement?.agreementId) {
        setTimeout(() => {
          router.push(`/agreement/${result.agreement.agreementId}`);
        }, 1500);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const features = [
    { 
      icon: Bot, 
      title: 'AI Drafting', 
      desc: 'Use AI to generate agreement clauses',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      icon: Edit3, 
      title: 'Manual Edits', 
      desc: 'Refine text with full version control',
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      icon: FileSignature, 
      title: 'PDF Injection', 
      desc: 'Inject text back into your PDF form',
      color: 'bg-emerald-50 text-emerald-600'
    },
  ];

  const getFeatureColors = (index: number) => {
    const colors = [
      { bg: "bg-[#0e639c]/10", text: "text-[#0e639c]", border: "border-[#0e639c]/20" },
      { bg: "bg-[#cca700]/10", text: "text-[#cca700]", border: "border-[#cca700]/20" },
      { bg: "bg-[#89d185]/10", text: "text-[#89d185]", border: "border-[#89d185]/20" },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-screen bg-[var(--vscode-bg)] text-[var(--vscode-text)] overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-12">
        <header className="h-9 bg-[var(--vscode-activity)] border-b border-[var(--vscode-border)] flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Scale className="w-4 h-4 text-[var(--vscode-accent)]" />
            <span className="text-[var(--vscode-text-muted)]">LegalAI</span>
            <span className="text-[var(--vscode-text-muted)]">/</span>
            <span className="text-[var(--vscode-text)]">New Agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <Link 
              href="/documents"
              className="inline-flex items-center gap-2 text-[var(--vscode-text-muted)] hover:text-[var(--vscode-text)] transition-colors mb-6 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Library</span>
            </Link>

            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--vscode-text-muted)] mb-2">AI Drafting</p>
              <h1 className="text-3xl font-light text-[var(--vscode-text)]">Upload Agreement Template</h1>
              <p className="text-[var(--vscode-text-muted)] mt-2 text-sm">Upload an AcroForm PDF to begin AI-assisted drafting</p>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed p-12 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-[var(--vscode-accent)] bg-[var(--vscode-hover)]' 
                  : 'border-[var(--vscode-border)] hover:border-[var(--vscode-text-muted)] bg-[var(--vscode-sidebar)]'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-[var(--vscode-accent)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-[var(--vscode-text)]">{uploadProgress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[var(--vscode-text)] font-medium">Initializing workspace...</p>
                    <div className="w-48 h-1.5 bg-[var(--vscode-input)] overflow-hidden mx-auto">
                      <div 
                        className="h-full bg-[var(--vscode-accent)] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : uploadResult ? (
                <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-[var(--vscode-accent)] flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(14,99,156,0.3)]">
                    <CheckCircle className="w-10 h-10 text-white animate-in zoom-in spin-in-12 duration-700 delay-200" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-light text-[var(--vscode-text)] tracking-tight">Upload successful!</p>
                    <div className="flex items-center justify-center gap-2 text-[var(--vscode-text-muted)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm">Opening drafting environment...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-[var(--vscode-accent)] flex items-center justify-center mx-auto mb-6">
                    <UploadIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-light text-[var(--vscode-text)] mb-2">
                    Drop your PDF template here
                  </h3>
                  <p className="text-[var(--vscode-text-muted)] mb-2 text-sm">or click to browse files</p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--vscode-accent)] text-white hover:bg-[var(--vscode-accent-hover)] transition-colors cursor-pointer">
                    <FileText className="w-5 h-5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-[#f48771]/10 border border-[#f48771]/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#f48771] flex-shrink-0" />
                <p className="text-[#f48771] text-sm">{error}</p>
              </div>
            )}

            <div className="mt-12">
              <h3 className="text-lg font-medium text-[var(--vscode-text)] mb-4">Agreement Workflow</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {features.map((feature, i) => {
                  const colors = getFeatureColors(i);
                  return (
                    <div 
                      key={i} 
                      className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-5 hover:border-[var(--vscode-accent)] transition-colors"
                    >
                      <div className={`w-10 h-10 ${colors.bg} ${colors.border} border flex items-center justify-center mb-3`}>
                        <feature.icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <h4 className="font-medium text-[var(--vscode-text)] mb-1 text-sm">{feature.title}</h4>
                      <p className="text-xs text-[var(--vscode-text-muted)]">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
