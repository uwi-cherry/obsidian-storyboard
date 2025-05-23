import React, { useEffect, useState } from 'react';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import Canvas from './components/Canvas';
import CanvasContainer from './components/CanvasContainer';
import usePainterPointer from '../../hooks/usePainterPointer';
import { useLayerContext } from '../../context/LayerContext';

interface PainterPageProps {
  view?: any;
  app?: any;
}

export default function PainterPage({ view, app }: PainterPageProps) {
  if (!view) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary text-text-normal">
        Painter ビューが見つかりません
      </div>
    );
  }
  const pointer = usePainterPointer();
  const { initializePainterData } = useLayerContext();
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (view) {
      initializePainterData(view);
    }
  }, [view, initializePainterData]);

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
        <Canvas pointer={pointer} onTransform={(z, r) => { setZoom(z); setRotation(r); }} />
      </CanvasContainer>
    </div>
  );
}
