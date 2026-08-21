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

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Plot Pitch Line
    ctx.strokeStyle = '#ec4899'; // Vibrant Pink Pitch Track
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

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [pitch, height]);

  return (
    <div className="w-full relative rounded-lg overflow-hidden bg-slate-950/80 border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
          Fundamental Pitch Contour F0 (Hz) & Vocoder Stability
        </span>
        <span className="text-[11px] text-slate-400">Range: 80 Hz - 300 Hz</span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
};
