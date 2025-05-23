import React from 'react';

interface SidebarReactViewProps {
  layers: any[];
  currentLayerIndex: number;
  onLayerChange: (layers: any[], currentIndex: number) => void;
}

export default function SidebarReactView({ layers, currentLayerIndex, onLayerChange }: SidebarReactViewProps) {
  return (
    <div className="sidebar-view">
      <h2>Layer Sidebar</h2>
      <div className="layer-list">
        {layers.map((layer, index) => (
          <div 
            key={index} 
            className={`layer-item ${index === currentLayerIndex ? 'active' : ''}`}
            onClick={() => onLayerChange(layers, index)}
          >
            {layer.name || `Layer ${index + 1}`}
          </div>
        ))}
      </div>
      <button onClick={() => onLayerChange([...layers, { name: 'New Layer' }], layers.length)}>
        Add Layer
      </button>
    </div>
  );
} 