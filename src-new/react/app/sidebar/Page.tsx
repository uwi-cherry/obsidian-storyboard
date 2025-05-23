import React from 'react';
import { useLayerContext } from '../../context/LayerContext';

export default function SidebarReactView() {
  const { layers, currentLayerIndex, setCurrentLayerIndex } = useLayerContext();

  return (
    <div className="sidebar-view">
      <h2>Layer Sidebar</h2>
      <div className="layer-list">
        {layers.map((layer, index) => (
          <div
            key={index}
            className={`layer-item ${index === currentLayerIndex ? 'active' : ''}`}
            onClick={() => setCurrentLayerIndex(index)}
          >
            {layer.name || `Layer ${index + 1}`}
          </div>
        ))}
      </div>
    </div>
  );
}
