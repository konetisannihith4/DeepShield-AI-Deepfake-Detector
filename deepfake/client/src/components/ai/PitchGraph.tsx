import React, { useRef, useEffect } from 'react';

interface PitchGraphProps {
  pitch: number[]; // Pitch in Hz
  height?: number;
}

export const PitchGraph: React.FC<PitchGraphProps> = ({ pitch, height = 130 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const data = pitch.length > 0
      ? pitch
      : Array.from({ length: 40 }, (_, i) => 150 + Math.sin(i * 0.3) * 35);

    const minHz = 80;
    const maxHz = 300;
    const stepX = width / (data.length - 1 || 1);

    // Background
    ctx.fillStyle = '#F8F3F0';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(1, 75, 170, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Plot Pitch Line
    ctx.strokeStyle = '#014BAA'; // Royal Blue Pitch Track
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    data.forEach((hz, i) => {
      const x = i * stepX;
      const normalizedY = (hz - minHz) / (maxHz - minHz);
      const y = height - Math.max(10, Math.min(height - 10, normalizedY * height));

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw Points
    data.forEach((hz, i) => {
      const x = i * stepX;
      const normalizedY = (hz - minHz) / (maxHz - minHz);
      const y = height - Math.max(10, Math.min(height - 10, normalizedY * height));

      ctx.fillStyle = '#F4B6CC';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#014BAA';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [pitch, height]);

  return (
    <div className="w-full relative rounded-2xl overflow-hidden bg-white border border-[#014BAA]/15 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#014BAA] uppercase tracking-wider">
          Fundamental Pitch Contour F0 (Hz) & Vocoder Stability
        </span>
        <span className="text-[11px] font-medium text-[#282B4A]/60">Range: 80 Hz - 300 Hz</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-[#014BAA]/10">
        <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
      </div>
    </div>
  );
};
