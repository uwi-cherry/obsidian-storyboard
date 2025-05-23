import React from 'react';
import { t } from '../../../../obsidian-i18n';

interface ToolProps {
  tool: string;
  lineWidth: number;
  color: string;
  zoom: number;
  rotation: number;
  setLineWidth: (w: number) => void;
  setColor: (c: string) => void;
  setZoom: (z: number) => void;
  setRotation: (r: number) => void;
}

export default function ToolProperties({
  tool,
  lineWidth,
  color,
  zoom,
  rotation,
  setLineWidth,
  setColor,
  setZoom,
  setRotation
}: ToolProps) {
  return (
    <div className="p-1 bg-secondary border-r border-modifier-border w-[200px] flex flex-col gap-2">
      {['brush', 'eraser'].includes(tool) && (
        <>
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}:</div>
            <input
              type="range"
              min={1}
              max={50}
              value={lineWidth}
              onChange={e => setLineWidth(parseInt(e.currentTarget.value, 10))}
            />
          </div>
          <div className="flex flex-col items-center mt-2">
            <input
              type="color"
              className="w-8 h-8 p-0 border-2 border-modifier-border rounded cursor-pointer"
              value={color}
              onChange={e => setColor(e.currentTarget.value)}
            />
          </div>
        </>
      )}

      {tool === 'hand' && (
        <div className="flex flex-col gap-1 mt-4 text-xs">
          <div className="text-text-muted">{t('ZOOM_LEVEL')}: {zoom}%</div>
          <input
            type="range"
            min={10}
            max={400}
            value={zoom}
            onChange={e => setZoom(parseInt(e.currentTarget.value, 10))}
          />
          <div className="text-text-muted mt-2">{t('ROTATION_ANGLE')}: {rotation}°</div>
          <input
            type="range"
            min={-180}
            max={180}
            value={rotation}
            onChange={e => setRotation(parseInt(e.currentTarget.value, 10))}
          />
        </div>
      )}
    </div>
  );
}
