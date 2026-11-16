import React from 'react';

interface MFCCMatrixProps {
  mfcc: number[][]; // [frames][13 coeffs]
}

export const MFCCMatrix: React.FC<MFCCMatrixProps> = ({ mfcc }) => {
  const data = mfcc.length > 0
    ? mfcc
    : Array.from({ length: 16 }, () => Array.from({ length: 13 }, (_, c) => Math.sin(c) * 12));

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-white border border-[#014BAA]/15 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#014BAA] uppercase tracking-wider">
          MFCC Matrix (Mel-Frequency Cepstral Coefficients 1-13)
        </span>
        <span className="text-[11px] font-medium text-[#282B4A]/60">Timbral Vocal Matrix</span>
      </div>

      <div className="overflow-x-auto p-2 bg-[#F8F3F0] rounded-xl border border-[#014BAA]/10">
        <div className="grid grid-cols-13 gap-1 min-w-[500px]">
          {data.slice(0, 16).map((frame, fIndex) => (
            <div key={fIndex} className="flex flex-col gap-1 flex-1">
              {frame.map((coeffVal, cIndex) => {
                // Color intensity mapped from -20 to +20
                const normalized = Math.max(0, Math.min(1, (coeffVal + 20) / 40));
                const bg = `rgba(1, 75, 170, ${Math.max(0.15, normalized)})`;
                return (
                  <div
                    key={cIndex}
                    className="h-3 rounded-[2px] transition-all hover:scale-110 flex items-center justify-center text-[9px] text-[#282B4A]"
                    style={{ backgroundColor: bg }}
                    title={`Segment ${fIndex + 1}, Coeff ${cIndex + 1}: ${coeffVal}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-[#282B4A]/60 px-1 font-medium">
        <span>Coeff 1 (Energy)</span>
        <span>Coeff 13 (High Spectral Inharmonicity)</span>
      </div>
    </div>
  );
};
