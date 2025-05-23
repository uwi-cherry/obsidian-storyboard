import { useState } from 'react';

export interface PainterPointerState {
  tool: string;
  lineWidth: number;
  color: string;
  setTool: (tool: string) => void;
  setLineWidth: (width: number) => void;
  setColor: (color: string) => void;
}

export default function usePainterPointer(): PainterPointerState {
  const [tool, setTool] = useState('brush');
  const [lineWidth, setLineWidth] = useState(5);
  const [color, setColor] = useState('#000000');

  return { tool, lineWidth, color, setTool, setLineWidth, setColor };
}
