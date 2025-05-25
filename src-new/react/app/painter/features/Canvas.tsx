import React, { useRef, useEffect, useState } from 'react';
import type { PainterPointer } from '../../../hooks/usePainterPointer';
import type { SelectionState, SelectionRect } from '../../../hooks/useSelectionState';
import type { PainterView } from 'src-new/types/painter-types';
import type { Layer } from 'src-new/types/painter-types';
import { useLayersStore } from '../../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../../obsidian-api/zustand/store/painter-history-store';

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
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = pointer.color;
    }
    ctx.lineWidth = pointer.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();

    const updatedLayers = [...layers];
    updatedLayers[currentLayerIndex] = { ...layers[currentLayerIndex] };
    setLayers(updatedLayers);
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
    } else if (pointer.tool === 'hand' && panningRef.current && containerRef.current) {
      containerRef.current.scrollLeft -= e.clientX - panLastRef.current.x;
      containerRef.current.scrollTop -= e.clientY - panLastRef.current.y;
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
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
