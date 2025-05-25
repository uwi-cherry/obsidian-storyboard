import React, { useState } from 'react';
import Canvas from './Canvas';
import ToolProperties from './ToolProperties';
import ColorProperties from './ColorProperties';
import ActionProperties from './ActionProperties';
import { PainterPointer } from 'src-new/react/hooks/usePainterPointer';
import { usePainterLayoutStore } from '../../../../obsidian-api/zustand/storage/painter-layout-store';
import { useSelectionStateStore } from '../../../../obsidian-api/zustand/store/selection-state-store';

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
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
}

export default function CanvasContainer({ 
  pointer, 
  layers = [], 
  currentLayerIndex = 0, 
  view,
  zoom,
  rotation,
  setZoom,
  setRotation
}: Props) {
  const selectionRect = useSelectionStateStore(state => state.selectionRect);
  const setSelectionRect = useSelectionStateStore(state => state.setSelectionRect);
  const [menuMode, setMenuMode] = useState<'hidden' | 'global' | 'selection'>('global');
  const [menuPos, setMenuPos] = useState({ x: 8, y: 8 });
  
  const { layoutDirection } = usePainterLayoutStore();

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
    useSelectionStateStore.getState().reset();
    setMenuMode('global');
  };

  const actionHandlers = {
    fill: () => {},
    clear: () => {},
    cancel: cancelSelection
  };

  const containerClass = layoutDirection === 'horizontal' 
    ? "flex flex-1 w-full h-full overflow-hidden"
    : "flex flex-col flex-1 w-full h-full overflow-hidden";

  const propertiesContainerClass = layoutDirection === 'horizontal' 
    ? "flex flex-col"
    : "flex flex-row border-b border-modifier-border";

  return (
    <div className={containerClass}>
      <div className={propertiesContainerClass}>
        <ToolProperties
          tool={pointer.tool}
          lineWidth={pointer.lineWidth}
          zoom={zoom}
          rotation={rotation}
          setLineWidth={pointer.setLineWidth}
          setZoom={setZoom}
          setRotation={setRotation}
          layoutDirection={layoutDirection}
        />
        
        <ColorProperties
          color={pointer.color}
          setColor={pointer.setColor}
          layoutDirection={layoutDirection}
        />
        
        <ActionProperties
          handlers={actionHandlers}
          mode={menuMode === 'selection' ? 'hidden' : 'global'}
          isFloating={false}
          layoutDirection={layoutDirection}
        />
      </div>
      
      <div className="flex flex-1 w-full h-full items-center justify-center overflow-auto bg-secondary relative">
        <Canvas
          pointer={pointer}
          layers={layers}
          currentLayerIndex={currentLayerIndex}
          view={view}
          onSelectionStart={handleSelectionStart}
          onSelectionUpdate={handleSelectionUpdate}
          onSelectionEnd={handleSelectionEnd}
        />
        
        {menuMode === 'selection' && (
          <ActionProperties
            handlers={actionHandlers}
            mode={menuMode}
            position={menuPos}
            isFloating={true}
          />
        )}
      </div>
    </div>
  );
}
