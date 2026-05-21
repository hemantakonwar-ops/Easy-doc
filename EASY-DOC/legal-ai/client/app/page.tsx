"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import { 
  FileText, 
  Clock,
  Shield, 
  TrendingUp, 
  Loader2, 
  AlertCircle, 
  Plus,
  ArrowRight,
  Activity,
  MoreHorizontal,
  Scale,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bell,
  Moon,
  FileSignature
} from "lucide-react";
import { getDashboardStats, getRecentDocuments, DashboardStats, RecentDocument } from "../features/dashboard/dashboardService";
import { getCurrentUser, logout } from "../features/auth/authService";
import Link from "next/link";
import { cn } from "../lib/utils/cn";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, docsData] = await Promise.all([
          getDashboardStats().catch(() => ({
            totalDocuments: 0,
            analyzedThisMonth: 0,
            averageRiskScore: 0,
            pendingReview: 0
          })),
          getRecentDocuments(5).catch(() => [])
        ]);
        setStats(statsData);
        setDocuments(Array.isArray(docsData) ? docsData : []);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getRiskColor = (risk: number) => {
    if (risk > 70) return "bg-[#f48771]";
    if (risk > 40) return "bg-[#cca700]";
    return "bg-[#89d185]";
  };

  const getRiskBgColor = (risk: number) => {
    if (risk > 70) return "bg-[#f48771]/10 border-[#f48771]/20";
    if (risk > 40) return "bg-[#cca700]/10 border-[#cca700]/20";
    return "bg-[#89d185]/10 border-[#89d185]/20";
  };

  const getRiskTextColor = (risk: number) => {
    if (risk > 70) return "text-[#f48771]";
    if (risk > 40) return "text-[#cca700]";
    return "text-[#89d185]";
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-[var(--vscode-bg)] text-[var(--vscode-text)] overflow-hidden flex">
      {/* Activity Bar - Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-12">
        {/* Top Header Bar */}
        <header className="h-9 bg-[var(--vscode-activity)] border-b border-[var(--vscode-border)] flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Scale className="w-4 h-4 text-[var(--vscode-accent)]" />
            <span className="text-[var(--vscode-text-muted)]">LegalAI</span>
            <span className="text-[var(--vscode-text-muted)]">/</span>
            <span className="text-[var(--vscode-text)]">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-[var(--vscode-text-muted)] hover:text-[var(--vscode-text)] hover:bg-[var(--vscode-hover)]">
              <Bell className="w-4 h-4" />
            </button>
            <ThemeToggle size="sm" />
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 pl-2 border-l border-[var(--vscode-border)] hover:bg-[var(--vscode-hover)] py-1"
              >
                <div className="w-5 h-5 bg-[var(--vscode-accent)] flex items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <ChevronDown className={cn("w-3 h-3 text-[var(--vscode-text-muted)] transition-transform", isProfileOpen && "rotate-180")} />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-[var(--vscode-border)]">
                    <p className="text-sm text-[var(--vscode-text)]">{user?.name || "User"}</p>
                    <p className="text-xs text-[var(--vscode-text-muted)]">{user?.email || ""}</p>
                  </div>
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--vscode-text)] hover:bg-[var(--vscode-hover)]">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--vscode-text)] hover:bg-[var(--vscode-hover)] w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--vscode-text-muted)] mb-2">Overview</p>
              <h1 className="text-3xl sm:text-4xl font-light text-[var(--vscode-text)]">
                Welcome back, <span className="text-[var(--vscode-accent)]">{user?.name || 'User'}</span>
              </h1>
              <p className="text-[var(--vscode-text-muted)] mt-2 text-sm">
                Your legal documents and AI analysis dashboard
              </p>
            </div>

            {error && (
              <div className="bg-[#f48771]/10 border border-[#f48771]/20 text-[#f48771] px-4 py-3 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-[var(--vscode-accent)]" />
                  <p className="text-[var(--vscode-text-muted)] text-sm">Loading dashboard...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {/* Total Documents */}
                  <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-5 hover:border-[var(--vscode-accent)] transition-colors group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--vscode-text-muted)] mb-2">Documents</p>
                        <p className="text-4xl font-light text-[var(--vscode-text)]">{stats?.totalDocuments || 0}</p>
                        <p className="text-xs text-[var(--vscode-text-muted)] mt-1">All time uploads</p>
                      </div>
                      <div className="w-10 h-10 bg-[var(--vscode-accent)] flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Analyzed This Month */}
                  <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-5 hover:border-[var(--vscode-accent)] transition-colors group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--vscode-text-muted)] mb-2">This Month</p>
                        <p className="text-4xl font-light text-[var(--vscode-text)]">{stats?.analyzedThisMonth || 0}</p>
                        <p className="text-xs text-[var(--vscode-text-muted)] mt-1 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Active processing
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-[var(--vscode-hover)] flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[var(--vscode-text)]" />
                      </div>
                    </div>
                  </div>

                  {/* Average Risk Score */}
                  <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-5 hover:border-[var(--vscode-accent)] transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--vscode-text-muted)] mb-2">Avg Risk</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-light text-[var(--vscode-text)]">{stats?.averageRiskScore || 0}</p>
                          <span className="text-sm text-[var(--vscode-text-muted)]">/100</span>
                        </div>
                        <div className="mt-3 h-1 bg-[var(--vscode-input)] overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${getRiskColor(stats?.averageRiskScore || 0)}`}
                            style={{ width: `${stats?.averageRiskScore || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[var(--vscode-hover)] flex items-center justify-center ml-3">
                        <Shield className="w-5 h-5 text-[var(--vscode-accent)]" />
                      </div>
                    </div>
                  </div>

                  {/* Pending Review */}
                  <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-5 hover:border-[var(--vscode-accent)] transition-colors group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--vscode-text-muted)] mb-2">Pending</p>
                        <p className="text-4xl font-light text-[var(--vscode-text)]">{stats?.pendingReview || 0}</p>
                        <p className="text-xs text-[var(--vscode-text-muted)] mt-1">Requires attention</p>
                      </div>
                      <div className="w-10 h-10 bg-[var(--vscode-accent)] flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Documents Section */}
                <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--vscode-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--vscode-accent)]" />
                      <span className="text-sm font-semibold text-[var(--vscode-text)]">Recent Documents</span>
                    </div>
                    <Link 
                      href="/documents"
                      className="inline-flex items-center gap-1 text-xs text-[var(--vscode-accent)] hover:text-[var(--vscode-accent-hover)] transition-colors"
                    >
                      View all
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {documents.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-[var(--vscode-hover)] flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-[var(--vscode-text-muted)]" />
                      </div>
                      <h3 className="text-xl text-[var(--vscode-text)] mb-1">No documents yet</h3>
                      <p className="text-[var(--vscode-text-muted)] text-sm mb-4">Upload your first document to get started</p>
                      <Link
                        href="/upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--vscode-accent)] text-white text-sm hover:bg-[var(--vscode-accent-hover)] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Upload Document
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--vscode-border)]">
                      {documents.map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/document/${doc.id}`}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--vscode-hover)] transition-colors group"
                        >
                          <div className={cn("w-10 h-10 flex items-center justify-center flex-shrink-0 border", getRiskBgColor(doc.risk || 0))}>
                            <FileText className="w-4 h-4 text-[var(--vscode-text)]" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-[var(--vscode-text)] truncate group-hover:text-[var(--vscode-accent)] transition-colors">
                              {doc.name}
                            </h3>
                            <p className="text-xs text-[var(--vscode-text-muted)] mt-0.5">{formatDate(doc.date)}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={cn("text-[10px] px-2 py-0.5 border flex items-center gap-1.5 transition-all duration-500", 
                              doc.risk !== null ? getRiskBgColor(doc.risk) : "bg-[var(--vscode-input)] border-[var(--vscode-border)] text-[var(--vscode-text-muted)]"
                            )}>
                              <Shield className="w-2.5 h-2.5" />
                              <span>
                                {doc.risk !== null ? `${doc.risk}%` : (doc.status === 'Analyzed' ? 'No Risk' : 'Pending')}
                              </span>
                            </div>
                            
                            <span className={cn("text-[10px] px-2 py-0.5 border transition-all duration-500", 
                              doc.status === "Analyzed" ? "text-[#89d185] border-[#89d185]/30" :
                              doc.status === "Pending" ? "text-[#cca700] border-[#cca700]/30" :
                              "text-[var(--vscode-text-muted)] border-[var(--vscode-border)]"
                            )}>
                              {doc.status}
                            </span>

                            <button className="w-6 h-6 hover:bg-[var(--vscode-input)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <MoreHorizontal className="w-3 h-3 text-[var(--vscode-text-muted)]" />
                            </button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Drafting & Actions Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <FileSignature className="w-32 h-32 text-[var(--vscode-accent)]" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-2xl font-light text-[var(--vscode-text)] mb-2">AI Agreement Drafting</h2>
                      <p className="text-[var(--vscode-text-muted)] text-sm mb-6 max-w-md">
                        Upload an AcroForm PDF to begin AI-assisted drafting, manual edits, and automatic PDF injection.
                      </p>
                      <Link 
                        href="/agreement/upload"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--vscode-accent)] text-white hover:bg-[var(--vscode-accent-hover)] transition-all shadow-lg shadow-[var(--vscode-accent)]/20"
                      >
                        <FileSignature className="w-5 h-5" />
                        <span className="font-medium">Start Drafting</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="bg-[var(--vscode-sidebar)] border border-[var(--vscode-border)] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Plus className="w-32 h-32 text-[var(--vscode-text)]" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-2xl font-light text-[var(--vscode-text)] mb-2">Document Analysis</h2>
                      <p className="text-[var(--vscode-text-muted)] text-sm mb-6 max-w-md">
                        Upload existing legal documents for risk assessment, summarization, and interactive Q&A.
                      </p>
                      <Link 
                        href="/upload"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--vscode-hover)] text-[var(--vscode-text)] hover:bg-[var(--vscode-input)] border border-[var(--vscode-border)] transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Upload Document</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
