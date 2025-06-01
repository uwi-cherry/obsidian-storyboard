import * as spectral from 'spectral.js';

/**
 * HEXからRGBに変換
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * RGBからHEXに変換
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 通常の色混合（RGB値の平均）
 */
export function mixColorsNormal(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

  return rgbToHex(r, g, b);
}

/**
 * スペクトラル混色（絵の具のような物理的な混色）
 */
export function mixSpectralColors(color1: string, color2: string, ratio: number): string {
  try {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return color1;

    // spectral.jsの正しい使用方法
    const spectral1 = new spectral.Color([rgb1.r, rgb1.g, rgb1.b]);
    const spectral2 = new spectral.Color([rgb2.r, rgb2.g, rgb2.b]);

    // 混色比率を正しく適用
    const mixed = spectral.mix([spectral1, 1 - ratio], [spectral2, ratio]);

    // 結果をHEX形式に変換
    const result = mixed.toString();

    // spectral.jsの結果が#で始まらない場合は追加
    return result.startsWith('#') ? result : '#' + result;
  } catch (error) {
    console.error('スペクトラル混色エラー:', error);
    // エラーの場合は通常混色にフォールバック
    return mixColorsNormal(color1, color2, ratio);
  }
}

/**
 * 2色が十分に異なるか判定
 */
export function isColorDifferent(color1: string, color2: string): boolean {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return false;
  const threshold = 30;
  return (
    Math.abs(rgb1.r - rgb2.r) > threshold ||
    Math.abs(rgb1.g - rgb2.g) > threshold ||
    Math.abs(rgb1.b - rgb2.b) > threshold
  );
}

/**
 * 複数色を均等に混色
 */
export function blendMultipleColors(colors: string[], mode: 'normal' | 'spectral'): string {
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];

  let result = colors[0];
  for (let i = 1; i < colors.length; i++) {
    const ratio = 1 / (i + 1);
    result = mode === 'spectral'
      ? mixSpectralColors(result, colors[i], ratio)
      : mixColorsNormal(result, colors[i], ratio);
  }
  return result;
}

/**
 * 複数色の平均色を求める
 */
export function averageColors(colors: string[], mode: 'normal' | 'spectral'): string {
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];

  let result = colors[0];
  for (let i = 1; i < colors.length; i++) {
    result = mode === 'spectral'
      ? mixSpectralColors(result, colors[i], 0.5)
      : mixColorsNormal(result, colors[i], 0.5);
  }
  return result;
}

import type { PainterPointer } from './usePainterPointer';

export function drawWithEraseSoft(
  ctx: CanvasRenderingContext2D,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  pointer: PainterPointer
) {
  const opacity = pointer.brushOpacity / 100;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth = pointer.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(fromPos.x, fromPos.y);
  ctx.lineTo(toPos.x, toPos.y);
  ctx.stroke();

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
}

export function drawWithColorAndOpacity(
  ctx: CanvasRenderingContext2D,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  pointer: PainterPointer
) {
  const brushRadius = pointer.lineWidth / 2;
  const opacity = pointer.brushOpacity / 100;
  const distance = Math.sqrt((toPos.x - fromPos.x) ** 2 + (toPos.y - fromPos.y) ** 2);
  const steps = Math.max(1, Math.floor(distance));

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = fromPos.x + (toPos.x - fromPos.x) * t;
    const y = fromPos.y + (toPos.y - fromPos.y) * t;

    const imageData = ctx.getImageData(
      Math.max(0, x - brushRadius),
      Math.max(0, y - brushRadius),
      Math.min(pointer.lineWidth, ctx.canvas.width - (x - brushRadius)),
      Math.min(pointer.lineWidth, ctx.canvas.height - (y - brushRadius))
    );

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let finalColor = pointer.color;

    if (pointer.mixRatio < 100) {
      const existingColors: string[] = [];
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const idx = (py * width + px) * 4;
          const alpha = data[idx + 3];
          if (alpha > 0) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const hex = `#${r.toString(16).padStart(2, '0')}${g
              .toString(16)
              .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            existingColors.push(hex);
          }
        }
      }

      if (existingColors.length > 0) {
        const blendMode = pointer.drawingMode === 'spectral' ? 'spectral' : 'normal';
        const avgExistingColor = averageColors(existingColors, blendMode);
        const ratio = pointer.mixRatio / 100;
        finalColor =
          blendMode === 'spectral'
            ? mixSpectralColors(avgExistingColor, pointer.color, ratio)
            : mixColorsNormal(avgExistingColor, pointer.color, ratio);
      }
    }

    const blendIntensity = pointer.blendStrength / 100;

    if (blendIntensity > 0) {
      const effectRadius = brushRadius * Math.max(0.3, blendIntensity);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, effectRadius);
      gradient.addColorStop(0, finalColor + Math.floor(255 * opacity).toString(16).padStart(2, '0'));
      gradient.addColorStop(
        0.7,
        finalColor + Math.floor(255 * opacity * blendIntensity * 0.8).toString(16).padStart(2, '0')
      );
      gradient.addColorStop(1, finalColor + '00');

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, effectRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = finalColor;
      ctx.lineWidth = pointer.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      return;
    }
  }
}

export function blendExistingColors(
  ctx: CanvasRenderingContext2D,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  pointer: PainterPointer
) {
  const brushRadius = pointer.lineWidth / 2;
  const blendIntensity = pointer.blendStrength / 100;
  if (blendIntensity === 0) return;

  const distance = Math.sqrt((toPos.x - fromPos.x) ** 2 + (toPos.y - fromPos.y) ** 2);
  const steps = Math.max(1, Math.floor(distance));

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = fromPos.x + (toPos.x - fromPos.x) * t;
    const y = fromPos.y + (toPos.y - fromPos.y) * t;

    const imageData = ctx.getImageData(
      Math.max(0, x - brushRadius),
      Math.max(0, y - brushRadius),
      Math.min(pointer.lineWidth, ctx.canvas.width - (x - brushRadius)),
      Math.min(pointer.lineWidth, ctx.canvas.height - (y - brushRadius))
    );

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const adjacentColors = new Set<string>();

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = (py * width + px) * 4;
        const alpha = data[idx + 3];

        if (alpha > 0) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const hex = `#${r.toString(16).padStart(2, '0')}${g
            .toString(16)
            .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

          const neighbors = [
            [px - 1, py],
            [px + 1, py],
            [px, py - 1],
            [px, py + 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4;
              const nAlpha = data[nIdx + 3];

              if (nAlpha > 0) {
                const nr = data[nIdx];
                const ng = data[nIdx + 1];
                const nb = data[nIdx + 2];
                const nHex = `#${nr.toString(16).padStart(2, '0')}${ng
                  .toString(16)
                  .padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;

                if (hex !== nHex && isColorDifferent(hex, nHex)) {
                  adjacentColors.add(hex);
                  adjacentColors.add(nHex);
                }
              }
            }
          }
        }
      }
    }

    if (adjacentColors.size === 0) return;

    const colorsArray = Array.from(adjacentColors);
    let resultColor: string;

    if (colorsArray.length === 1) {
      resultColor = colorsArray[0];
    } else if (colorsArray.length === 2) {
      const blendMode = pointer.drawingMode === 'spectral' ? 'spectral' : 'normal';
      resultColor =
        blendMode === 'spectral'
          ? mixSpectralColors(colorsArray[0], colorsArray[1], 0.5)
          : mixColorsNormal(colorsArray[0], colorsArray[1], 0.5);
    } else {
      const blendMode = pointer.drawingMode === 'spectral' ? 'spectral' : 'normal';
      resultColor = blendMultipleColors(colorsArray, blendMode);
    }

    const effectRadius = brushRadius * blendIntensity;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, effectRadius);
    gradient.addColorStop(0, resultColor);
    gradient.addColorStop(
      0.6,
      resultColor + Math.floor(255 * blendIntensity * 0.7).toString(16).padStart(2, '0')
    );
    gradient.addColorStop(1, resultColor + '00');

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, effectRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 色混合のhook
 */
export default function useColorMixing() {
  return {
    mixColorsNormal,
    mixSpectralColors,
    isColorDifferent,
    blendMultipleColors,
    averageColors
  };
}

export {
  drawWithEraseSoft,
  drawWithColorAndOpacity,
  blendExistingColors
};
