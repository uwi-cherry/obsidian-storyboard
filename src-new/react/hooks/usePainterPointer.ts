import { useState } from 'react';

export type PainterTool = 'brush' | 'eraser' | 'selection' | 'hand';

export interface PainterPointer {
  tool: PainterTool;
  lineWidth: number;
  color: string;
  setTool: (tool: PainterTool) => void;
  setLineWidth: (lineWidth: number) => void;
  setColor: (color: string) => void;
}

export default function usePainterPointer() {
  const [tool, setTool] = useState<PainterTool>('brush');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [color, setColor] = useState<string>('#000000');

  return {
    tool,
    lineWidth,
    color,
    setTool,
    setLineWidth,
    setColor,
  };
} 