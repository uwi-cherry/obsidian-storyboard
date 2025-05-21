import { useState } from 'react';
import { DEFAULT_COLOR } from '../../constants';

export interface PainterPointerState {
  tool: string;
  lineWidth: number;
  color: string;
  setTool: (tool: string) => void;
  setLineWidth: (width: number) => void;
  setColor: (color: string) => void;
}

export function usePainterPointer(
  initialTool = 'brush',
  initialLineWidth = 5,
  initialColor = DEFAULT_COLOR
): PainterPointerState {
  const [tool, setTool] = useState(initialTool);
  const [lineWidth, setLineWidth] = useState(initialLineWidth);
  const [color, setColor] = useState(initialColor);

  return { tool, lineWidth, color, setTool, setLineWidth, setColor };
}
