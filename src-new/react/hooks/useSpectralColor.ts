import * as spectral from 'spectral.js';

/**
 * HEXからRGBに変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
function rgbToHex(r: number, g: number, b: number): string {
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
 * 色混合のhook
 */
export default function useColorMixing() {
  return {
    mixColorsNormal,
    mixSpectralColors
  };
} 