import React from 'react';

interface SidebarProps {
  layers?: any[];
  currentLayerIndex?: number;
  setCurrentLayerIndex?: (index: number) => void;
}

export default function SidebarPage({ layers = [], currentLayerIndex = 0, setCurrentLayerIndex }: SidebarProps) {
  return (
    <div className="h-full">
      <div className="p-2">
        <h2 className="font-bold text-lg">Sidebar</h2>
      </div>
      <div className="p-2">
        {layers.map((layer: any, index: number) => (
          <div
            key={layer.id || index}
            className={`p-2 rounded cursor-pointer ${
              index === currentLayerIndex ? 'bg-accent text-on-accent' : 'hover:bg-modifier-hover'
            }`}
            onClick={() => setCurrentLayerIndex?.(index)}
          >
            {layer.name || `Layer ${index + 1}`}
          </div>
        ))}
      </div>
    </div>
  );
}
