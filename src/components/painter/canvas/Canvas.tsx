import { useRef, useState, useEffect } from "react";
import { PainterPointer, getPointerPos } from "src/hooks/usePainterPointer";
import { SelectionState } from "src/hooks/useSelectionState";
import {
  drawWithEraseSoft,
  drawWithColorAndOpacity,
  blendExistingColors
} from "src/hooks/useSpectralColor";
import { useLayersStore } from "src/storage/layers-store";
import { useCurrentLayerIndexStore } from "src/store/current-layer-index-store";
import { usePainterHistoryStore } from "src/store/painter-history-store";
import { PainterView } from "src/types/painter-types";


interface CanvasProps {
  view?: PainterView;
  pointer: PainterPointer;
  zoom: number;
  rotation: number;
  containerRef: React.RefObject<HTMLDivElement>;
  selectionState: SelectionState;
  canvasSize?: { width: number; height: number };
  onActualZoomChange?: (actualZoom: number) => void;
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
  canvasSize: propCanvasSize,
  onActualZoomChange,
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

  const startAnimation = () => {
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    const animate = () => {
      if (
        selectionState.hasSelection() ||
        selectionState.tempRect ||
        selectionState.tempLassoPoints.length > 0
      ) {
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
    if (['pen', 'brush', 'paint-brush', 'color-mixer', 'eraser', 'selection'].includes(pointer.tool)) {
      canvas.style.cursor = 'crosshair';
    } else if (pointer.tool === 'hand') {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [pointer.tool]);

  useEffect(() => {
    if (propCanvasSize) {
      // CanvasContainerから渡されたサイズを優先
      setCanvasSize(propCanvasSize);
    } else if (view?._painterData?.canvasWidth && view?._painterData?.canvasHeight) {
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
  }, [propCanvasSize, view, layers]);

  // キャンバス要素のサイズを更新
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
    }
  }, [canvasSize]);

  // ズームが変更された時にタイトルを更新
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const actualZoom = Math.round((rect.width / canvasSize.width) * zoom);
      
      // タイトルを更新
      if (view && view.updateTitle) {
        view.updateTitle(canvasSize.width, canvasSize.height, actualZoom);
      }
      
      // 実際のズーム値を通知
      if (onActualZoomChange) {
        onActualZoomChange(actualZoom);
      }
    } else {
      // キャンバスがない場合は設定値をそのまま使用
      if (view && view.updateTitle) {
        view.updateTitle(canvasSize.width, canvasSize.height, zoom);
      }
      if (onActualZoomChange) {
        onActualZoomChange(zoom);
      }
    }
  }, [zoom, canvasSize, view, onActualZoomChange]);

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
      layers.forEach((layer: import('src/types/painter-types').Layer, index: number) => {
        if (layer.visible && layer.canvas) {
          const originalAlpha = ctx.globalAlpha;
          ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

          const originalCompositeOperation = ctx.globalCompositeOperation;
          if (layer.blendMode && layer.blendMode !== 'normal') {
            try {
              ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
            } catch (e) {
              console.error(e);
            }
          }

          try {
            if (layer.clippingMask && index > 0) {
              const temp = document.createElement('canvas');
              temp.width = layer.canvas.width;
              temp.height = layer.canvas.height;
              const tctx = temp.getContext('2d');
              if (tctx) {
                tctx.drawImage(layer.canvas, 0, 0);
                tctx.globalCompositeOperation = 'destination-in';
                tctx.drawImage(layers[index - 1].canvas, 0, 0);
                ctx.drawImage(temp, 0, 0);
              }
            } else {
              ctx.drawImage(layer.canvas, 0, 0);
            }
          } catch (error) {
            console.error(error);
          }

          ctx.globalAlpha = originalAlpha;
          ctx.globalCompositeOperation = originalCompositeOperation;
        }
      });
    }

    // 選択領域の描画（既存選択 + 編集中の選択）
    const hasExistingSelection = selectionState.hasSelection();
    const hasActiveSelection = selectionState.tempRect || selectionState.tempLassoPoints.length > 0;
    
    if (hasExistingSelection || hasActiveSelection) {
      ctx.save();
      ctx.setLineDash([6]);
      ctx.lineDashOffset = -dashOffsetRef.current;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      
      // 既存の統一された選択領域の描画
      if (selectionState.selectionOutline) {
        ctx.stroke(selectionState.selectionOutline);
      }
      
      // 編集中の一時選択の描画
      if (selectionState.mode === 'rect' && selectionState.tempRect) {
        const r = selectionState.tempRect;
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width, r.height);
      } else if (selectionState.mode === 'lasso' && selectionState.tempLassoPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(selectionState.tempLassoPoints[0].x + 0.5, selectionState.tempLassoPoints[0].y + 0.5);
        for (let i = 1; i < selectionState.tempLassoPoints.length; i++) {
          const p = selectionState.tempLassoPoints[i];
          ctx.lineTo(p.x + 0.5, p.y + 0.5);
        }
        ctx.closePath();
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }, [layers, currentLayerIndex, selectionState, selectionState.version, animationTick, canvasSize]);


  const drawOnCurrentLayer = (fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
    if (!layers[currentLayerIndex] || !layers[currentLayerIndex].canvas) return;

    const layerCanvas = layers[currentLayerIndex].canvas;
    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;

    if (pointer.tool === 'eraser' && pointer.drawingMode !== 'erase-soft') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = pointer.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
    } else if (['pen', 'brush', 'paint-brush', 'color-mixer', 'eraser'].includes(pointer.tool)) {
      if (pointer.drawingMode === 'erase-soft') {
        // ソフト消しゴムモード
        drawWithEraseSoft(ctx, fromPos, toPos, pointer);
      } else if (pointer.brushOpacity === 0) {
        // 透明度0%の場合：にじみツール（隣接する異なる色を混色）
        blendExistingColors(ctx, fromPos, toPos, pointer);
      } else {
        // 通常描画・スペクトラル混色（透明度適用）
        drawWithColorAndOpacity(ctx, fromPos, toPos, pointer);
      }
    }

    const updatedLayers = [...layers];
    updatedLayers[currentLayerIndex] = { ...layers[currentLayerIndex] };
    setLayers(updatedLayers);
  };


  // 色関連のユーティリティはuseSpectralColorから利用



  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPointerPos(canvasRef.current, e);

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();

    if (pointer.tool === 'selection') {
      // 選択モードが変更された場合、新しいモードに設定
      if (selectionState.mode !== pointer.selectionMode) {
        selectionState.setMode(pointer.selectionMode);
      }
      
      if (pointer.selectionMode === 'magic') {
        selectionState.reset();
        if (canvasRef.current) {
          selectionState.computeMagicSelection(canvasRef.current, x, y);
        }
        onSelectionUpdate?.();
        onSelectionEnd?.();
        startAnimation();
        return;
      } else if (
        pointer.selectionMode === 'select-pen' ||
        pointer.selectionMode === 'select-eraser'
      ) {
        selectingRef.current = true;
        lastPosRef.current = { x, y };
        selectionState.updateMaskSelection(
          canvasSize,
          { x, y },
          { x, y },
          pointer.selectionMode,
          pointer.lineWidth
        );
        onSelectionUpdate?.();
        onSelectionStart?.();
        startAnimation();
        return;
      }
      selectingRef.current = true;
      startXRef.current = x;
      startYRef.current = y;
      if (pointer.selectionMode === 'rect') {
        selectionState.tempRect = { x, y, width: 0, height: 0 };
        selectionState.tempLassoPoints = [];
      } else {
        selectionState.tempLassoPoints = [{ x, y }];
        selectionState.tempRect = undefined;
      }
      onSelectionUpdate?.();
      onSelectionStart?.();
      startAnimation();
    } else if (['pen', 'brush', 'paint-brush', 'color-mixer', 'eraser'].includes(pointer.tool)) {
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

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPointerPos(canvasRef.current, e);

    if (pointer.tool === 'selection' && selectingRef.current) {
      if (selectionState.mode === 'rect') {
        const x0 = Math.min(startXRef.current, x);
        const y0 = Math.min(startYRef.current, y);
        const w = Math.abs(x - startXRef.current);
        const h = Math.abs(y - startYRef.current);
        selectionState.tempRect = { x: x0, y: y0, width: w, height: h };
      } else if (selectionState.mode === 'lasso') {
        selectionState.tempLassoPoints.push({ x, y });
      } else if (
        (selectionState.mode === 'select-pen' || selectionState.mode === 'select-eraser') &&
        lastPosRef.current
      ) {
        selectionState.updateMaskSelection(
          canvasSize,
          lastPosRef.current,
          { x, y },
          selectionState.mode,
          pointer.lineWidth
        );
        lastPosRef.current = { x, y };
      }
      onSelectionUpdate?.();
    } else if (['pen', 'brush', 'paint-brush', 'color-mixer', 'eraser'].includes(pointer.tool) && drawingRef.current && lastPosRef.current) {
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

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPointerPos(canvasRef.current, e);
    if (pointer.tool === 'selection') {
      if (pointer.selectionMode === 'magic') {
        onSelectionEnd?.();
        return;
      }
      if (!selectingRef.current) return;
      selectingRef.current = false;
      if (selectionState.mode === 'select-pen' || selectionState.mode === 'select-eraser') {
        if (lastPosRef.current) {
          selectionState.updateMaskSelection(
            canvasSize,
            lastPosRef.current,
            { x, y },
            selectionState.mode,
            pointer.lineWidth
          );
          lastPosRef.current = null;
        }
        onSelectionEnd?.();
      } else {
        let valid = false;
        if (selectionState.mode === 'rect') {
          valid = !!(
            selectionState.tempRect &&
            selectionState.tempRect.width > 2 &&
            selectionState.tempRect.height > 2
          );
          if (valid && selectionState.tempRect) {
            // 矩形選択を統一された選択領域に変換
            const clipPath = new Path2D();
            clipPath.rect(selectionState.tempRect.x, selectionState.tempRect.y, selectionState.tempRect.width, selectionState.tempRect.height);
            const outlinePath = new Path2D();
            outlinePath.rect(selectionState.tempRect.x + 0.5, selectionState.tempRect.y + 0.5, selectionState.tempRect.width, selectionState.tempRect.height);
            
            selectionState.selectionClipPath = clipPath;
            selectionState.selectionOutline = outlinePath;
            selectionState.selectionBounding = { ...selectionState.tempRect };
            selectionState.tempRect = undefined;
          }
        } else {
          if (selectionState.tempLassoPoints.length > 2) {
            selectionState.tempLassoPoints.push(selectionState.tempLassoPoints[0]);
          }
          valid = selectionState.tempLassoPoints.length > 2;
          if (valid) {
            // ラッソ選択を統一された選択領域に変換
            const clipPath = new Path2D();
            const outlinePath = new Path2D();
            
            clipPath.moveTo(selectionState.tempLassoPoints[0].x, selectionState.tempLassoPoints[0].y);
            outlinePath.moveTo(selectionState.tempLassoPoints[0].x + 0.5, selectionState.tempLassoPoints[0].y + 0.5);
            
            let minX = selectionState.tempLassoPoints[0].x, maxX = selectionState.tempLassoPoints[0].x;
            let minY = selectionState.tempLassoPoints[0].y, maxY = selectionState.tempLassoPoints[0].y;
            
            for (let i = 1; i < selectionState.tempLassoPoints.length; i++) {
              const p = selectionState.tempLassoPoints[i];
              clipPath.lineTo(p.x, p.y);
              outlinePath.lineTo(p.x + 0.5, p.y + 0.5);
              minX = Math.min(minX, p.x);
              maxX = Math.max(maxX, p.x);
              minY = Math.min(minY, p.y);
              maxY = Math.max(maxY, p.y);
            }
            clipPath.closePath();
            outlinePath.closePath();
            
            selectionState.selectionClipPath = clipPath;
            selectionState.selectionOutline = outlinePath;
            selectionState.selectionBounding = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            };
            selectionState.tempLassoPoints = [];
          }
        }
        if (!valid) {
          selectionState.reset();
          stopAnimation();
          onSelectionUpdate?.();
          onSelectionEnd?.();
        } else {
          onSelectionEnd?.();
        }
      }
    } else if (['pen', 'brush', 'paint-brush', 'color-mixer', 'eraser'].includes(pointer.tool)) {
      drawingRef.current = false;
      lastPosRef.current = null;
    } else if (pointer.tool === 'hand') {
      panningRef.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleDoubleClick = () => {
    if (pointer.tool === 'selection') {
      selectionState.reset();
      stopAnimation();
      onSelectionUpdate?.();
      onSelectionEnd?.();
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
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  );
}
