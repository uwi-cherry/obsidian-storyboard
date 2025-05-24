import React from 'react';
import { t } from '../../../../constants/obsidian-i18n';

interface LayerControlsProps {
  layers?: any[];
  currentLayerIndex?: number;
  setLayers?: (layers: any[]) => void;
  setCurrentLayerIndex?: (index: number) => void;
  view?: any;
}

export default function LayerControls({ 
  layers = [], 
  currentLayerIndex = 0, 
  setLayers, 
  setCurrentLayerIndex, 
  view 
}: LayerControlsProps) {
  return (
    <div className="bg-secondary border-l border-modifier-border w-[250px] flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-modifier-border">
        <h3 className="font-medium text-text-normal">{t('LAYERS')}</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-1">
        {layers.map((layer: any, idx: number) => (
          <div
            key={layer.id || idx}
            className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-modifier-hover ${
              idx === currentLayerIndex ? 'bg-accent text-on-accent' : ''
            }`}
            onClick={() => setCurrentLayerIndex?.(idx)}
          >
            <div className="text-sm">{layer.name || `Layer ${idx + 1}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
