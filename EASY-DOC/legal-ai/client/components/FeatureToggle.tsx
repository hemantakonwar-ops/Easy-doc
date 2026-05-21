'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ShieldAlert, 
  FileText, 
  Scissors, 
  Download, 
  Share2, 
  Upload, 
  Bell, 
  GitCompare, 
  Bookmark, 
  FileStack, 
  Bot,
  LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils/cn';
import { FeatureFlags, defaultFeatures, saveFeatures, featureDescriptions } from '../lib/features';

const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  ShieldAlert,
  FileText,
  Scissors,
  Download,
  Share2,
  Upload,
  Bell,
  GitCompare,
  Bookmark,
  FileStack,
  Bot,
};

interface FeatureToggleProps {
  featureKey: keyof FeatureFlags;
  features: FeatureFlags;
  onToggle: (key: keyof FeatureFlags, value: boolean) => void;
}

export default function FeatureToggle({ featureKey, features, onToggle }: FeatureToggleProps) {
  const config = featureDescriptions[featureKey];
  const Icon = iconMap[config.icon];
  const enabled = features[featureKey];

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--vscode-hover)] border border-[var(--vscode-border)] hover:border-[var(--vscode-accent)] transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 flex items-center justify-center transition-colors",
          enabled ? "bg-[var(--vscode-accent)] text-white" : "bg-[var(--vscode-input)] text-[var(--vscode-text-muted)]"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className={cn(
            "font-medium transition-colors",
            enabled ? "text-[var(--vscode-text)]" : "text-[var(--vscode-text-muted)]"
          )}>
            {config.label}
          </h3>
          <p className="text-sm text-[var(--vscode-text-muted)]">{config.description}</p>
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(featureKey, !enabled)}
        className={cn(
          "relative w-14 h-7 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--vscode-accent)] focus:ring-offset-2 focus:ring-offset-[var(--vscode-bg)]",
          enabled ? "bg-[var(--vscode-accent)]" : "bg-[var(--vscode-input)]"
        )}
        aria-label={`Toggle ${config.label}`}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-6 h-6 bg-[var(--vscode-text)] shadow-sm transition-transform duration-200 ease-in-out",
            enabled ? "translate-x-7" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
