import { useEffect, useState } from 'react';

export interface CanvasTransform {
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (angle: number) => void;
}

export function useCanvasTransform(
  canvas: HTMLCanvasElement | null,
  initialZoom: number,
  initialRotation: number,
  onZoomChange?: (zoom: number) => void,
  onRotationChange?: (angle: number) => void
): CanvasTransform {
  const [zoom, setZoomState] = useState<number>(initialZoom);
  const [rotation, setRotationState] = useState<number>(initialRotation);

  useEffect(() => {
    onZoomChange?.(zoom);
    onRotationChange?.(rotation);
    if (canvas) {
      canvas.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
    }
  }, [canvas, zoom, rotation, onZoomChange, onRotationChange]);

  const setZoom = (z: number) => {
    setZoomState(z);
  };

  const setRotation = (angle: number) => {
    setRotationState(angle);
  };

  return {
    zoom,
    rotation,
    setZoom,
    setRotation,
  };
}
