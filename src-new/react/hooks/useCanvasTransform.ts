import { useEffect, useState } from 'react';
import type { PainterView } from '../../obsidian-api/painter/painter-view';

export interface CanvasTransform {
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (angle: number) => void;
}

export default function useCanvasTransform(
  canvas: HTMLCanvasElement | null,
  view?: PainterView
): CanvasTransform {
  const [zoom, setZoomState] = useState(view?.zoom ?? 100);
  const [rotation, setRotationState] = useState(view?.rotation ?? 0);

  useEffect(() => {
    if (view) {
      view.zoom = zoom;
      view.rotation = rotation;
    }
    if (canvas) {
      canvas.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
    }
  }, [canvas, zoom, rotation, view]);

  return {
    zoom,
    rotation,
    setZoom: setZoomState,
    setRotation: setRotationState
  };
}
