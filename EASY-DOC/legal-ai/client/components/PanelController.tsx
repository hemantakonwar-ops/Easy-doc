"use client";

import { 
  Files, 
  ShieldAlert, 
  MessageSquare, 
  Scissors,
  Terminal,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  LucideIcon
} from "lucide-react";
import { cn } from "../lib/utils/cn";

export interface PanelConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  position: 'sidebar' | 'right' | 'bottom';
}

export interface ActivityBarProps {
  panels: Record<string, boolean>;
  onToggle: (id: string) => void;
  configs: PanelConfig[];
}

export function ActivityBar({ panels, onToggle, configs }: ActivityBarProps) {
  return (
    <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[var(--vscode-border)] bg-[var(--vscode-activity)] py-2">
      {configs.map((config) => {
        const Icon = config.icon;
        return (
          <button
            key={config.id}
            onClick={() => onToggle(config.id)}
            className={cn(
              "mb-1 flex h-10 w-10 items-center justify-center border-l-2 transition-colors",
              panels[config.id]
                ? "border-white bg-[var(--vscode-hover)] text-white"
                : "border-transparent text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-hover)] hover:text-white"
            )}
            title={config.label}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
      <button 
        className="mt-auto flex h-10 w-10 items-center justify-center text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-hover)] hover:text-white"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </aside>
  );
}

export interface BottomPanelTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface BottomPanelProps {
  isOpen: boolean;
  activeTab: string;
  tabs: BottomPanelTab[];
  onToggle: () => void;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export function BottomPanel({
  isOpen,
  activeTab,
  tabs,
  onToggle,
  onTabChange,
  children,
}: BottomPanelProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-12 right-0 border-t border-[var(--vscode-border)] bg-[var(--vscode-bg)] z-30",
        "transition-all duration-300 ease-out flex flex-col",
        isOpen ? "h-56" : "h-9"
      )}
    >
      {/* Terminal-style Toggle Bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 h-9 bg-[var(--vscode-activity)] hover:bg-[var(--vscode-hover)] transition-colors shrink-0"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[var(--vscode-text-muted)]" />
          <span className="text-xs text-[var(--vscode-text)]">Terminal & Tools</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-[var(--vscode-text-muted)]" />
        ) : (
          <ChevronUp className="h-4 w-4 text-[var(--vscode-text-muted)]" />
        )}
      </button>

      {/* Tab Navigation - Only visible when open */}
      {isOpen && (
        <div className="flex h-9 items-center border-b border-[var(--vscode-border)] bg-[var(--vscode-activity)] shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 border-r border-[var(--vscode-border)] px-3 text-xs transition-colors h-full",
                  activeTab === tab.id
                    ? "bg-[var(--vscode-bg)] text-white"
                    : "text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-hover)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
          <button 
            onClick={onToggle}
            className="ml-auto px-3 text-[var(--vscode-text-muted)] hover:text-white h-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content - Only visible when open */}
      {isOpen && (
        <div className="flex-1 overflow-auto p-3">
          {children}
        </div>
      )}
    </div>
  );
}

export interface ExplorerPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  fileName: string;
  onSelectTab: (tab: string) => void;
  stats: {
    pages: number;
    words: number;
    risk: number;
  };
}

export function ExplorerPanel({ isOpen, onToggle, fileName, onSelectTab, stats }: ExplorerPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--vscode-border)] bg-[var(--vscode-sidebar)] md:flex">
      <div className="flex h-9 items-center justify-between border-b border-[var(--vscode-border)] px-3 text-[11px] uppercase tracking-wide text-[var(--vscode-text)]">
        Explorer
        <button onClick={onToggle} className="hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {/* Open Document */}
        <div className="mb-4">
          <p className="mb-2 text-[11px] uppercase text-[var(--vscode-text-muted)]">Open Document</p>
          <button 
            onClick={() => onSelectTab('original')} 
            className="flex w-full items-center gap-2 bg-[var(--vscode-hover)] px-2 py-1.5 text-left text-[var(--vscode-text)] hover:bg-[var(--vscode-border)] transition-colors"
          >
            <Files className="h-4 w-4 text-[#c586c0]" />
            <span className="truncate text-xs">{fileName}</span>
          </button>
        </div>
        
        {/* Document Info */}
        <div className="border-t border-[var(--vscode-border)] pt-3 text-xs text-[var(--vscode-text-muted)] space-y-1">
          <p>Pages: {stats.pages}</p>
          <p>Words: {stats.words.toLocaleString()}</p>
          <p>Risk: {stats.risk}/100</p>
        </div>
      </div>
    </aside>
  );
}

export interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function RightPanel({ isOpen, onClose, title, children }: RightPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="hidden w-80 shrink-0 border-l border-[var(--vscode-border)] bg-[var(--vscode-sidebar)] xl:flex flex-col">
      <div className="flex h-9 items-center justify-between border-b border-[var(--vscode-border)] px-3 text-xs uppercase tracking-wide text-[var(--vscode-text)]">
        {title}
        <button onClick={onClose} className="hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </aside>
  );
}
