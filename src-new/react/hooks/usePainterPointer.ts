import { useState } from 'react';

export interface PainterPointer {
  tool: string;
  lineWidth: number;
  color: string;
}

export default function usePainterPointer() {
  const [tool, setTool] = useState<string>('brush');
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