import React, { useState } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import usePainterPointer from '../../hooks/usePainterPointer';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import CanvasContainer from './components/CanvasContainer';

export default function PainterReactView() {
  const { layers, currentLayerIndex } = useLayerContext();
  const pointer = usePainterPointer();
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const handleTransform = (newZoom: number, newRotation: number) => {
    setZoom(newZoom);
    setRotation(newRotation);
  };

  return (
    <div className="w-full h-full flex bg-primary">
      {/* ツールバー */}
      <Toolbar 
        tool={pointer.tool} 
        onChange={pointer.setTool} 
      />
      
      {/* ツールプロパティ */}
      <ToolProperties
        tool={pointer.tool}
        lineWidth={pointer.lineWidth}
        color={pointer.color}
        zoom={zoom}
        rotation={rotation}
        setLineWidth={pointer.setLineWidth}
        setColor={pointer.setColor}
        setZoom={setZoom}
        setRotation={setRotation}
      />
      
      {/* キャンバス領域 */}
      <CanvasContainer>
        <Canvas 
          pointer={pointer} 
          onTransform={handleTransform}
        />
      </CanvasContainer>
    </div>
  );
}
