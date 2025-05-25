import React from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LayoutDirection } from '../../../../obsidian-api/zustand/storage/painter-layout-store';

interface ToolProps {
  tool: string;
  lineWidth: number;
  selectionMode: 'rect' | 'lasso' | 'magic';
  zoom: number;
  rotation: number;
  setLineWidth: (w: number) => void;
  setSelectionMode: (m: 'rect' | 'lasso' | 'magic') => void;
  setZoom: (z: number) => void;
  setRotation: (r: number) => void;
  layoutDirection: LayoutDirection;
}

export default function ToolProperties({
  tool,
  lineWidth,
  selectionMode,
  zoom,
  rotation,
  setLineWidth,
  setSelectionMode,
  setZoom,
  setRotation,
  layoutDirection
}: ToolProps) {
  const containerClass = layoutDirection === 'horizontal'
    ? "p-2 bg-secondary border-r border-modifier-border w-[250px] flex flex-col gap-2"
    : "p-2 bg-secondary border-r border-modifier-border h-[80px] flex flex-row gap-4 items-center";

  return (
    <div className={containerClass}>
      {['brush', 'eraser', 'color-mixer'].includes(tool) && (
        <div className="flex flex-col gap-1">
          <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}:</div>
          <input
            type="range"
            min={1}
            max={50}
            value={lineWidth}
            onChange={e => setLineWidth(parseInt(e.currentTarget.value, 10))}
          />
          <div className="text-text-muted text-xs text-center">{lineWidth}px</div>
        </div>
      )}

      {tool === 'color-mixer' && (
        <div className="flex flex-col gap-1">
          <div className="text-text-muted text-xs">色混ぜモード</div>
          <div className="text-text-muted text-xs">
            キャンバス上の色と選択した色をスペクトラル混色します
          </div>
        </div>
      )}

      {tool === 'selection' && (
        <div className="flex flex-col gap-1">
          <div className="text-text-muted text-xs">{t('SELECTION_TYPE')}:</div>
          <select
            className="w-full text-xs"
            value={selectionMode}
            onChange={e =>
              setSelectionMode(e.currentTarget.value as 'rect' | 'lasso' | 'magic')
            }
          >
            <option value="rect">{t('SELECT_RECT')}</option>
            <option value="lasso">{t('SELECT_LASSO')}</option>
            <option value="magic">{t('SELECT_MAGIC')}</option>
          </select>
        </div>
      )}

      {tool === 'hand' && (
        <div className={layoutDirection === 'horizontal' ? "flex flex-col gap-2" : "flex flex-row gap-4"}>
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('ZOOM_LEVEL')}: {zoom}%</div>
            <input
              type="range"
              min={10}
              max={400}
              value={zoom}
              onChange={e => setZoom(parseInt(e.currentTarget.value, 10))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('ROTATION_ANGLE')}: {rotation}°</div>
            <input
              type="range"
              min={-180}
              max={180}
              value={rotation}
              onChange={e => setRotation(parseInt(e.currentTarget.value, 10))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
