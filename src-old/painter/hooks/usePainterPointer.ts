import { useEffect, useState } from 'react';
import type { PainterView } from '../view/painter-obsidian-view';

export interface PainterPointerState {
  tool: string;
  lineWidth: number;
  color: string;
  setTool: (tool: string) => void;
  setLineWidth: (width: number) => void;
  setColor: (color: string) => void;
}

export function usePainterPointer(view: PainterView): PainterPointerState {
  const [tool, setTool] = useState(view.currentTool);
  const [lineWidth, setLineWidth] = useState(view.currentLineWidth);
  const [color, setColor] = useState(view.currentColor);

  useEffect(() => {
    view.currentTool = tool;
  }, [tool, view]);

  useEffect(() => {
    view.currentLineWidth = lineWidth;
  }, [lineWidth, view]);

  useEffect(() => {
    view.currentColor = color;
  }, [color, view]);

  return { tool, lineWidth, color, setTool, setLineWidth, setColor };
}
