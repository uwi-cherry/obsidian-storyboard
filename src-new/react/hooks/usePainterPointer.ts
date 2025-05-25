import { useState } from 'react';

export type PainterTool = 'brush' | 'eraser' | 'selection' | 'hand';

export type SelectionMode = 'rect' | 'lasso' | 'magic';

export type BlendMode = 'normal' | 'spectral';

export interface PainterPointer {
  tool: PainterTool;
  lineWidth: number;
  color: string;
  selectionMode: SelectionMode;
  blendMode: BlendMode;
  brushHasColor: boolean;
  brushOpacity: number;
  blendStrength: number;
  mixRatio: number;
  setTool: (tool: PainterTool) => void;
  setLineWidth: (lineWidth: number) => void;
  setColor: (color: string) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setBlendMode: (mode: BlendMode) => void;
  setBrushHasColor: (hasColor: boolean) => void;
  setBrushOpacity: (opacity: number) => void;
  setBlendStrength: (strength: number) => void;
  setMixRatio: (ratio: number) => void;
}

export default function usePainterPointer() {
  const [tool, setTool] = useState<PainterTool>('brush');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [color, setColor] = useState<string>('#000000');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rect');
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [brushHasColor, setBrushHasColor] = useState<boolean>(true);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);
  const [blendStrength, setBlendStrength] = useState<number>(50);
  const [mixRatio, setMixRatio] = useState<number>(100);

  return {
    tool,
    lineWidth,
    color,
    selectionMode,
    blendMode,
    brushHasColor,
    brushOpacity,
    blendStrength,
    mixRatio,
    setTool,
    setLineWidth,
    setColor,
    setSelectionMode,
    setBlendMode,
    setBrushHasColor,
    setBrushOpacity,
    setBlendStrength,
    setMixRatio,
  };
}
