import React from 'react';
import { useLayerContext } from '../../context/LayerContext';

export default function PainterReactView() {
  const { layers, currentLayerIndex, setLayers } = useLayerContext();

  return (
    <div className="painter-view">
      <h2>Painter View (PSD)</h2>
      <p>Layers: {layers.length}</p>
      <p>Current Layer: {currentLayerIndex}</p>
      <button onClick={() => setLayers([...layers, { name: 'New Layer', visible: true, opacity: 1, blendMode: 'normal', canvas: document.createElement('canvas') }])}>
        Add Layer
      </button>
    </div>
  );
}
