import { useState } from 'react';

export type PainterTool = 'pen' | 'brush' | 'paint-brush' | 'color-mixer' | 'eraser' | 'selection' | 'hand';

export type SelectionMode =
  | 'rect'
  | 'lasso'
  | 'magic'
  | 'select-pen'
  | 'select-eraser';

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

  const setToolWithPresets = (newTool: PainterTool) => {
    setTool(newTool);
    
    // ツールに応じた初期値を設定
    switch (newTool) {
      case 'pen':
        setBrushOpacity(100);
        setDrawingMode('normal');
        setMixRatio(100);
        setBlendStrength(0);
        setBrushHasColor(true);
        break;
      case 'brush':
        setBrushOpacity(10);
        setDrawingMode('normal');
        setMixRatio(100);
        setBlendStrength(0);
        setBrushHasColor(true);
        break;
      case 'paint-brush':
        setBrushOpacity(10);
        setDrawingMode('spectral');
        setMixRatio(50);
        setBlendStrength(50);
        setBrushHasColor(true);
        break;
      case 'color-mixer':
        setBrushOpacity(0);
        setDrawingMode('spectral');
        setMixRatio(0);
        setBlendStrength(100);
        setBrushHasColor(false);
        break;
      case 'eraser':
        setBrushOpacity(100);
        setDrawingMode('erase-soft');
        setMixRatio(100);
        setBlendStrength(0);
        setBrushHasColor(true);
        break;
      default:
        // selection, handは設定変更なし
        break;
    }
  };

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
    setTool: setToolWithPresets,
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

export function getPointerPos(
  canvas: HTMLCanvasElement | null,
  e: PointerEvent | React.PointerEvent
): { x: number; y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  return { x, y };
}
