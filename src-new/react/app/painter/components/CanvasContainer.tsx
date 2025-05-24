import React, { useState } from 'react';
import Canvas from './Canvas';
import ActionMenu from './ActionMenu';
import { PainterPointer } from 'src-new/react/hooks/usePainterPointer';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  pointer: PainterPointer;
  layers?: any[];
  currentLayerIndex?: number;
  view?: any;
}

export default function CanvasContainer({ pointer, layers = [], currentLayerIndex = 0, view }: Props) {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | undefined>();
  const [menuMode, setMenuMode] = useState<'hidden' | 'global' | 'selection'>('global');
  const [menuPos, setMenuPos] = useState({ x: 8, y: 8 });

  const handleSelectionStart = () => {
    setMenuMode('hidden');
  };

  const handleSelectionUpdate = (rect: SelectionRect | undefined) => {
    setSelectionRect(rect);
  };

  const handleSelectionEnd = (rect?: SelectionRect) => {
    if (rect) {
      setMenuPos({ x: rect.x, y: rect.y - 28 });
      setMenuMode('selection');
    } else {
      setMenuMode('global');
    }
  };

  const cancelSelection = () => {
    setSelectionRect(undefined);
    setMenuMode('global');
  };

  return (
    <div className="flex flex-1 w-full h-full items-center justify-center overflow-auto bg-secondary relative">
      <Canvas
        pointer={pointer}
        layers={layers}
        currentLayerIndex={currentLayerIndex}
        view={view}
        selectionRect={selectionRect}
        onSelectionStart={handleSelectionStart}
        onSelectionUpdate={handleSelectionUpdate}
        onSelectionEnd={handleSelectionEnd}
      />
      <ActionMenu
        handlers={{
          fill: () => {},
          clear: () => {},
          cancel: cancelSelection
        }}
        mode={menuMode}
        position={menuPos}
      />
    </div>
  );
}
