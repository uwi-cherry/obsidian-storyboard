import React, { useState } from 'react';
import usePainterPointer from '../../hooks/usePainterPointer';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import CanvasContainer from './components/CanvasContainer';
import PainterCanvas from './components/Canvas';

export default function PainterReactView() {
  const pointer = usePainterPointer();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Toolbar tool={pointer.tool} onChange={pointer.setTool} />
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
      <CanvasContainer>
        <PainterCanvas pointer={pointer} onTransform={(z, r) => { setZoom(z); setRotation(r); }} />
      </CanvasContainer>
    </div>
  );
}
