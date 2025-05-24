import React, { useRef, useEffect, useState } from 'react';
import type { PainterPointer } from '../../../hooks/usePainterPointer';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasProps {
  layers?: any[];
  currentLayerIndex?: number;
  setLayers?: (layers: any[]) => void;
  view?: any;
  pointer: PainterPointer;
  selectionRect?: SelectionRect;
  onSelectionStart?: () => void;
  onSelectionUpdate?: (rect: SelectionRect) => void;
  onSelectionEnd?: (rect: SelectionRect | undefined) => void;
}

export default function Canvas({
  layers = [],
  currentLayerIndex = 0,
  setLayers,
  view,
  pointer,
  selectionRect,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionEnd
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // レイヤーを描画
    if (layers && layers.length > 0) {
      layers.forEach((layer: any) => {
        if (layer.visible && layer.imageData) {
          // 実際の描画ロジックはここに実装
        }
      });
    }

    // 選択範囲描画
    if (selectionRect) {
      ctx.save();
      ctx.setLineDash([6]);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(selectionRect.x + 0.5, selectionRect.y + 0.5, selectionRect.width, selectionRect.height);
      ctx.restore();
    }
  }, [layers, currentLayerIndex, selectionRect]);

  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pointer.tool === 'selection') {
      const { x, y } = getPointerPos(e);
      selectingRef.current = true;
      startXRef.current = x;
      startYRef.current = y;
      onSelectionUpdate?.({ x, y, width: 0, height: 0 });
      onSelectionStart?.();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointer.tool === 'selection') {
      const { x, y } = getPointerPos(e);
      if (!selectingRef.current) return;
      const x0 = Math.min(startXRef.current, x);
      const y0 = Math.min(startYRef.current, y);
      const w = Math.abs(x - startXRef.current);
      const h = Math.abs(y - startYRef.current);
      onSelectionUpdate?.({ x: x0, y: y0, width: w, height: h });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointer.tool === 'selection') {
      if (!selectingRef.current) return;
      selectingRef.current = false;
      if (selectionRect && selectionRect.width >= 2 && selectionRect.height >= 2) {
        onSelectionEnd?.(selectionRect);
      } else {
        onSelectionUpdate?.(undefined as any);
        onSelectionEnd?.(undefined);
      }
    }
  };

  return (
    <div className="flex-1 bg-background overflow-hidden relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-modifier-border"
        style={{ display: 'block', margin: '0 auto' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
