import { useEffect, useState } from 'react';
import type { PainterView } from '../view/painter-obsidian-view';

export interface CanvasTransform {
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (angle: number) => void;
}

export function useCanvasTransform(
  canvas: HTMLCanvasElement | null,
  view: PainterView
): CanvasTransform {
  const [zoom, setZoomState] = useState<number>(view.zoom);
  const [rotation, setRotationState] = useState<number>(view.rotation);

  useEffect(() => {
    view.zoom = zoom;
    view.rotation = rotation;
    if (canvas) {
      canvas.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
    }
  }, [canvas, zoom, rotation, view]);

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
