import React, { useEffect, useRef, useState } from 'react';
import { useLayersStore } from '../../../../obsidian-api/zustand/storage/layers-store';
import { usePainterHistoryStore } from '../../../../obsidian-api/zustand/store/painter-history-store';
import type { Layer } from 'src-new/types/painter-types';
import { t } from '../../../../constants/obsidian-i18n';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TransformEditOverlayProps {
  rect: SelectionRect;
  layers: Layer[];
  currentLayerIndex: number;
  onFinish: () => void;
}

export default function TransformEditOverlay({ rect, layers, currentLayerIndex, onFinish }: TransformEditOverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDraggingRef = useRef(false);
  const startVRef = useRef({ x: 0, y: 0 });
  const startDistRef = useRef(1);
  const startAngleRef = useRef(0);
  const startScaleRef = useRef(1);
  const startRotationRef = useRef(0);

  useEffect(() => {
    const layer = layers[currentLayerIndex];
    if (!layer) return;
    const ctx = layer.canvas.getContext('2d');
    const overlayCanvas = overlayCanvasRef.current;
    if (!ctx || !overlayCanvas) return;

    const backup = document.createElement('canvas');
    backup.width = rect.width;
    backup.height = rect.height;
    const bctx = backup.getContext('2d');
    if (!bctx) return;
    bctx.drawImage(
      layer.canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );
    backupCanvasRef.current = backup;

    overlayCanvas.width = rect.width;
    overlayCanvas.height = rect.height;
    const octx = overlayCanvas.getContext('2d');
    if (!octx) return;
    octx.drawImage(
      layer.canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );

    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
  }, [rect, currentLayerIndex]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      canvas.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}rad)`;
    }
  }, [offset, scale, rotation]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setOffset(prev => {
        const nx = prev.x + e.clientX - dragStartRef.current.x;
        const ny = prev.y + e.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return { x: nx, y: ny };
      });
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const confirm = () => {
    const layer = layers[currentLayerIndex];
    const ctx = layer.canvas.getContext('2d');
    const overlayCanvas = overlayCanvasRef.current;
    if (!ctx || !overlayCanvas) return;

    ctx.save();
    ctx.translate(rect.x + rect.width / 2 + offset.x, rect.y + rect.height / 2 + offset.y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.drawImage(overlayCanvas, -rect.width / 2, -rect.height / 2);
    ctx.restore();

    const layersStore = useLayersStore.getState();
    const historyStore = usePainterHistoryStore.getState();
    historyStore.saveHistory(layersStore.layers, currentLayerIndex);
    layersStore.updateLayers([...layersStore.layers]);
    onFinish();
  };

  const cancel = () => {
    const layer = layers[currentLayerIndex];
    const ctx = layer.canvas.getContext('2d');
    const backup = backupCanvasRef.current;
    if (!ctx || !backup) return;
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    ctx.drawImage(backup, rect.x, rect.y);
    const layersStore = useLayersStore.getState();
    layersStore.updateLayers([...layersStore.layers]);
    onFinish();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onHandleDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!overlayCanvasRef.current) return;
    handleDraggingRef.current = true;
    const r = overlayCanvasRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const vx = e.clientX - cx;
    const vy = e.clientY - cy;
    startVRef.current = { x: vx, y: vy };
    startDistRef.current = Math.hypot(vx, vy);
    startAngleRef.current = Math.atan2(vy, vx);
    startScaleRef.current = scale;
    startRotationRef.current = rotation;

    const handleMove = (ev: PointerEvent) => {
      if (!handleDraggingRef.current || !overlayCanvasRef.current) return;
      const rect2 = overlayCanvasRef.current.getBoundingClientRect();
      const cx2 = rect2.left + rect2.width / 2;
      const cy2 = rect2.top + rect2.height / 2;
      const vx2 = ev.clientX - cx2;
      const vy2 = ev.clientY - cy2;
      const dist = Math.hypot(vx2, vy2);
      const angle = Math.atan2(vy2, vx2);
      setScale(startScaleRef.current * (dist / startDistRef.current));
      setRotation(startRotationRef.current + (angle - startAngleRef.current));
    };

    const handleUp = () => {
      handleDraggingRef.current = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      className="absolute z-50"
      style={{ left: rect.x, top: rect.y }}
      onPointerDown={onPointerDown}
    >
      <canvas
        ref={overlayCanvasRef}
        style={{ pointerEvents: 'none', border: '1px dashed var(--color-accent)' }}
      />
      <div className="absolute left-0 -top-7 flex gap-1 bg-secondary border border-modifier-border p-1 rounded">
        <button className="px-2 py-1 text-xs" onClick={confirm}>{t('CONFIRM')}</button>
        <button className="px-2 py-1 text-xs" onClick={cancel}>{t('CANCEL')}</button>
      </div>
      <div
        className="absolute w-4 h-4 bg-background border-2 border-accent rounded-full cursor-grab"
        style={{ right: '-8px', bottom: '-8px' }}
        onPointerDown={onHandleDown}
      />
    </div>
  );
}
