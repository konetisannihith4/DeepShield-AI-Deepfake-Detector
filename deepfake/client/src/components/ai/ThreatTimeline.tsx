import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

interface ThreatTimelineProps {
  syntheticSegments: Array<{
    startTime: number;
    endTime: number;
    confidence: number;
    type: string;
    description: string;
  }>;
  durationSeconds?: number;
}

export const ThreatTimeline: React.FC<ThreatTimelineProps> = ({
  syntheticSegments,
  durationSeconds = 10,
}) => {
  return (
    <div className="w-full rounded-xl bg-slate-900/90 border border-slate-800 p-4 glass-card">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-red-400" />
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Forensic Threat Timeline & Segment Annotations
        </span>
      </div>

      {syntheticSegments.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-emerald-400">
          No synthetic audio manipulation detected in time domain or frequency spectrum.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {syntheticSegments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between font-semibold text-red-300">
                  <span>{seg.type}</span>
                  <span className="font-mono bg-red-950 px-2 py-0.5 rounded text-[11px] text-red-200">
                    {seg.startTime}s - {seg.endTime}s
                  </span>
                </div>
                <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                  {seg.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-400">
                  Segment Confidence: <strong className="text-red-400">{seg.confidence}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
