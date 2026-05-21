"use client";

import { useEffect, useState } from "react";
import { getDocument } from "./documentService";
import { FileText, AlertCircle, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface Document {
  id?: string;
  documentId?: string;
  filename: string;
  text: string;
  chunks: string[];
}

interface DocumentViewerProps {
  documentId: string;
}

export default function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await getDocument(documentId);
        setDoc(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-[#181715]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-lg">
          <AlertCircle className="w-6 h-6" />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-gray-500 bg-gray-50 px-6 py-4 rounded-lg">
          <FileText className="w-6 h-6" />
          <span className="font-medium">Document not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-card overflow-hidden">
      {/* Toolbar - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b border-[#e8e1d8] bg-[#fffdf9]">
        {/* Page Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
              className="p-1.5 hover:bg-[#f7f4ef] shadow-sm border border-[#e8e1d8] disabled:opacity-50"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 text-[#777169]" />
            </button>
            <span className="text-sm text-[#777169] min-w-[60px] sm:min-w-[80px] text-center">
              {currentPage} / 12
            </span>
            <button 
              onClick={() => setCurrentPage((p: number) => Math.min(12, p + 1))}
              className="p-1.5 hover:bg-[#f7f4ef] shadow-sm border border-[#e8e1d8] disabled:opacity-50"
              disabled={currentPage >= 12}
            >
              <ChevronRight className="w-4 h-4 text-[#777169]" />
            </button>
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs sm:text-sm text-[#777169] sm:hidden">Zoom</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoom((z: number) => Math.max(50, z - 10))}
              className="p-1.5 hover:bg-[#f7f4ef] shadow-sm border border-[#e8e1d8]"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-[#777169]" />
            </button>
            <span className="text-sm text-[#777169] min-w-[50px] sm:min-w-[60px] text-center">{zoom}%</span>
            <button 
              onClick={() => setZoom((z: number) => Math.min(200, z + 10))}
              className="p-1.5 hover:bg-[#f7f4ef] shadow-sm border border-[#e8e1d8]"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-[#777169]" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Content - Responsive */}
      <div 
        className="p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] bg-[#f3eee6] overflow-auto"
        style={{ fontSize: `${zoom}%` }}
      >
        <div className="bg-[#fffdf9] p-4 sm:p-6 lg:p-8 shadow-sm max-w-3xl mx-auto border border-[#e8e1d8]">
          <h2 className="font-editorial text-2xl text-[#181715] mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#e8e1d8]">
            {doc.filename}
          </h2>
          <div className="prose max-w-none whitespace-pre-wrap text-[#3f3a35] leading-8 text-sm sm:text-base">
            {doc.text || "No text content available"}
          </div>
        </div>
      </div>
    </div>
  );
}
