'use client';

import { FileText, Sparkles } from 'lucide-react';

interface DocumentSummaryProps {
  summary: string;
  totalPages?: number;
  totalWords?: number;
  analyzedAt?: string;
  className?: string;
}

export default function DocumentSummary({
  summary,
  totalPages = 0,
  totalWords = 0,
  analyzedAt,
  className,
}: DocumentSummaryProps) {
  return (
    <div className={`editorial-card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#a77a35]" />
        <h2 className="font-editorial text-2xl text-[#181715]">Document Summary</h2>
      </div>

      <p className="text-sm text-[#5f5952] leading-7 mb-6">{summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#e8e1d8]">
        <div>
          <p className="editorial-label">Total Pages</p>
          <p className="font-editorial text-2xl text-[#181715]">{totalPages}</p>
        </div>
        <div>
          <p className="editorial-label">Total Words</p>
          <p className="font-editorial text-2xl text-[#181715]">{totalWords.toLocaleString()}</p>
        </div>
        <div>
          <p className="editorial-label">Analyzed At</p>
          <p className="text-sm font-medium text-[#181715]">{analyzedAt}</p>
        </div>
      </div>
    </div>
  );
}
