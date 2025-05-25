import React, { useRef, useEffect } from 'react';
import { hslToRgb } from './color';

interface ColorWheelProps {
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (h: number, s: number, l: number) => void;
  size?: number;
}

function lightnessFromPosition(s: number, v: number): number {
  // When saturation is 0, brightness ranges from 0 to 100.
  // At saturation 1, brightness should range from 0 to 50.
  return v * (100 - 50 * s);
}

function verticalFromLightness(s: number, l: number): number {
  const denom = 100 - 50 * s;
  if (denom <= 0) return 0;
  return l / denom;
}

export default function ColorWheel({ hue, saturation, lightness, onChange, size = 100 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<'hue' | 'sl' | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = size / 2;
    const ringWidth = size * 0.15;
    const innerRadius = radius - ringWidth;
    const squareSize = innerRadius * Math.SQRT2;
    const halfSquare = squareSize / 2;

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
        if (dist >= innerRadius) {
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += Math.PI * 2;
          const h = (angle * 180) / Math.PI;
          const { r, g, b } = hslToRgb(h, 100, 50);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        } else if (Math.abs(dx) <= halfSquare && Math.abs(dy) <= halfSquare) {
          const sat = (dx + halfSquare) / squareSize;
          const v = 1 - (dy + halfSquare) / squareSize;
          const light = lightnessFromPosition(sat, v);
          const { r, g, b } = hslToRgb(hue, sat * 100, light);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        } else {
          data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(image, 0, 0);

    const hueRad = (hue * Math.PI) / 180;
    const ringRadius = radius - ringWidth / 2;
    const hx = radius + ringRadius * Math.cos(hueRad);
    const hy = radius + ringRadius * Math.sin(hueRad);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 4, 0, Math.PI * 2);
    ctx.stroke();

    const sx = radius - halfSquare + saturation * squareSize;
    const vPos = verticalFromLightness(saturation, lightness);
    const sy = radius - halfSquare + (1 - vPos) * squareSize;
    ctx.strokeRect(sx - 3, sy - 3, 6, 6);
  }, [hue, saturation, lightness, size]);

  function getArea(x: number, y: number) {
    const radius = size / 2;
    const ringWidth = size * 0.15;
    const innerRadius = radius - ringWidth;
    const dist = Math.sqrt(x * x + y * y);
    if (dist >= innerRadius && dist <= radius) return 'hue';
    if (dist < innerRadius) return 'sl';
    return null;
  }

  function updateColorFromEvent(e: React.MouseEvent<HTMLCanvasElement>, area: 'hue' | 'sl') {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const radius = size / 2;
    const ringWidth = size * 0.15;
    const innerRadius = radius - ringWidth;

    if (area === 'hue') {
      let angle = Math.atan2(y, x);
      if (angle < 0) angle += Math.PI * 2;
      onChange((angle * 180) / Math.PI, saturation, lightness);
    } else {
      const squareSize = innerRadius * Math.SQRT2;
      const halfSquare = squareSize / 2;
      const clampedX = Math.max(-halfSquare, Math.min(halfSquare, x));
      const clampedY = Math.max(-halfSquare, Math.min(halfSquare, y));
      const sat = (clampedX + halfSquare) / squareSize;
      const v = 1 - (clampedY + halfSquare) / squareSize;
      const light = lightnessFromPosition(sat, v);
      onChange(hue, sat, light);
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const area = getArea(x, y);
    if (!area) return;
    activeRef.current = area;
    updateColorFromEvent(e, area);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!activeRef.current) return;
    updateColorFromEvent(e, activeRef.current);
  }

  function handleMouseUp() {
    activeRef.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="cursor-crosshair rounded-full select-none"
    />
  );
}
