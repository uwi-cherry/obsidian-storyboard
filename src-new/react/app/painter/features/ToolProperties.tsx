import React from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LayoutDirection } from '../../../../obsidian-api/zustand/storage/painter-layout-store';

interface ToolProps {
  tool: string;
  lineWidth: number;
  selectionMode: 'rect' | 'lasso' | 'magic';
  colorMixMode: 'normal' | 'spectral';
  colorMixerHasColor: boolean;
  zoom: number;
  rotation: number;
  setLineWidth: (w: number) => void;
  setSelectionMode: (m: 'rect' | 'lasso' | 'magic') => void;
  setColorMixMode: (m: 'normal' | 'spectral') => void;
  setColorMixerHasColor: (hasColor: boolean) => void;
  setZoom: (z: number) => void;
  setRotation: (r: number) => void;
  layoutDirection: LayoutDirection;
}

export default function ToolProperties({
  tool,
  lineWidth,
  selectionMode,
  colorMixMode,
  colorMixerHasColor,
  zoom,
  rotation,
  setLineWidth,
  setSelectionMode,
  setColorMixMode,
  setColorMixerHasColor,
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">混色モード:</div>
            <select
              className="w-full text-xs p-1 border border-modifier-border rounded bg-primary"
              value={colorMixMode}
              onChange={e => setColorMixMode(e.target.value as 'normal' | 'spectral')}
            >
              <option value="normal">通常混色</option>
              <option value="spectral">スペクトラル混色</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="colorMixerHasColor"
              checked={colorMixerHasColor}
              onChange={e => setColorMixerHasColor(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="colorMixerHasColor" className="text-text-muted text-xs">
              ツールに色を付ける
            </label>
          </div>
          
          <div className="text-text-muted text-xs">
            {colorMixerHasColor 
              ? `${colorMixMode === 'spectral' ? 'スペクトラル' : '通常'}混色で既存色と混ぜます`
              : 'ペンエリア内の色をにじませて混色します'
            }
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
