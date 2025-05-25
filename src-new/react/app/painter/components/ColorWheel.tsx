import React, { useRef, useEffect } from 'react';
import { hslToRgb } from '../../../utils/color';

interface ColorWheelProps {
  hue: number;
  saturation: number;
  onChange: (h: number, s: number) => void;
  size?: number;
}

export default function ColorWheel({ hue, saturation, onChange, size = 100 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const radius = size / 2;
    const image = ctx.createImageData(size, size);
    const data = image.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;
        if (dist > radius) {
          data[idx + 3] = 0;
          continue;
        }
        const angle = Math.atan2(dy, dx) + Math.PI;
        const h = angle * 180 / Math.PI;
        const s = dist / radius;
        const { r, g, b } = hslToRgb(h, s * 100, 50);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    const a = hue * Math.PI / 180;
    const d = saturation * radius;
    const ix = radius + d * Math.cos(a);
    const iy = radius + d * Math.sin(a);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ix, iy, 4, 0, Math.PI * 2);
    ctx.stroke();
  }, [hue, saturation, size]);

  function handleEvent(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const radius = size / 2;
    const dist = Math.sqrt(x * x + y * y);
    if (dist > radius) return;
    const angle = Math.atan2(y, x) + Math.PI;
    onChange(angle * 180 / Math.PI, dist / radius);
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseDown={handleEvent}
      onMouseMove={e => e.buttons === 1 && handleEvent(e)}
      className="cursor-crosshair rounded-full select-none"
    />
  );
}
