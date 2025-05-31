import { t } from "src/constants/obsidian-i18n";
import { LayoutDirection, usePainterLayoutStore } from "src/storage/painter-layout-store";

interface ToolProps {
  tool: string;
  drawingMode: 'normal' | 'spectral' | 'erase-soft';
  lineWidth: number;
  selectionMode: 'rect' | 'lasso' | 'magic' | 'select-pen' | 'select-eraser';
  brushHasColor: boolean;
  brushOpacity: number;
  blendStrength: number;
  mixRatio: number;
  zoom: number;
  rotation: number;
  canvasWidth: number;
  canvasHeight: number;
  actualZoom?: number;
  maintainAspectRatio: boolean;
  resizeMode: 'canvas-only' | 'resize-content';
  setDrawingMode: (m: 'normal' | 'spectral' | 'erase-soft') => void;
  setLineWidth: (w: number) => void;
  setSelectionMode: (m: 'rect' | 'lasso' | 'magic' | 'select-pen' | 'select-eraser') => void;
  setBrushHasColor: (hasColor: boolean) => void;
  setBrushOpacity: (opacity: number) => void;
  setBlendStrength: (strength: number) => void;
  setMixRatio: (ratio: number) => void;
  setZoom: (z: number) => void;
  setRotation: (r: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setMaintainAspectRatio: (maintain: boolean) => void;
  setResizeMode: (mode: 'canvas-only' | 'resize-content') => void;
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
  canvasWidth,
  canvasHeight,
  actualZoom,
  maintainAspectRatio,
  resizeMode,
  setDrawingMode,
  setLineWidth,
  setSelectionMode,
  setBrushHasColor,
  setBrushOpacity,
  setBlendStrength,
  setMixRatio,
  setZoom,
  setRotation,
  setCanvasSize,
  setMaintainAspectRatio,
  setResizeMode,
  layoutDirection
}: ToolProps) {
  const { setLayoutDirection } = usePainterLayoutStore();

  const containerClass = layoutDirection === 'horizontal'
    ? "p-2 bg-secondary border-r border-modifier-border w-[250px] flex flex-col gap-2"
    : "p-2 bg-secondary border-b border-modifier-border flex flex-row gap-4 items-center flex-wrap";

  return (
    <div className={containerClass}>
      {tool === 'settings' && (
        <div className={layoutDirection === 'horizontal' ? "flex flex-col gap-2" : "flex flex-row gap-2 items-center"}>
          {/* レイアウト設定セクション */}
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('LAYOUT_SETTINGS')}:</div>
            <select
              className={layoutDirection === 'horizontal' ? "w-full text-xs p-1 border border-modifier-border rounded bg-primary" : "text-xs p-1 border border-modifier-border rounded bg-primary"}
              value={layoutDirection}
              onChange={e => setLayoutDirection(e.target.value as LayoutDirection)}
            >
              <option value="horizontal">{t('LAYOUT_HORIZONTAL')}</option>
              <option value="vertical">{t('LAYOUT_VERTICAL')}</option>
            </select>
          </div>
          
          {/* キャンバスサイズ設定セクション */}
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">キャンバスサイズ:</div>
            
            {/* 縦横比維持チェックボックス */}
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={maintainAspectRatio}
                onChange={e => setMaintainAspectRatio(e.target.checked)}
                className="w-3 h-3"
              />
              縦横比を維持
            </label>
            
            <div className={layoutDirection === 'horizontal' ? "flex flex-col gap-1" : "flex flex-row gap-2"}>
              <div className="flex items-center gap-1">
                <span className="text-xs">幅:</span>
                <input
                  type="number"
                  min={100}
                  max={4000}
                  step={10}
                  value={canvasWidth}
                  onChange={e => {
                    const newWidth = parseInt(e.target.value) || canvasWidth;
                    if (maintainAspectRatio) {
                      const aspectRatio = canvasWidth / canvasHeight;
                      const newHeight = Math.round(newWidth / aspectRatio);
                      setCanvasSize(newWidth, newHeight);
                    } else {
                      setCanvasSize(newWidth, canvasHeight);
                    }
                  }}
                  className="w-20 text-xs p-1 border border-modifier-border rounded bg-primary"
                />
                <span className="text-xs">px</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">高:</span>
                <input
                  type="number"
                  min={100}
                  max={4000}
                  step={10}
                  value={canvasHeight}
                  onChange={e => {
                    const newHeight = parseInt(e.target.value) || canvasHeight;
                    if (maintainAspectRatio) {
                      const aspectRatio = canvasWidth / canvasHeight;
                      const newWidth = Math.round(newHeight * aspectRatio);
                      setCanvasSize(newWidth, newHeight);
                    } else {
                      setCanvasSize(canvasWidth, newHeight);
                    }
                  }}
                  className="w-20 text-xs p-1 border border-modifier-border rounded bg-primary"
                />
                <span className="text-xs">px</span>
              </div>
            </div>
            
            {/* 画像処理モード選択 */}
            <div className="flex flex-col gap-1 mt-2">
              <div className="text-text-muted text-xs">画像の処理:</div>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="resizeMode"
                  value="canvas-only"
                  checked={resizeMode === 'canvas-only'}
                  onChange={e => setResizeMode(e.target.value as 'canvas-only' | 'resize-content')}
                  className="w-3 h-3"
                />
                キャンバスサイズのみ変更
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="resizeMode"
                  value="resize-content"
                  checked={resizeMode === 'resize-content'}
                  onChange={e => setResizeMode(e.target.value as 'canvas-only' | 'resize-content')}
                  className="w-3 h-3"
                />
                画像も縦横比を維持してリサイズ
              </label>
            </div>
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('SELECTION_TYPE')}:</div>
            <select
              className="w-full text-xs"
              value={selectionMode}
              onChange={e =>
                setSelectionMode(
                  e.currentTarget.value as
                    'rect' | 'lasso' | 'magic' | 'select-pen' | 'select-eraser'
                )
              }
            >
              <option value="rect">{t('SELECT_RECT')}</option>
              <option value="lasso">{t('SELECT_LASSO')}</option>
              <option value="magic">{t('SELECT_MAGIC')}</option>
              <option value="select-pen">{t('SELECT_PEN')}</option>
              <option value="select-eraser">{t('SELECT_ERASER')}</option>
            </select>
          </div>
          
          {(selectionMode === 'select-pen' || selectionMode === 'select-eraser') && (
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
          )}
        </div>
      )}

      {tool === 'hand' && (
        <div className={layoutDirection === 'horizontal' ? "flex flex-col gap-2" : "flex flex-row gap-4"}>
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('ZOOM_LEVEL')}: {actualZoom !== undefined ? actualZoom : zoom}%</div>
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
