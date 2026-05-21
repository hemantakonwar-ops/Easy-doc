"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ThemeToggle from "../../components/ThemeToggle";
import { FileText, Loader2, AlertCircle, Search, Filter, Plus, Scale } from "lucide-react";
import { getRecentDocuments, RecentDocument } from "../../features/dashboard/dashboardService";
import { getCurrentUser } from "../../features/auth/authService";
import Link from "next/link";
import { cn } from "../../lib/utils/cn";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docsData = await getRecentDocuments(50);
        setDocuments(Array.isArray(docsData) ? docsData : []);
      } catch (err) {
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getRiskColor = (risk: number) => {
    if (risk > 70) return "text-[#f48771] border-[#f48771]/30";
    if (risk > 40) return "text-[#cca700] border-[#cca700]/30";
    return "text-[#89d185] border-[#89d185]/30";
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="h-screen bg-[var(--vscode-bg)] text-[var(--vscode-text)] overflow-hidden flex">
      {/* Activity Bar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 ml-12">
        {/* Header */}
        <header className="h-9 bg-[var(--vscode-activity)] border-b border-[var(--vscode-border)] flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Scale className="w-4 h-4 text-[var(--vscode-accent)]" />
            <span className="text-[var(--vscode-text-muted)]">LegalAI</span>
            <span className="text-[var(--vscode-text-muted)]">/</span>
            <span className="text-[var(--vscode-text)]">Documents</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--vscode-text-muted)] mb-1">Library</p>
                <h1 className="text-2xl font-light text-[var(--vscode-text)]">All Documents</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/agreement/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] text-[var(--vscode-text)] text-sm hover:bg-[var(--vscode-hover)] transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#0e639c]" />
                  Draft New Agreement
                </Link>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--vscode-accent)] text-white text-sm hover:bg-[var(--vscode-accent-hover)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Upload New
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-[#f48771]/10 border border-[#f48771]/20 text-[#f48771] px-4 py-3 mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] mb-6">
              <div className="p-3 flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--vscode-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--vscode-input)] border border-[var(--vscode-border)] text-[var(--vscode-text)] text-sm focus:outline-none focus:border-[var(--vscode-accent)]"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 text-[var(--vscode-text-muted)] hover:text-[var(--vscode-text)] hover:bg-[var(--vscode-hover)] text-sm">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--vscode-accent)]" />
              </div>
            ) : (
              <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)]">
                <div className="px-4 py-3 border-b border-[var(--vscode-border)] flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--vscode-text)]">
                    {filteredDocuments.length} documents
                  </span>
                </div>
                <div className="divide-y divide-[var(--vscode-border)]">
                  {filteredDocuments.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--vscode-text-muted)]" />
                      <p className="text-[var(--vscode-text-muted)]">No documents found.</p>
                      {searchTerm && (
                        <p className="text-sm mt-1 text-[var(--vscode-text-muted)]">Try adjusting your search</p>
                      )}
                    </div>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-[var(--vscode-hover)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--vscode-hover)] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[var(--vscode-accent)]" />
                          </div>
                          <div>
                            <Link
                              href={`/document/${doc.id}`}
                              className="text-sm font-medium text-[var(--vscode-text)] hover:text-[var(--vscode-accent)] transition-colors"
                            >
                              {doc.name}
                            </Link>
                            <p className="text-xs text-[var(--vscode-text-muted)]">
                              Uploaded {formatDate(doc.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.risk !== null && (
                            <span className={cn("text-xs px-2 py-0.5 border", getRiskColor(doc.risk))}>
                              {doc.risk}
                            </span>
                          )}
                          <span className={cn("text-xs px-2 py-0.5 border",
                            doc.status === "Analyzed" ? "text-[#89d185] border-[#89d185]/30" :
                            doc.status === "Pending" ? "text-[#cca700] border-[#cca700]/30" :
                            "text-[var(--vscode-text-muted)] border-[var(--vscode-border)]"
                          )}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
