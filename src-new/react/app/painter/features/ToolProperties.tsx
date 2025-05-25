import React from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LayoutDirection } from '../../../../obsidian-api/zustand/storage/painter-layout-store';

interface ToolProps {
  tool: string;
  lineWidth: number;
  selectionMode: 'rect' | 'lasso' | 'magic';
  blendMode: 'normal' | 'spectral';
  brushHasColor: boolean;
  blendStrength: number;
  mixRatio: number;
  zoom: number;
  rotation: number;
  setLineWidth: (w: number) => void;
  setSelectionMode: (m: 'rect' | 'lasso' | 'magic') => void;
  setBlendMode: (m: 'normal' | 'spectral') => void;
  setBrushHasColor: (hasColor: boolean) => void;
  setBlendStrength: (strength: number) => void;
  setMixRatio: (ratio: number) => void;
  setZoom: (z: number) => void;
  setRotation: (r: number) => void;
  layoutDirection: LayoutDirection;
}

export default function ToolProperties({
  tool,
  lineWidth,
  selectionMode,
  blendMode,
  brushHasColor,
  blendStrength,
  mixRatio,
  zoom,
  rotation,
  setLineWidth,
  setSelectionMode,
  setBlendMode,
  setBrushHasColor,
  setBlendStrength,
  setMixRatio,
  setZoom,
  setRotation,
  layoutDirection
}: ToolProps) {
  const containerClass = layoutDirection === 'horizontal'
    ? "p-2 bg-secondary border-r border-modifier-border w-[250px] flex flex-col gap-2"
    : "p-2 bg-secondary border-r border-modifier-border h-[80px] flex flex-row gap-4 items-center";

  return (
    <div className={containerClass}>
      {['brush', 'eraser'].includes(tool) && (
        <div className="flex flex-col gap-1">
          <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}:</div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.log10(lineWidth) * 33.33}
            onChange={e => {
              const logValue = parseInt(e.currentTarget.value, 10) / 33.33;
              const actualValue = Math.round(Math.pow(10, logValue));
              setLineWidth(Math.max(1, Math.min(1000, actualValue)));
            }}
          />
          <div className="text-text-muted text-xs text-center">{lineWidth}px</div>
        </div>
      )}

      {tool === 'brush' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">混色モード:</div>
            <select
              className="w-full text-xs p-1 border border-modifier-border rounded bg-primary"
              value={blendMode}
              onChange={e => setBlendMode(e.target.value as 'normal' | 'spectral')}
            >
              <option value="normal">通常混色</option>
              <option value="spectral">スペクトラル混色</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="brushHasColor"
              checked={brushHasColor}
              onChange={e => setBrushHasColor(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="brushHasColor" className="text-text-muted text-xs">
              ペンに色を付ける
            </label>
          </div>
          
          {brushHasColor && (
            <div className="flex flex-col gap-1">
              <div className="text-text-muted text-xs">混色比率: {mixRatio}%</div>
              <input
                type="range"
                min={0}
                max={100}
                value={mixRatio}
                onChange={e => setMixRatio(parseInt(e.currentTarget.value, 10))}
              />
              <div className="text-text-muted text-xs text-center">
                既存色 ←→ ペンの色
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">にじみ強度: {blendStrength}%</div>
            <input
              type="range"
              min={0}
              max={100}
              value={blendStrength}
              onChange={e => setBlendStrength(parseInt(e.currentTarget.value, 10))}
            />
          </div>
          
          <div className="text-text-muted text-xs">
            {brushHasColor 
              ? `${blendMode === 'spectral' ? 'スペクトラル' : '通常'}混色で既存色とペンの色を混ぜます`
              : `ペンエリア内の色を${blendMode === 'spectral' ? 'スペクトラル' : '通常'}混色でにじませます`
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
