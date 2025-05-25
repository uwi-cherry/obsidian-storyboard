import React, { useRef, useEffect, useState } from 'react';
import type { PainterPointer } from '../../../hooks/usePainterPointer';
import type { SelectionState, SelectionRect } from '../../../hooks/useSelectionState';
import type { PainterView } from 'src-new/types/painter-types';
import type { Layer } from 'src-new/types/painter-types';
import { useLayersStore } from '../../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../../obsidian-api/zustand/store/painter-history-store';
import { mixSpectralColors, mixColorsNormal } from '../../../hooks/useSpectralColor';

interface CanvasProps {
  view?: PainterView;
  pointer: PainterPointer;
  zoom: number;
  rotation: number;
  containerRef: React.RefObject<HTMLDivElement>;
  selectionState: SelectionState;
  onSelectionStart?: () => void;
  onSelectionUpdate?: () => void;
  onSelectionEnd?: () => void;
}

export default function Canvas({
  view,
  pointer,
  zoom,
  rotation,
  containerRef,
  selectionState,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionEnd
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const layers = useLayersStore((state) => state.layers);
  const currentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);
  const { updateLayers: setLayers } = useLayersStore();

  const dashOffsetRef = useRef(0);
  const animIdRef = useRef<number>();
  const [animationTick, setAnimationTick] = useState(0);
  const TOLERANCE = 32;

  const startAnimation = () => {
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    const animate = () => {
      if (selectionState.hasSelection()) {
        dashOffsetRef.current = (dashOffsetRef.current + 0.5) % 12;
        setAnimationTick(t => t + 1);
        animIdRef.current = requestAnimationFrame(animate);
      }
    };
    animIdRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = undefined;
    }
  };

  const selectingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const panningRef = useRef(false);
  const panLastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (['brush', 'eraser', 'selection'].includes(pointer.tool)) {
      canvas.style.cursor = 'crosshair';
    } else if (pointer.tool === 'hand') {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [pointer.tool]);

  useEffect(() => {
    if (view?._painterData?.canvasWidth && view?._painterData?.canvasHeight) {
      setCanvasSize({
        width: view._painterData.canvasWidth,
        height: view._painterData.canvasHeight
      });
    } else if (layers.length > 0 && layers[0].canvas) {
      setCanvasSize({
        width: layers[0].canvas.width || 800,
        height: layers[0].canvas.height || 600
      });
    }
  }, [view, layers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const checkSize = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    for (let y = 0; y < canvas.height; y += checkSize * 2) {
      for (let x = 0; x < canvas.width; x += checkSize * 2) {
        ctx.fillRect(x + checkSize, y, checkSize, checkSize);
        ctx.fillRect(x, y + checkSize, checkSize, checkSize);
      }
    }

    if (layers && layers.length > 0) {
      layers.forEach((layer: Layer, index: number) => {
        if (layer.visible && layer.canvas) {
          
          const originalAlpha = ctx.globalAlpha;
          ctx.globalAlpha = layer.opacity || 1;
          
          const originalCompositeOperation = ctx.globalCompositeOperation;
          if (layer.blendMode && layer.blendMode !== 'normal') {
            try {
              ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
            } catch (e) {
              console.error(e);
            }
          }
          
          try {
            ctx.drawImage(layer.canvas, 0, 0);
          } catch (error) {
            console.error(error);
          }
          
          ctx.globalAlpha = originalAlpha;
          ctx.globalCompositeOperation = originalCompositeOperation;
        }
      });
    } else {
    }

    if (selectionState.hasSelection()) {
      ctx.save();
      ctx.setLineDash([6]);
      ctx.lineDashOffset = -dashOffsetRef.current;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      if (selectionState.mode === 'rect' && selectionState.selectionRect) {
        const r = selectionState.selectionRect;
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width, r.height);
      } else if (selectionState.mode === 'lasso' && selectionState.lassoPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(selectionState.lassoPoints[0].x + 0.5, selectionState.lassoPoints[0].y + 0.5);
        for (let i = 1; i < selectionState.lassoPoints.length; i++) {
          const p = selectionState.lassoPoints[i];
          ctx.lineTo(p.x + 0.5, p.y + 0.5);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (selectionState.mode === 'magic' && selectionState.magicOutline) {
        ctx.stroke(selectionState.magicOutline);
      }
      ctx.restore();
    }
  }, [layers, currentLayerIndex, selectionState, animationTick, canvasSize]);

  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const drawOnCurrentLayer = (fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
    if (!layers[currentLayerIndex] || !layers[currentLayerIndex].canvas) return;

    const layerCanvas = layers[currentLayerIndex].canvas;
    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;

    if (pointer.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = pointer.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
    } else if (pointer.tool === 'brush') {
      if (pointer.brushOpacity === 0) {
        // 透明度0%の場合：にじみツール（隣接する異なる色を混色）
        blendExistingColors(ctx, fromPos, toPos);
      } else {
        // 透明度1%以上の場合：色付きブラシ（透明度適用）
        drawWithColorAndOpacity(ctx, fromPos, toPos);
      }
    }

    const updatedLayers = [...layers];
    updatedLayers[currentLayerIndex] = { ...layers[currentLayerIndex] };
    setLayers(updatedLayers);
  };

  const drawWithColorAndOpacity = (ctx: CanvasRenderingContext2D, fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
    const brushRadius = pointer.lineWidth / 2;
    const opacity = pointer.brushOpacity / 100;
    
    // 線の軌跡上の点を計算
    const distance = Math.sqrt((toPos.x - fromPos.x) ** 2 + (toPos.y - fromPos.y) ** 2);
    const steps = Math.max(1, Math.floor(distance));
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = fromPos.x + (toPos.x - fromPos.x) * t;
      const y = fromPos.y + (toPos.y - fromPos.y) * t;
      
      // ブラシエリア内の既存色を取得
      const imageData = ctx.getImageData(
        Math.max(0, x - brushRadius), 
        Math.max(0, y - brushRadius), 
        Math.min(pointer.lineWidth, ctx.canvas.width - (x - brushRadius)), 
        Math.min(pointer.lineWidth, ctx.canvas.height - (y - brushRadius))
      );
      
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      
      // 混色比率に基づいて色を決定
      let finalColor = pointer.color;
      
      if (pointer.mixRatio < 100) {
        // 既存色との混色が必要
        const existingColors: string[] = [];
        
        for (let py = 0; py < height; py++) {
          for (let px = 0; px < width; px++) {
            const idx = (py * width + px) * 4;
            const alpha = data[idx + 3];
            
            if (alpha > 0) {
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              existingColors.push(hex);
            }
          }
        }
        
        if (existingColors.length > 0) {
          const avgExistingColor = averageColors(existingColors, pointer.blendMode);
          const ratio = pointer.mixRatio / 100;
          finalColor = pointer.blendMode === 'spectral' 
            ? mixSpectralColors(avgExistingColor, pointer.color, ratio)
            : mixColorsNormal(avgExistingColor, pointer.color, ratio);
        }
      }
      
      // にじみ効果を適用
      const blendIntensity = pointer.blendStrength / 100;
      
      if (blendIntensity > 0) {
        // にじみ効果ありの場合：グラデーション描画
        const effectRadius = brushRadius * Math.max(0.3, blendIntensity);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, effectRadius);
        gradient.addColorStop(0, finalColor + Math.floor(255 * opacity).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.7, finalColor + Math.floor(255 * opacity * blendIntensity * 0.8).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, finalColor + '00');
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, effectRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // にじみ強度0の場合は普通の線描画（透明度適用）
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
        
        // globalAlphaをリセット
        ctx.globalAlpha = 1.0;
        return;
      }
    }
  };

  const drawWithColor = (ctx: CanvasRenderingContext2D, fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
    const brushRadius = pointer.lineWidth / 2;
    
    // 線の軌跡上の点を計算
    const distance = Math.sqrt((toPos.x - fromPos.x) ** 2 + (toPos.y - fromPos.y) ** 2);
    const steps = Math.max(1, Math.floor(distance));
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = fromPos.x + (toPos.x - fromPos.x) * t;
      const y = fromPos.y + (toPos.y - fromPos.y) * t;
      
      // ブラシエリア内の既存色を取得
      const imageData = ctx.getImageData(
        Math.max(0, x - brushRadius), 
        Math.max(0, y - brushRadius), 
        Math.min(pointer.lineWidth, ctx.canvas.width - (x - brushRadius)), 
        Math.min(pointer.lineWidth, ctx.canvas.height - (y - brushRadius))
      );
      
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      
      // 混色比率に基づいて色を決定
      let finalColor = pointer.color;
      
      if (pointer.mixRatio < 100) {
        // 既存色との混色が必要
        const existingColors: string[] = [];
        
        for (let py = 0; py < height; py++) {
          for (let px = 0; px < width; px++) {
            const idx = (py * width + px) * 4;
            const alpha = data[idx + 3];
            
            if (alpha > 0) {
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              existingColors.push(hex);
            }
          }
        }
        
        if (existingColors.length > 0) {
          const avgExistingColor = averageColors(existingColors, pointer.blendMode);
          const ratio = pointer.mixRatio / 100;
          finalColor = pointer.blendMode === 'spectral' 
            ? mixSpectralColors(avgExistingColor, pointer.color, ratio)
            : mixColorsNormal(avgExistingColor, pointer.color, ratio);
        }
      }
      
      // にじみ効果を適用
      const blendIntensity = pointer.blendStrength / 100;
      
      if (blendIntensity > 0) {
        // にじみ効果ありの場合：グラデーション描画
        const effectRadius = brushRadius * Math.max(0.3, blendIntensity);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, effectRadius);
        gradient.addColorStop(0, finalColor);
        gradient.addColorStop(0.7, finalColor + Math.floor(255 * blendIntensity * 0.8).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, finalColor + '00');
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, effectRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // にじみ強度0の場合は普通の線描画
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = finalColor;
        ctx.lineWidth = pointer.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
        return;
      }
    }
  };

  const blendExistingColors = (ctx: CanvasRenderingContext2D, fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
    const brushRadius = pointer.lineWidth / 2;
    const blendIntensity = pointer.blendStrength / 100;
    
    if (blendIntensity === 0) return; // にじみ強度0なら何もしない
    
    // 線の軌跡上の点を計算
    const distance = Math.sqrt((toPos.x - fromPos.x) ** 2 + (toPos.y - fromPos.y) ** 2);
    const steps = Math.max(1, Math.floor(distance));
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = fromPos.x + (toPos.x - fromPos.x) * t;
      const y = fromPos.y + (toPos.y - fromPos.y) * t;
      
      // ブラシエリア内の画像データを取得
      const imageData = ctx.getImageData(
        Math.max(0, x - brushRadius), 
        Math.max(0, y - brushRadius), 
        Math.min(pointer.lineWidth, ctx.canvas.width - (x - brushRadius)), 
        Math.min(pointer.lineWidth, ctx.canvas.height - (y - brushRadius))
      );
      
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      
      // 隣接する異なる色を検出
      const colorMap = new Map<string, number>();
      const adjacentColors = new Set<string>();
      
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const idx = (py * width + px) * 4;
          const alpha = data[idx + 3];
          
          if (alpha > 0) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            
            // 隣接ピクセルをチェックして異なる色を検出
            const neighbors = [
              [px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]
            ];
            
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = (ny * width + nx) * 4;
                const nAlpha = data[nIdx + 3];
                
                if (nAlpha > 0) {
                  const nr = data[nIdx];
                  const ng = data[nIdx + 1];
                  const nb = data[nIdx + 2];
                  const nHex = `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
                  
                  // 色が異なる場合は隣接色として記録
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
      
      if (adjacentColors.size === 0) return; // 隣接する異なる色がない場合は何もしない
      
      // 隣接する色同士を混色
      const colorsArray = Array.from(adjacentColors);
      let resultColor: string;
      
      if (colorsArray.length === 1) {
        resultColor = colorsArray[0];
      } else if (colorsArray.length === 2) {
        // 2色の場合：直接混色（赤+青=紫）
        resultColor = pointer.blendMode === 'spectral' 
          ? mixSpectralColors(colorsArray[0], colorsArray[1], 0.5)
          : mixColorsNormal(colorsArray[0], colorsArray[1], 0.5);
      } else {
        // 3色以上の場合：段階的に混色
        resultColor = blendMultipleColors(colorsArray, pointer.blendMode);
      }
      
      // にじみ効果で描画
      const effectRadius = brushRadius * blendIntensity;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, effectRadius);
      gradient.addColorStop(0, resultColor);
      gradient.addColorStop(0.6, resultColor + Math.floor(255 * blendIntensity * 0.7).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, resultColor + '00');
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, effectRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 色が十分に異なるかどうかを判定
  const isColorDifferent = (color1: string, color2: string): boolean => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return false;
    
    // RGB値の差が一定以上なら異なる色とみなす
    const threshold = 30;
    return Math.abs(rgb1.r - rgb2.r) > threshold ||
           Math.abs(rgb1.g - rgb2.g) > threshold ||
           Math.abs(rgb1.b - rgb2.b) > threshold;
  };

  // HEXからRGBに変換（ローカル関数）
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // 複数色の混色
  const blendMultipleColors = (colors: string[], mode: 'normal' | 'spectral'): string => {
    if (colors.length === 0) return '#000000';
    if (colors.length === 1) return colors[0];
    
    let result = colors[0];
    for (let i = 1; i < colors.length; i++) {
      const ratio = 1 / (i + 1); // 均等に混色
      result = mode === 'spectral' 
        ? mixSpectralColors(result, colors[i], ratio)
        : mixColorsNormal(result, colors[i], ratio);
    }
    return result;
  };

  // 色の平均を計算
  const averageColors = (colors: string[], mode: 'normal' | 'spectral'): string => {
    if (colors.length === 0) return '#000000';
    if (colors.length === 1) return colors[0];
    
    let result = colors[0];
    for (let i = 1; i < colors.length; i++) {
      result = mode === 'spectral' 
        ? mixSpectralColors(result, colors[i], 0.5)
        : mixColorsNormal(result, colors[i], 0.5);
    }
    return result;
  };

  const computeMagicSelection = (px: number, py: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    if (px < 0 || py < 0 || px >= width || py >= height) return;

    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;
    const mask = new Uint8Array(width * height);

    const toIndex = (x: number, y: number) => y * width + x;
    const toDataIndex = (x: number, y: number) => (y * width + x) * 4;

    const sx = Math.round(px);
    const sy = Math.round(py);
    const baseI = toDataIndex(sx, sy);
    const br = data[baseI];
    const bg = data[baseI + 1];
    const bb = data[baseI + 2];

    const stack: number[] = [sx, sy];
    while (stack.length) {
      const y = stack.pop();
      const x = stack.pop();
      if (x === undefined || y === undefined) break;
      const idx = toIndex(x, y);
      if (mask[idx]) continue;
      const di = idx * 4;
      const r = data[di];
      const g = data[di + 1];
      const b = data[di + 2];
      if (Math.abs(r - br) > TOLERANCE || Math.abs(g - bg) > TOLERANCE || Math.abs(b - bb) > TOLERANCE) continue;
      mask[idx] = 1;
      if (x > 0) stack.push(x - 1, y);
      if (x < width - 1) stack.push(x + 1, y);
      if (y > 0) stack.push(x, y - 1);
      if (y < height - 1) stack.push(x, y + 1);
    }

    const clipPath = new Path2D();
    const outlinePath = new Path2D();
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasSelection = false;

    const isEdge = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return false;
      const idx = toIndex(x, y);
      if (!mask[idx]) return false;
      return (
        (x === 0 || !mask[toIndex(x - 1, y)]) ||
        (x === width - 1 || !mask[toIndex(x + 1, y)]) ||
        (y === 0 || !mask[toIndex(x, y - 1)]) ||
        (y === height - 1 || !mask[toIndex(x, y + 1)])
      );
    };

    for (let y = 0; y < height; y++) {
      let segmentStart = -1;
      for (let x = 0; x < width; x++) {
        const idx = toIndex(x, y);
        if (mask[idx]) {
          hasSelection = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          clipPath.rect(x, y, 1, 1);
          const edge = isEdge(x, y);
          if (edge) {
            if (segmentStart === -1) segmentStart = x;
          } else {
            if (segmentStart !== -1) {
              outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
              outlinePath.lineTo(x + 0.5, y + 0.5);
              segmentStart = -1;
            }
          }
        } else {
          if (segmentStart !== -1) {
            outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
            outlinePath.lineTo(x + 0.5, y + 0.5);
            segmentStart = -1;
          }
        }
      }
      if (segmentStart !== -1) {
        outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
        outlinePath.lineTo(width + 0.5, y + 0.5);
      }
    }

    if (!hasSelection || minX > maxX || minY > maxY) {
      selectionState.magicClipPath = undefined;
      selectionState.magicOutline = undefined;
      selectionState.magicBounding = undefined;
      return;
    }

    selectionState.magicClipPath = clipPath;
    selectionState.magicOutline = outlinePath;
    selectionState.magicBounding = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getPointerPos(e);

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();

    if (pointer.tool === 'selection') {
      selectionState.mode = pointer.selectionMode;
      if (pointer.selectionMode === 'magic') {
        selectionState.reset();
        computeMagicSelection(x, y);
        onSelectionUpdate?.();
        onSelectionEnd?.();
        startAnimation();
        return;
      }
      selectingRef.current = true;
      startXRef.current = x;
      startYRef.current = y;
      if (pointer.selectionMode === 'rect') {
        selectionState.selectionRect = { x, y, width: 0, height: 0 };
        selectionState.lassoPoints = [];
        selectionState.magicClipPath = undefined;
        selectionState.magicOutline = undefined;
        selectionState.magicBounding = undefined;
      } else {
        selectionState.lassoPoints = [{ x, y }];
        selectionState.selectionRect = undefined;
        selectionState.magicClipPath = undefined;
        selectionState.magicOutline = undefined;
        selectionState.magicBounding = undefined;
      }
      onSelectionUpdate?.();
      onSelectionStart?.();
      startAnimation();
    } else if (pointer.tool === 'brush' || pointer.tool === 'eraser') {
      historyStore.saveHistory(layersStore.layers, currentLayerIndexStore.currentLayerIndex);

      drawingRef.current = true;
      lastPosRef.current = { x, y };
      drawOnCurrentLayer({ x, y }, { x, y });
    } else if (pointer.tool === 'hand') {
      panningRef.current = true;
      panLastRef.current = { x: e.clientX, y: e.clientY };
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getPointerPos(e);

    if (pointer.tool === 'selection' && selectingRef.current) {
      if (selectionState.mode === 'rect') {
        const x0 = Math.min(startXRef.current, x);
        const y0 = Math.min(startYRef.current, y);
        const w = Math.abs(x - startXRef.current);
        const h = Math.abs(y - startYRef.current);
        selectionState.selectionRect = { x: x0, y: y0, width: w, height: h };
      } else {
        selectionState.lassoPoints.push({ x, y });
      }
      onSelectionUpdate?.();
    } else if ((pointer.tool === 'brush' || pointer.tool === 'eraser') && drawingRef.current && lastPosRef.current) {
      drawOnCurrentLayer(lastPosRef.current, { x, y });
      lastPosRef.current = { x, y };
    } else if (pointer.tool === 'hand' && panningRef.current) {
      const deltaX = e.clientX - panLastRef.current.x;
      const deltaY = e.clientY - panLastRef.current.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      panLastRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointer.tool === 'selection') {
      if (pointer.selectionMode === 'magic') {
        onSelectionEnd?.();
        return;
      }
      if (!selectingRef.current) return;
      selectingRef.current = false;
      let valid = false;
      if (selectionState.mode === 'rect') {
        valid = !!(selectionState.selectionRect && selectionState.selectionRect.width > 2 && selectionState.selectionRect.height > 2);
      } else {
        if (selectionState.lassoPoints.length > 2) {
          selectionState.lassoPoints.push(selectionState.lassoPoints[0]);
        }
        valid = selectionState.lassoPoints.length > 2;
      }
      if (!valid) {
        selectionState.reset();
        stopAnimation();
        onSelectionUpdate?.();
        onSelectionEnd?.();
      } else {
        onSelectionEnd?.();
      }
    } else if (pointer.tool === 'brush' || pointer.tool === 'eraser') {
      drawingRef.current = false;
      lastPosRef.current = null;
    } else if (pointer.tool === 'hand') {
      panningRef.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  };

  return (
    <div className="flex flex-1 w-full h-full bg-background overflow-hidden relative">
      <div className="flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-modifier-border max-w-full max-h-full"
          style={{
            display: 'block',
            objectFit: 'contain',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
