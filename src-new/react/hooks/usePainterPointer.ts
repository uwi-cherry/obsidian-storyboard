import { useState, useEffect } from 'react';
import { useLayerContext } from '../context/LayerContext';
import type { PainterView } from '../../obsidian-api/painter/painter-view';

export interface PainterPointerState {
  tool: string;
  lineWidth: number;
  color: string;
  setTool: (tool: string) => void;
  setLineWidth: (width: number) => void;
  setColor: (color: string) => void;
}

export default function usePainterPointer(): PainterPointerState {
  const { view } = useLayerContext();
  const [tool, setTool] = useState(view.currentTool ?? 'brush');
  const [lineWidth, setLineWidth] = useState(view.currentLineWidth ?? 5);
  const [color, setColor] = useState(view.currentColor ?? '#000000');

  useEffect(() => {
    (view as PainterView).currentTool = tool;
  }, [tool, view]);

  useEffect(() => {
    (view as PainterView).currentLineWidth = lineWidth;
  }, [lineWidth, view]);

  useEffect(() => {
    (view as PainterView).currentColor = color;
  }, [color, view]);

  return { tool, lineWidth, color, setTool, setLineWidth, setColor };
}
