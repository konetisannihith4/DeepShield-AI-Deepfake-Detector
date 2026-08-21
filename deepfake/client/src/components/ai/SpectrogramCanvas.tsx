import React, { useRef, useEffect } from 'react';

interface SpectrogramCanvasProps {
  spectrogram: number[][]; // [frames][bands]
  height?: number;
}

export const SpectrogramCanvas: React.FC<SpectrogramCanvasProps> = ({
  spectrogram,
  height = 160,
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

    const data = spectrogram.length > 0 
      ? spectrogram 
      : Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random()));

    const numFrames = data.length;
    const numBands = data[0]?.length || 16;
    const cellWidth = width / numFrames;
    const cellHeight = height / numBands;

    data.forEach((frameBands, f) => {
      frameBands.forEach((intensity, b) => {
        const x = f * cellWidth;
        const y = height - (b + 1) * cellHeight; // High freq at top

        // Color Heatmap: Blue (low energy) -> Cyan -> Green -> Yellow -> Red/Mag (high spectral energy)
        let r = 0, g = 0, initialB = 0;
        if (intensity < 0.25) {
          initialB = Math.floor(intensity * 4 * 255);
        } else if (intensity < 0.5) {
          g = Math.floor((intensity - 0.25) * 4 * 255);
          initialB = 255;
        } else if (intensity < 0.75) {
          r = Math.floor((intensity - 0.5) * 4 * 255);
          g = 255;
        } else {
          r = 255;
          g = Math.floor((1 - (intensity - 0.75) * 4) * 255);
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${initialB})`;
        ctx.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
      });
    });

    // Draw Frequency Y-Axis Markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('8000 Hz', 6, 14);
    ctx.fillText('4000 Hz', 6, height / 2 + 4);
    ctx.fillText('0 Hz', 6, height - 6);

  }, [spectrogram, height]);

  return (
    <div className="w-full relative rounded-lg overflow-hidden bg-slate-950/80 border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          FFT Spectral Power Density Spectrogram (0-8 kHz)
        </span>
        <span className="text-[11px] text-slate-400">Heatmap Resolution: 32x16 FFT Bins</span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
};
