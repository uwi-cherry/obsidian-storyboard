import { useState } from 'react';

export type PainterTool = 'brush' | 'eraser' | 'selection' | 'hand' | 'color-mixer';

export type SelectionMode = 'rect' | 'lasso' | 'magic';

export type ColorMixMode = 'normal' | 'spectral';

export interface PainterPointer {
  tool: PainterTool;
  lineWidth: number;
  color: string;
  selectionMode: SelectionMode;
  colorMixMode: ColorMixMode;
  colorMixerHasColor: boolean;
  setTool: (tool: PainterTool) => void;
  setLineWidth: (lineWidth: number) => void;
  setColor: (color: string) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setColorMixMode: (mode: ColorMixMode) => void;
  setColorMixerHasColor: (hasColor: boolean) => void;
}

export default function usePainterPointer() {
  const [tool, setTool] = useState<PainterTool>('brush');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [color, setColor] = useState<string>('#000000');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rect');
  const [colorMixMode, setColorMixMode] = useState<ColorMixMode>('spectral');
  const [colorMixerHasColor, setColorMixerHasColor] = useState<boolean>(false);

  return {
    tool,
    lineWidth,
    color,
    selectionMode,
    colorMixMode,
    colorMixerHasColor,
    setTool,
    setLineWidth,
    setColor,
    setSelectionMode,
    setColorMixMode,
    setColorMixerHasColor,
  };
}
