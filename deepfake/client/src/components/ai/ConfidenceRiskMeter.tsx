import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ConfidenceRiskMeterProps {
  score: number; // 0.0 to 1.0
  confidence: number; // 0 to 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: string;
}

export const ConfidenceRiskMeter: React.FC<ConfidenceRiskMeterProps> = ({
  score,
  confidence,
  riskLevel,
  status,
}) => {
  const percentage = Math.round(score * 100);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', stroke: '#ef4444' };
      case 'HIGH':
        return { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', stroke: '#f97316' };
      case 'MODERATE':
        return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', stroke: '#fbbf24' };
      default:
        return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', stroke: '#34d399' };
    }
  };

  const riskStyle = getRiskColor(riskLevel);
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-900/90 border border-slate-800 glass-card shadow-xl">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="text-slate-800"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={riskStyle.stroke}
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-display text-white tracking-tight">
            {percentage}%
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Deepfake Probability
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${riskStyle.bg} ${riskStyle.border} ${riskStyle.text}`}>
          {riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? (
            <ShieldAlert className="w-4 h-4" />
          ) : riskLevel === 'MODERATE' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider">{riskLevel} RISK</span>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
          <span>Certainty: <strong className="text-slate-200">{confidence}%</strong></span>
          <span>•</span>
          <span>Verdict: <strong className="text-slate-200">{status}</strong></span>
        </div>
      </div>
    </div>
  );
};
