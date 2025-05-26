import React from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LayoutDirection, usePainterLayoutStore } from '../../../../obsidian-api/zustand/storage/painter-layout-store';

interface ToolProps {
  tool: string;
  drawingMode: 'normal' | 'spectral' | 'erase-soft';
  lineWidth: number;
  selectionMode: 'rect' | 'lasso' | 'magic';
  brushHasColor: boolean;
  brushOpacity: number;
  blendStrength: number;
  mixRatio: number;
  zoom: number;
  rotation: number;
  setDrawingMode: (m: 'normal' | 'spectral' | 'erase-soft') => void;
  setLineWidth: (w: number) => void;
  setSelectionMode: (m: 'rect' | 'lasso' | 'magic') => void;
  setBrushHasColor: (hasColor: boolean) => void;
  setBrushOpacity: (opacity: number) => void;
  setBlendStrength: (strength: number) => void;
  setMixRatio: (ratio: number) => void;
  setZoom: (z: number) => void;
  setRotation: (r: number) => void;
  layoutDirection: LayoutDirection;
}

export default function ToolProperties({
  tool,
  drawingMode,
  lineWidth,
  selectionMode,
  brushHasColor,
  brushOpacity,
  blendStrength,
  mixRatio,
  zoom,
  rotation,
  setDrawingMode,
  setLineWidth,
  setSelectionMode,
  setBrushHasColor,
  setBrushOpacity,
  setBlendStrength,
  setMixRatio,
  setZoom,
  setRotation,
  layoutDirection
}: ToolProps) {
  const { setLayoutDirection } = usePainterLayoutStore();

  const containerClass = layoutDirection === 'horizontal'
    ? "p-2 bg-secondary border-r border-modifier-border w-[250px] flex flex-col gap-2"
    : "p-2 bg-secondary border-r border-modifier-border h-[80px] flex flex-row gap-4 items-center";

  return (
    <div className={containerClass}>
      {tool === 'settings' && (
        <div className="flex flex-col gap-2">
          {/* レイアウト設定セクション */}
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('LAYOUT_SETTINGS')}:</div>
            <select
              className="w-full text-xs p-1 border border-modifier-border rounded bg-primary"
              value={layoutDirection}
              onChange={e => setLayoutDirection(e.target.value as LayoutDirection)}
            >
              <option value="horizontal">{t('LAYOUT_HORIZONTAL')}</option>
              <option value="vertical">{t('LAYOUT_VERTICAL')}</option>
            </select>
          </div>
        </div>
      )}

      {['pen', 'brush', 'paint-brush', 'color-mixer', 'eraser'].includes(tool) && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}: {lineWidth}px</div>
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
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('BRUSH_OPACITY')}: {brushOpacity}%</div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.sqrt(brushOpacity) * 10}
              onChange={e => {
                const sliderValue = parseInt(e.currentTarget.value, 10);
                const opacity = Math.round((sliderValue / 10) ** 2);
                setBrushOpacity(Math.max(0, Math.min(100, opacity)));
                // 透明度0%の時は「ペンに色を付けない」、それ以外は「ペンに色を付ける」
                setBrushHasColor(opacity > 0);
              }}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('COLOR_MIX_RATIO').replace('{canvas}', (100 - mixRatio).toString()).replace('{pen}', mixRatio.toString())}</div>
            <input
              type="range"
              min={0}
              max={100}
              value={mixRatio}
              onChange={e => setMixRatio(parseInt(e.currentTarget.value, 10))}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('BLEND_STRENGTH')}: {blendStrength}%</div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.sqrt(blendStrength) * 10}
              onChange={e => {
                const sliderValue = parseInt(e.currentTarget.value, 10);
                const strength = Math.round((sliderValue / 10) ** 2);
                setBlendStrength(Math.max(0, Math.min(100, strength)));
              }}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('DRAWING_MODE')}:</div>
            <select
              className="w-full text-xs p-1 border border-modifier-border rounded bg-primary"
              value={drawingMode}
              onChange={e => setDrawingMode(e.target.value as 'normal' | 'spectral' | 'erase-soft')}
            >
              <option value="normal">{t('DRAWING_MODE_NORMAL')}</option>
              <option value="spectral">{t('DRAWING_MODE_SPECTRAL')}</option>
              <option value="erase-soft">{t('DRAWING_MODE_ERASE_SOFT')}</option>
            </select>
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
