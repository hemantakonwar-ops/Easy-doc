'use client';

import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils/cn';

interface RiskFlag {
  type: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface RiskPanelProps {
  riskScore: number;
  flags: RiskFlag[];
  className?: string;
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'High Risk',
    labelColor: 'text-red-700',
  },
  medium: {
    icon: AlertCircle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    label: 'Medium Risk',
    labelColor: 'text-orange-700',
  },
  low: {
    icon: Info,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Low Risk',
    labelColor: 'text-yellow-700',
  },
};

export default function RiskPanel({ riskScore, flags, className }: RiskPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-red-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-yellow-100';
  };

  return (
    <div className={cn('editorial-card overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e8e1d8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl text-[#181715]">Risk Highlights</h2>
            <Info className="w-4 h-4 text-[#777169]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="editorial-label">Risk Score</span>
            <div className={cn('px-3 py-1', getScoreBg(riskScore))}>
              <span className={cn('font-bold', getScoreColor(riskScore))}>{riskScore}</span>
              <span className="text-gray-500 text-sm">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      <div className="p-5 space-y-3">
        {flags.map((flag, index) => {
          const config = severityConfig[flag.severity];
          const Icon = config.icon;
          
          return (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg border',
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', config.iconBg)}>
                  <Icon className={cn('w-4 h-4', config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{flag.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{flag.description}</p>
                    </div>
                    <span className={cn('text-xs font-medium shrink-0', config.labelColor)}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="px-5 py-3 border-t border-[#e8e1d8]">
        <button className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[#181715] hover:text-[#a77a35]">
          View All Risks
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
