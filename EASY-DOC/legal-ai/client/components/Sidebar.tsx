"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Scale,
  Menu,
  X,
  Settings,
  User,
  FileSignature
} from "lucide-react";
import { cn } from "../lib/utils/cn";
import { getFeatures, FeatureFlags } from "../lib/features";

// ❌ REMOVED: Search and History navigation - Search now inline in document viewer, History removed
const allNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, feature: null },
  { name: "Documents", href: "/documents", icon: FileText, feature: null },
  { name: "Upload", href: "/upload", icon: Upload, feature: null },
  { name: "Draft Agreement", href: "/agreement/upload", icon: FileSignature, feature: null },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setFeatures(getFeatures());
  }, []);

  // Filter navigation based on enabled features
  const navigation = allNavigation.filter((item) => {
    if (!item.feature) return true;
    return features?.[item.feature as keyof FeatureFlags] ?? true;
  });

  if (!features) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden p-3 bg-[var(--vscode-activity)] text-[var(--vscode-text)] border border-[var(--vscode-border)] transition-all"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* VS Code-style Activity Bar - Icon Only Navigation */}
      <aside 
        className={cn(
          "flex flex-col h-full bg-[var(--vscode-activity)] border-r border-[var(--vscode-border)] transition-all duration-300 ease-in-out",
          "fixed lg:fixed inset-y-0 left-0 z-50 w-12",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Logo */}
        <div className="py-4 flex justify-center">
          <Link href="/" className="flex items-center justify-center" title="LegalAI">
            <Scale className="w-6 h-6 text-[var(--vscode-accent)]" />
          </Link>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 py-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-center h-10 w-full border-l-2 transition-colors",
                  isActive
                    ? "border-white bg-[var(--vscode-hover)] text-white"
                    : "border-transparent text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-hover)] hover:text-white"
                )}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>

        {/* Settings & User at Bottom */}
        <div className="py-2 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center h-10 w-full border-l-2 transition-colors",
              pathname === "/settings"
                ? "border-white bg-[var(--vscode-hover)] text-white"
                : "border-transparent text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-hover)] hover:text-white"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            className="flex items-center justify-center h-10 w-full border-l-2 border-transparent text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-hover)] hover:text-white transition-colors"
            title="User Profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
