import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  waveform: number[];
  height?: number;
  syntheticSegments?: Array<{ startTime: number; endTime: number; type: string }>;
  durationSeconds?: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveform,
  height = 140,
  syntheticSegments = [],
  durationSeconds = 10,
}) => {
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

    // Draw Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw Synthetic Highlight Overlay Blocks
    syntheticSegments.forEach((seg) => {
      const startX = (seg.startTime / durationSeconds) * width;
      const endX = (seg.endTime / durationSeconds) * width;
      const segWidth = Math.max(10, endX - startX);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(startX, 0, segWidth, height);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, 0, segWidth, height);
    });

    // Draw Waveform Bars
    const data = waveform.length > 0 ? waveform : Array.from({ length: 80 }, (_, i) => Math.sin(i * 0.3) * 0.6);
    const barWidth = width / data.length;
    const centerY = height / 2;

    data.forEach((val, i) => {
      const x = i * barWidth;
      const barHeight = Math.max(4, Math.abs(val) * (height / 2 - 10));

      const isAnomaly = syntheticSegments.some((seg) => {
        const timeAtBar = (i / data.length) * durationSeconds;
        return timeAtBar >= seg.startTime && timeAtBar <= seg.endTime;
      });

      ctx.fillStyle = isAnomaly ? '#ef4444' : '#3b82f6';
      ctx.fillRect(x + 1, centerY - barHeight, Math.max(2, barWidth - 2), barHeight * 2);
    });
  }, [waveform, height, syntheticSegments, durationSeconds]);

  return (
    <div className="w-full relative rounded-lg overflow-hidden bg-slate-950/80 border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
          Audio Amplitude Waveform (Time Domain)
        </span>
        <span className="text-[11px] text-slate-400">
          Duration: {durationSeconds}s | Samples: {waveform.length}
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
};
