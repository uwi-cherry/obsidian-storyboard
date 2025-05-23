import React, { useEffect, useRef } from 'react';
import useCanvasTransform from '../../../hooks/useCanvasTransform';
import { useLayerContext } from '../../../context/LayerContext';
import usePainterPointer from '../../../hooks/usePainterPointer';

interface CanvasProps {
  pointer: ReturnType<typeof usePainterPointer>;
  onTransform?: (zoom: number, rotation: number) => void;
}

export default function PainterCanvas({ pointer, onTransform }: CanvasProps) {
  const { view, layers, currentLayerIndex, setLayers } = useLayerContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { zoom, rotation } = useCanvasTransform(canvasRef.current, view);

  useEffect(() => {
    onTransform?.(zoom, rotation);
  }, [zoom, rotation, onTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = layers[0]?.canvas.width || 800;
    canvas.height = layers[0]?.canvas.height || 600;

    const drawComposite = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      layers.forEach(layer => {
        if (layer.visible && layer.canvas) {
          ctx.globalAlpha = layer.opacity ?? 1;
          try {
            if (layer.canvas instanceof HTMLCanvasElement || 
                (layer.canvas && typeof (layer.canvas as any).getContext === 'function')) {
              ctx.drawImage(layer.canvas, 0, 0);
            } else {
              console.warn('Invalid canvas element detected in layer:', layer.name);
            }
          } catch (error) {
            console.error('Failed to draw layer canvas:', layer.name, error);
          }
        }
      });
      ctx.globalAlpha = 1;
    };

    drawComposite();
  }, [layers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getLayerCtx = () => layers[currentLayerIndex]?.canvas.getContext('2d');

    const handleDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawing = true;
      lastX = x;
      lastY = y;
      if (pointer.tool === 'brush' || pointer.tool === 'eraser') {
        const lctx = getLayerCtx();
        if (lctx) {
          lctx.lineWidth = pointer.lineWidth;
        }
      }
      view.saveHistory();
    };

    const handleMove = (e: PointerEvent) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const lctx = getLayerCtx();
      if (!lctx) return;
      lctx.beginPath();
      lctx.moveTo(lastX, lastY);
      lctx.lineTo(x, y);
      lctx.strokeStyle = pointer.tool === 'eraser' ? 'rgba(0,0,0,1)' : pointer.color;
      lctx.globalCompositeOperation = pointer.tool === 'eraser' ? 'destination-out' : 'source-over';
      lctx.stroke();
      lctx.globalCompositeOperation = 'source-over';
      lastX = x;
      lastY = y;
      setLayers([...layers]);
    };

    const handleUp = () => {
      if (drawing) {
        drawing = false;
        view.saveHistory();
      }
    };

    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      canvas.removeEventListener('pointerdown', handleDown);
      canvas.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [layers, currentLayerIndex, pointer]);

  return (
    <div className="flex-1 flex items-center justify-center overflow-auto bg-secondary">
      <canvas ref={canvasRef} />
    </div>
  );
}
