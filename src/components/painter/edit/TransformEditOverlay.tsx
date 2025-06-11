import { Layer } from "src/types/painter-types";
import { useRef, useState, useEffect } from "react";
import { useLayersStore } from "src/storage/layers-store";
import { usePainterHistoryStore } from "src/store/painter-history-store";
import { SelectionRect } from "src/types/ui";


interface TransformEditOverlayProps {
  rect?: SelectionRect;
  layers: Layer[];
  currentLayerIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onFinish: () => void;
}

export default function TransformEditOverlay({ rect, layers, currentLayerIndex, containerRef, onFinish }: TransformEditOverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 選択範囲がない場合は現在のレイヤー全体を使用
  const effectiveRect = rect || (layers[currentLayerIndex] ? { 
    x: 0, 
    y: 0, 
    width: layers[currentLayerIndex].canvas.width, 
    height: layers[currentLayerIndex].canvas.height 
  } : { x: 0, y: 0, width: 800, height: 600 });

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [styleRect, setStyleRect] = useState({ left: effectiveRect.x, top: effectiveRect.y, width: effectiveRect.width, height: effectiveRect.height });
  const zoomScaleRef = useRef(1);

  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDraggingRef = useRef(false);
  const startVRef = useRef({ x: 0, y: 0 });
  const startDistRef = useRef(1);
  const startAngleRef = useRef(0);
  const startScaleRef = useRef(1);
  const startRotationRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    const left = effectiveRect.x * scaleX + (canvasRect.left - containerRect.left);
    const top = effectiveRect.y * scaleY + (canvasRect.top - containerRect.top);
    const width = effectiveRect.width * scaleX;
    const height = effectiveRect.height * scaleY;
    zoomScaleRef.current = scaleX;
    setStyleRect({ left, top, width, height });
  }, [effectiveRect, containerRef]);

  useEffect(() => {
    const layer = layers[currentLayerIndex];
    if (!layer) return;
    const ctx = layer.canvas.getContext('2d');
    const overlayCanvas = overlayCanvasRef.current;
    if (!ctx || !overlayCanvas) return;

    const backup = document.createElement('canvas');
    backup.width = effectiveRect.width;
    backup.height = effectiveRect.height;
    const bctx = backup.getContext('2d');
    if (!bctx) return;
    bctx.drawImage(
      layer.canvas,
      effectiveRect.x,
      effectiveRect.y,
      effectiveRect.width,
      effectiveRect.height,
      0,
      0,
      effectiveRect.width,
      effectiveRect.height
    );
    backupCanvasRef.current = backup;

    overlayCanvas.width = effectiveRect.width;
    overlayCanvas.height = effectiveRect.height;
    const octx = overlayCanvas.getContext('2d');
    if (!octx) return;
    octx.drawImage(
      layer.canvas,
      effectiveRect.x,
      effectiveRect.y,
      effectiveRect.width,
      effectiveRect.height,
      0,
      0,
      effectiveRect.width,
      effectiveRect.height
    );

    ctx.clearRect(effectiveRect.x, effectiveRect.y, effectiveRect.width, effectiveRect.height);
  }, [effectiveRect, currentLayerIndex]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const z = zoomScaleRef.current;
      canvas.style.transform = `translate(${offset.x * z}px, ${offset.y * z}px) scale(${scale}) rotate(${rotation}rad)`;
    }
  }, [offset, scale, rotation]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setOffset(prev => {
        const z = zoomScaleRef.current;
        const nx = prev.x + (e.clientX - dragStartRef.current.x) / z;
        const ny = prev.y + (e.clientY - dragStartRef.current.y) / z;
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
    ctx.translate(effectiveRect.x + effectiveRect.width / 2 + offset.x, effectiveRect.y + effectiveRect.height / 2 + offset.y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.drawImage(overlayCanvas, -effectiveRect.width / 2, -effectiveRect.height / 2);
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
    ctx.clearRect(effectiveRect.x, effectiveRect.y, effectiveRect.width, effectiveRect.height);
    ctx.drawImage(backup, effectiveRect.x, effectiveRect.y);
    const layersStore = useLayersStore.getState();
    layersStore.updateLayers([...layersStore.layers]);
    onFinish();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
      style={{ left: styleRect.left, top: styleRect.top, width: styleRect.width, height: styleRect.height }}
      onPointerDown={onPointerDown}
    >
      <canvas
        ref={overlayCanvasRef}
        style={{ width: styleRect.width, height: styleRect.height, pointerEvents: 'none', border: '1px dashed var(--color-accent)' }}
      />
      <div className="absolute left-0 -top-7 flex gap-1 bg-secondary border border-modifier-border p-1 rounded">
        <button className="px-2 py-1 text-xs" onClick={confirm}>確定</button>
        <button className="px-2 py-1 text-xs" onClick={cancel}>キャンセル</button>
      </div>
      <div
        className="absolute w-4 h-4 bg-background border-2 border-accent rounded-full cursor-grab"
        style={{ right: '-8px', bottom: '-8px' }}
        onPointerDown={onHandleDown}
      />
    </div>
  );
}
