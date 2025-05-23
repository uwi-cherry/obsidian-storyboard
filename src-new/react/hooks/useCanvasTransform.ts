import { useEffect, useState } from 'react';

export interface CanvasTransform {
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (angle: number) => void;
}

export default function useCanvasTransform(canvas: HTMLCanvasElement | null): CanvasTransform {
  const [zoom, setZoomState] = useState(100);
  const [rotation, setRotationState] = useState(0);

  useEffect(() => {
    if (canvas) {
      canvas.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
    }
  }, [canvas, zoom, rotation]);

  return {
    zoom,
    rotation,
    setZoom: setZoomState,
    setRotation: setRotationState
  };
}
