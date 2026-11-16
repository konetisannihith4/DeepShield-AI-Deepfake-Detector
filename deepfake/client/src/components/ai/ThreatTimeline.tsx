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
    <div className="w-full rounded-2xl bg-white border border-[#014BAA]/15 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#014BAA]" />
        <span className="text-xs font-bold text-[#014BAA] uppercase tracking-wider">
          Forensic Threat Timeline & Segment Annotations
        </span>
      </div>

      {syntheticSegments.length === 0 ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
          No synthetic audio manipulation detected in time domain or frequency spectrum.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {syntheticSegments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between font-bold text-red-900">
                  <span>{seg.type}</span>
                  <span className="font-mono bg-red-100 px-2 py-0.5 rounded text-[11px] text-red-800 font-bold border border-red-200">
                    {seg.startTime}s - {seg.endTime}s
                  </span>
                </div>
                <p className="text-[#282B4A]/80 mt-1 text-[11px] leading-relaxed">
                  {seg.description}
                </p>
                <div className="mt-2 text-[10px] text-[#282B4A]/70 font-semibold">
                  Segment Confidence: <strong className="text-red-700">{seg.confidence}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
