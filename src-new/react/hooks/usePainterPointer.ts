import { useState } from 'react';

export type PainterTool = 'brush' | 'eraser' | 'selection' | 'hand' | 'color-mixer';

export type SelectionMode = 'rect' | 'lasso' | 'magic';

export interface PainterPointer {
  tool: PainterTool;
  lineWidth: number;
  color: string;
  selectionMode: SelectionMode;
  setTool: (tool: PainterTool) => void;
  setLineWidth: (lineWidth: number) => void;
  setColor: (color: string) => void;
  setSelectionMode: (mode: SelectionMode) => void;
}

export default function usePainterPointer() {
  const [tool, setTool] = useState<PainterTool>('brush');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [color, setColor] = useState<string>('#000000');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rect');

  return {
    tool,
    lineWidth,
    color,
    selectionMode,
    setTool,
    setLineWidth,
    setColor,
    setSelectionMode,
  };
}
