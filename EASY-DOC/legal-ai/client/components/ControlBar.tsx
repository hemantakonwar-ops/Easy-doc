import React from 'react';
import { Undo2, Redo2, CheckCircle2, FileDown, FileSignature, Loader2 } from 'lucide-react';

interface ControlBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onApprove: () => void;
  onInject: () => void;
  onDownload: () => void;
  status: 'draft' | 'approved' | 'injected';
  loading?: boolean;
}

export default function ControlBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onApprove,
  onInject,
  onDownload,
  status,
  loading = false,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-2 bg-[#181818] p-3 border-t border-[#2d2d2d]">
      <button
        onClick={onUndo}
        disabled={!canUndo || status !== 'draft' || loading}
        className="p-2 text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded"
        title="Undo"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo || status !== 'draft' || loading}
        className="p-2 text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded"
        title="Redo"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      {status === 'draft' && (
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors rounded"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Approve Text
        </button>
      )}

      {status === 'approved' && (
        <button
          onClick={onInject}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0e639c] text-white text-sm hover:bg-[#1177bb] transition-colors rounded"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
          Inject to PDF
        </button>
      )}

      {status === 'injected' && (
        <button
          onClick={onDownload}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0e639c] text-white text-sm hover:bg-[#1177bb] transition-colors rounded"
        >
          <FileDown className="w-4 h-4" />
          Download PDF
        </button>
      )}
    </div>
  );
}
