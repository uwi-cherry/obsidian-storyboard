import { useState } from 'react';

export type PainterTool = 'brush' | 'eraser' | 'selection' | 'hand';

export type SelectionMode = 'rect' | 'lasso' | 'magic';

export type BlendMode = 'normal' | 'spectral';

export type DrawingMode = 'normal' | 'spectral' | 'erase-soft';

export interface PainterPointer {
  tool: PainterTool;
  drawingMode: DrawingMode;
  lineWidth: number;
  color: string;
  selectionMode: SelectionMode;
  brushHasColor: boolean;
  brushOpacity: number;
  blendStrength: number;
  mixRatio: number;
  setTool: (tool: PainterTool) => void;
  setDrawingMode: (mode: DrawingMode) => void;
  setLineWidth: (lineWidth: number) => void;
  setColor: (color: string) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setBrushHasColor: (hasColor: boolean) => void;
  setBrushOpacity: (opacity: number) => void;
  setBlendStrength: (strength: number) => void;
  setMixRatio: (ratio: number) => void;
}

export default function usePainterPointer() {
  const [tool, setTool] = useState<PainterTool>('brush');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [color, setColor] = useState<string>('#000000');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('normal');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rect');
  const [brushHasColor, setBrushHasColor] = useState<boolean>(true);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);
  const [blendStrength, setBlendStrength] = useState<number>(50);
  const [mixRatio, setMixRatio] = useState<number>(100);

  return {
    tool,
    drawingMode,
    lineWidth,
    color,
    selectionMode,
    brushHasColor,
    brushOpacity,
    blendStrength,
    mixRatio,
    setTool,
    setDrawingMode,
    setLineWidth,
    setColor,
    setSelectionMode,
    setBrushHasColor,
    setBrushOpacity,
    setBlendStrength,
    setMixRatio,
  };
}
