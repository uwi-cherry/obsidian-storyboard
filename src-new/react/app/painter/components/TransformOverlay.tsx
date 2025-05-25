import React, { useEffect, useRef } from 'react';
import { toolRegistry } from '../../../../service-api/core/tool-registry';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  rect: SelectionRect;
  view: any;
  zoom: number;
  onFinish: () => void;
}

export default function TransformOverlay({ rect, view, zoom, onFinish }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const scaleRef = useRef(1);
  const rotationRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);

  useEffect(() => {
    if (!view) return;
    const layer = view.layers?.[view.currentLayerIndex];
    const layerCtx = layer?.canvas?.getContext('2d');
    if (!layerCtx) return;

    // backup original
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

    // copy selection
    const overlayCanvas = canvasRef.current!;
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

    // clear original selection
    layerCtx.clearRect(rect.x, rect.y, rect.width, rect.height);
  }, [rect, view]);

  useEffect(() => {
    updateTransform();
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      offsetXRef.current += e.clientX - dragStartX.current;
      offsetYRef.current += e.clientY - dragStartY.current;
      dragStartX.current = e.clientX;
      dragStartY.current = e.clientY;
      updateTransform();
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    draggingRef.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
  };

  const updateTransform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.transform = `translate(${offsetXRef.current}px, ${offsetYRef.current}px) scale(${scaleRef.current}) rotate(${rotationRef.current}rad)`;
  };

  const confirm = async () => {
    if (!canvasRef.current) return;
    await toolRegistry.executeTool('apply_selection_transform', {
      canvas: canvasRef.current,
      rect,
      offsetX: offsetXRef.current,
      offsetY: offsetYRef.current,
      scale: scaleRef.current,
      rotation: rotationRef.current,
      zoom
    });
    onFinish();
  };

  const cancel = () => {
    const layer = view.layers?.[view.currentLayerIndex];
    const ctx = layer?.canvas?.getContext('2d');
    if (ctx && backupCanvasRef.current) {
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      ctx.drawImage(backupCanvasRef.current, rect.x, rect.y);
    }
    onFinish();
  };

  return (
    <div
      ref={overlayRef}
      className="absolute z-50"
      style={{ left: rect.x, top: rect.y }}
      onPointerDown={startDrag}
    >
      <canvas ref={canvasRef} style={{ pointerEvents: 'none', border: '1px dashed var(--color-accent)' }} />
      <div
        className="absolute w-4 h-4 bg-primary border-2 border-accent rounded-full cursor-grab"
        style={{ right: '-8px', bottom: '-8px' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const rectObj = canvasRef.current?.getBoundingClientRect();
          if (!rectObj) return;
          const cx = rectObj.left + rectObj.width / 2;
          const cy = rectObj.top + rectObj.height / 2;
          const startVx = e.clientX - cx;
          const startVy = e.clientY - cy;
          const startDist = Math.hypot(startVx, startVy);
          const startAngle = Math.atan2(startVy, startVx);
          const startScale = scaleRef.current;
          const startRotation = rotationRef.current;

          const handleMove = (ev: PointerEvent) => {
            const vx = ev.clientX - cx;
            const vy = ev.clientY - cy;
            const dist = Math.hypot(vx, vy);
            const angle = Math.atan2(vy, vx);
            scaleRef.current = startScale * (dist / startDist);
            rotationRef.current = startRotation + (angle - startAngle);
            updateTransform();
          };

          const handleUp = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
          };

          window.addEventListener('pointermove', handleMove);
          window.addEventListener('pointerup', handleUp);
        }}
      />
      <div className="absolute -top-7 left-0 flex gap-1 bg-secondary border border-modifier-border p-1 rounded">
        <button className="px-2 py-1 text-xs" onClick={confirm}>確定</button>
        <button className="px-2 py-1 text-xs" onClick={cancel}>キャンセル</button>
      </div>
    </div>
  );
}
