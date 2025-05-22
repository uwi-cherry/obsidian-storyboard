import { useEffect, useState } from 'react';

export interface PainterPointerState {
  tool: string;
  lineWidth: number;
  color: string;
  setTool: (tool: string) => void;
  setLineWidth: (width: number) => void;
  setColor: (color: string) => void;
}

export function usePainterPointer(
  initialTool: string,
  initialLineWidth: number,
  initialColor: string,
  onToolChange?: (tool: string) => void,
  onLineWidthChange?: (width: number) => void,
  onColorChange?: (color: string) => void
): PainterPointerState {
  const [tool, setToolState] = useState(initialTool);
  const [lineWidth, setLineWidthState] = useState(initialLineWidth);
  const [color, setColorState] = useState(initialColor);

  useEffect(() => {
    onToolChange?.(tool);
  }, [tool, onToolChange]);

  useEffect(() => {
    onLineWidthChange?.(lineWidth);
  }, [lineWidth, onLineWidthChange]);

  useEffect(() => {
    onColorChange?.(color);
  }, [color, onColorChange]);

  const setTool = (t: string) => setToolState(t);
  const setLineWidth = (w: number) => setLineWidthState(w);
  const setColor = (c: string) => setColorState(c);

  return { tool, lineWidth, color, setTool, setLineWidth, setColor };
}
