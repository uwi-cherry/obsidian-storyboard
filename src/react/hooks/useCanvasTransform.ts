import { useState, useEffect } from 'react';
import type { PainterView } from '../../types/painter-types';

export default function useCanvasTransform(canvas: HTMLCanvasElement | null, view: PainterView | null) {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (view && view.zoom !== undefined) {
      setZoom(view.zoom);
    }
    if (view && view.rotation !== undefined) {
      setRotation(view.rotation);
    }
  }, [view]);

  return {
    zoom,
    rotation,
    setZoom,
    setRotation,
  };
} 
