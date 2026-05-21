"use client";

import { Shield, AlertTriangle } from 'lucide-react';

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

export default function RiskPanel({ riskScore, flags, className = '' }: RiskPanelProps) {
  const getScoreColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Analysis
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getScoreColor(riskScore)}`}>
            {riskScore}/100
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getScoreColor(riskScore)} transition-all duration-500`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>
          <p className={`text-sm font-medium ${getScoreTextColor(riskScore)}`}>
            {riskScore < 30 ? 'Low Risk' : riskScore < 60 ? 'Medium Risk' : 'High Risk'}
          </p>
        </div>

        {flags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Risk Flags ({flags.length})
            </h4>
            <div className="space-y-2">
              {flags.map((flag, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg border ${getSeverityColor(flag.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{flag.title}</p>
                      <p className="text-xs mt-1 opacity-80">{flag.description}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase ml-2 shrink-0">
                      {flag.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {flags.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Shield className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No significant risks detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
