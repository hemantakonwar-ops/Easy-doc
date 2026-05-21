import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BookOpen, ExternalLink, AlertCircle, Scale, Shield, Landmark, AlertTriangle, CheckCircle, Search, RefreshCw, ChevronRight } from 'lucide-react';
import { analyzeLaws, LawReference } from '../features/laws/lawsService';
import { cn } from '../lib/utils/cn';

interface ApplicableLawsPanelProps {
  documentId: string;
  documentText?: string;
  className?: string;
}

export default function ApplicableLawsPanel({ documentId, documentText, className = '' }: ApplicableLawsPanelProps) {
  const [laws, setLaws] = useState<LawReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeLawIdx, setActiveLawIdx] = useState<number | null>(null);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchLaws = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (hasFetchedRef.current && laws.length > 0 && !error) return;

    if (!documentId) {
      setError('No document ID provided');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const fetchedLaws = await analyzeLaws(documentId, documentText || undefined, "India");
      setLaws(fetchedLaws);
      hasFetchedRef.current = true;
    } catch (err: any) {
      console.error("Failed to fetch laws:", err);
      setError(err.message || "Failed to analyze applicable laws.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [documentId, documentText, laws.length, error]);

  useEffect(() => {
    hasFetchedRef.current = false;
    setLaws([]);
    setError(null);
    if (documentId) fetchLaws();
  }, [documentId, fetchLaws]);

  const handleRetry = () => {
    hasFetchedRef.current = false;
    setRetryCount(prev => prev + 1);
    fetchLaws();
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'constitutional': return { icon: <Landmark className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      case 'case_law': return { icon: <Scale className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'regulation': return { icon: <Shield className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      default: return { icon: <BookOpen className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 px-4 space-y-6 animate-in fade-in duration-700", className)}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--vscode-accent)]/20 border-t-[var(--vscode-accent)] rounded-full animate-spin"></div>
          <Landmark className="absolute inset-0 m-auto w-6 h-6 text-[var(--vscode-accent)] animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-[var(--vscode-text)]">Deep-scanning legal repositories...</p>
          <p className="text-xs text-[var(--vscode-text-muted)] font-mono animate-pulse">Cross-referencing with InsightLaw API & Case Databases</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-8 flex flex-col items-center justify-center text-center bg-[var(--vscode-sidebar)] border border-red-500/20 rounded-lg", className)}>
        <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center rounded-full mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-[var(--vscode-text)] font-medium mb-2">Analysis Failed</h3>
        <p className="text-xs text-[var(--vscode-text-muted)] mb-6 max-w-sm">{error}</p>
        <button onClick={handleRetry} className="flex items-center gap-2 px-4 py-2 bg-[var(--vscode-accent)] text-white hover:bg-[var(--vscode-accent-hover)] rounded-sm text-xs font-bold uppercase tracking-wider transition-all active:scale-95">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Analysis
        </button>
      </div>
    );
  }

  if (laws.length === 0) {
    return (
      <div className={cn("p-12 text-center border border-dashed border-[var(--vscode-border)] bg-[var(--vscode-sidebar)]/50 rounded-lg", className)}>
        <Scale className="w-12 h-12 text-[var(--vscode-text-muted)] mx-auto mb-4 opacity-20" />
        <h3 className="text-[var(--vscode-text)] font-medium mb-2">No Specific Laws Identified</h3>
        <p className="text-xs text-[var(--vscode-text-muted)] mb-6 max-w-xs mx-auto">
          We couldn't identify any specific legal references. This might be a general document or requires a different jurisdiction analysis.
        </p>
        <button onClick={handleRetry} className="text-[var(--vscode-accent)] hover:text-[var(--vscode-accent-hover)] text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Force Re-Analysis
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-editorial text-[var(--vscode-text)]">Legal Footprint</h2>
            <div className="px-2 py-0.5 bg-[var(--vscode-accent)]/10 border border-[var(--vscode-accent)]/20 rounded text-[10px] text-[var(--vscode-accent)] font-bold uppercase tracking-tighter">
              Jurisdiction: India
            </div>
          </div>
          <p className="text-[10px] text-[var(--vscode-text-muted)] uppercase tracking-widest flex items-center gap-1.5">
            <Landmark className="w-3 h-3" />
            Verified via InsightLaw Intelligence
          </p>
        </div>
        <div className="text-[10px] font-mono text-[var(--vscode-text-muted)] flex items-center gap-2 bg-[var(--vscode-input)] px-3 py-1 rounded-full border border-[var(--vscode-border)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {laws.length} Matches Found
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {laws.map((law, idx) => {
          const styles = getCategoryStyles(law.category);
          const isActive = activeLawIdx === idx;
          
          return (
            <div 
              key={idx} 
              onMouseEnter={() => setActiveLawIdx(idx)}
              onMouseLeave={() => setActiveLawIdx(null)}
              className={cn(
                "group relative bg-[var(--vscode-sidebar)] border transition-all duration-500 overflow-hidden",
                isActive ? "border-[var(--vscode-accent)] shadow-lg -translate-y-1" : "border-[var(--vscode-border)]"
              )}
            >
              {/* Importance Indicator */}
              <div className={cn(
                "absolute top-0 left-0 w-1 h-full transition-all duration-500",
                law.importance === 'high' ? "bg-red-500" : law.importance === 'medium' ? "bg-yellow-500" : "bg-blue-500",
                isActive ? "w-1.5" : "w-1"
              )} />

              <div className="p-5 pl-7">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded transition-colors duration-500", styles.bg, styles.color)}>
                      {styles.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--vscode-text)] leading-tight group-hover:text-[var(--vscode-accent)] transition-colors">
                        {law.law_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {law.section && <span className="text-[9px] font-mono font-bold text-[var(--vscode-text)] bg-[var(--vscode-input)] px-1.5 py-0.5 rounded border border-[var(--vscode-border)]">Sec. {law.section}</span>}
                        {law.article && <span className="text-[9px] font-mono font-bold text-[var(--vscode-text)] bg-[var(--vscode-input)] px-1.5 py-0.5 rounded border border-[var(--vscode-border)]">Art. {law.article}</span>}
                        <span className="text-[9px] uppercase font-bold text-[var(--vscode-text-muted)] tracking-widest">{law.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  {law.relevance_score && (
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-[var(--vscode-text)]">{(law.relevance_score * 100).toFixed(0)}%</div>
                      <div className="text-[8px] uppercase text-[var(--vscode-text-muted)] font-bold tracking-tighter">Relevance</div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[var(--vscode-text-muted)] leading-relaxed mb-6 group-hover:text-[var(--vscode-text)] transition-colors line-clamp-3">
                  {law.context}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  {law.link ? (
                    <a 
                      href={law.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--vscode-accent)] hover:text-[var(--vscode-accent-hover)] transition-all group/link"
                    >
                      View Source
                      <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  ) : (
                    <div className="text-[9px] text-[var(--vscode-text-muted)] italic">Official source pending</div>
                  )}
                  
                  <ChevronRight className={cn(
                    "w-4 h-4 text-[var(--vscode-accent)] transition-all duration-500",
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )} />
                </div>
              </div>

              {/* Hover Glow */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br from-[var(--vscode-accent)]/5 to-transparent pointer-events-none transition-opacity duration-500",
                isActive ? "opacity-100" : "opacity-0"
              )} />
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-[var(--vscode-accent)]/5 border border-[var(--vscode-accent)]/10 rounded-lg flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--vscode-accent)]/20 flex items-center justify-center rounded-full shrink-0">
          <Scale className="w-4 h-4 text-[var(--vscode-accent)]" />
        </div>
        <p className="text-[10px] text-[var(--vscode-text-muted)] leading-relaxed italic">
          <strong className="text-[var(--vscode-text)] not-italic">Pro Tip:</strong> Click 'View Source' to verify the latest legal amendments. Our AI extraction is optimized for India's recent legislative changes including the Bharatiya Nyaya Sanhita 2023.
        </p>
      </div>
    </div>
  );
}
