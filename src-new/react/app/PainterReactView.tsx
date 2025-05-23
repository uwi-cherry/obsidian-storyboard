import React from 'react';

interface PainterReactViewProps {
  layers: any[];
  currentLayer: number;
  onLayerChange: (layers: any[]) => void;
}

export default function PainterReactView({ layers, currentLayer, onLayerChange }: PainterReactViewProps) {
  return (
    <div className="painter-view">
      <h2>Painter View (PSD)</h2>
      <p>Layers: {layers.length}</p>
      <p>Current Layer: {currentLayer}</p>
      <button onClick={() => onLayerChange([...layers, { name: 'New Layer' }])}>
        Add Layer
      </button>
    </div>
  );
} 