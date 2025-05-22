import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../../constants';
import { t } from '../../i18n';
import { TFile } from 'obsidian';
import { TOOL_ICONS } from 'src/icons';
import type { LayersState } from '../hooks/useLayers';
import { BLEND_MODE_TO_COMPOSITE_OPERATION } from '../../constants';

interface PainterReactViewProps {
  // ファイル関連
  file?: TFile;
  loadAndRenderFile?: (file: TFile) => Promise<void>;
  
  // 状態管理
  layers: LayersState;
  setLayers: (layers: LayersState) => void;
  
  // 描画設定
  currentColor: string;
  setCurrentColor: (color: string) => void;
  currentLineWidth: number;
  setCurrentLineWidth: (width: number) => void;
  currentTool: string;
  setCurrentTool: (tool: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  rotation: number;
  setRotation: (rotation: number) => void;
}

/**
 * PainterReactView
 *
 * Canvas管理と描画を内部で完結させるシンプルなUIコンポーネント
 */
const PainterReactView: React.FC<PainterReactViewProps> = ({ 
  file,
  loadAndRenderFile,
  layers,
  setLayers,
  currentColor,
  setCurrentColor,
  currentLineWidth,
  setCurrentLineWidth,
  currentTool,
  setCurrentTool,
  zoom,
  setZoom,
  rotation,
  setRotation,
}) => {
  /* ──────────────── Refs & States ──────────────── */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'rect' | 'lasso' | 'magic'>('rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  /* ──────────────── Canvas Rendering ──────────────── */
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('renderCanvas: canvas ref is null');
      return;
    }

    console.log('renderCanvas: starting render', { 
      canvasSize: `${canvas.width}x${canvas.height}`, 
      layerCount: layers.history[layers.currentIndex]?.layers?.length ?? 0 
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('renderCanvas: could not get 2d context');
      return;
    }

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // チェック柄の背景を描画
    const checkSize = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    for (let y = 0; y < canvas.height; y += checkSize * 2) {
      for (let x = 0; x < canvas.width; x += checkSize * 2) {
        ctx.fillRect(x + checkSize, y, checkSize, checkSize);
        ctx.fillRect(x, y + checkSize, checkSize, checkSize);
      }
    }

    // レイヤーを描画
    const currentLayers = layers.history[layers.currentIndex]?.layers ?? [];
    console.log('renderCanvas: drawing layers', currentLayers);
    
    for (let i = currentLayers.length - 1; i >= 0; i--) {
      const layer = currentLayers[i];
      if (layer.visible && layer.canvas) {
        ctx.globalAlpha = layer.opacity ?? 1;
        ctx.globalCompositeOperation = BLEND_MODE_TO_COMPOSITE_OPERATION[layer.blendMode] ?? 'source-over';
        ctx.drawImage(layer.canvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    }

    console.log('renderCanvas: completed');
  };

  /* ──────────────── Layer Initialization ──────────────── */
  const initializeDefaultLayer = () => {
    if (layers.history[0]?.layers?.length > 0) {
      console.log('initializeDefaultLayer: layers already exist');
      return;
    }

    console.log('initializeDefaultLayer: creating background layer');
    
    // 背景レイヤーを作成
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = DEFAULT_CANVAS_WIDTH;
    bgCanvas.height = DEFAULT_CANVAS_HEIGHT;
    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) {
      bgCtx.fillStyle = 'white';
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    }

    const newLayers = {
      ...layers,
      history: [{
        layers: [{
          name: t('BACKGROUND'),
          visible: true,
          opacity: 1,
          blendMode: 'normal' as const,
          canvas: bgCanvas,
        }]
      }],
      currentIndex: 0,
      currentLayerIndex: 0
    };
    
    setLayers(newLayers);
  };

  /* ──────────────── Helpers ──────────────── */
  const updateTool = (toolId: string) => {
    setCurrentTool(toolId);
    setSelectionVisible(toolId === 'selection');
    // カーソルスタイル
    if (canvasRef.current) {
      if (['brush', 'eraser', 'selection'].includes(toolId)) {
        canvasRef.current.style.cursor = 'crosshair';
      } else if (toolId === 'hand') {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  /* ──────────────── Effects ──────────────── */
  // Canvas初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log('PainterReactView: Canvas mounted', canvas);

    // キャンバス基本設定
    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    canvas.className = 'bg-transparent shadow-lg touch-none';

    // 初期レイヤー作成
    if (!file) {
      initializeDefaultLayer();
    }
  }, []);

  // Layers変更時にcanvasを再描画
  useEffect(() => {
    console.log('PainterReactView: Layers changed, re-rendering canvas');
    renderCanvas();
  }, [layers]);

  // Canvas transform の更新
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
    }
  }, [zoom, rotation]);

  // ツールの定義
  const TOOLS = [
      { id: 'brush', title: t('TOOL_BRUSH'), icon: TOOL_ICONS.brush },
      { id: 'eraser', title: t('TOOL_ERASER'), icon: TOOL_ICONS.eraser },
      { id: 'selection', title: t('TOOL_SELECTION'), icon: TOOL_ICONS.selection },
      { id: 'hand', title: t('TOOL_HAND'), icon: TOOL_ICONS.hand },
  ] as const;

  /* ──────────────── JSX ──────────────── */
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Tool Palette ── */}
      <div className="w-[60px] bg-secondary border-r border-modifier-border flex flex-col gap-1 p-1">
        {TOOLS.map(toolBtn => {
          const isActive = currentTool === toolBtn.id;
          return (
            <button
              key={toolBtn.id}
              className={`w-10 h-10 border-none bg-primary text-text-normal rounded cursor-pointer flex items-center justify-center hover:bg-modifier-hover ${
                isActive ? 'bg-accent text-on-accent' : ''
              }`}
              title={toolBtn.title}
              onClick={() => updateTool(toolBtn.id)}
              dangerouslySetInnerHTML={{ __html: toolBtn.icon }}
            />
          );
        })}
      </div>

      {/* ── Brush & Selection Settings ── */}
      <div className="p-1 bg-secondary border-r border-modifier-border w-[200px] flex flex-col gap-2">
      {['brush', 'eraser'].includes(currentTool) && (
        <>
          {/* Brush Size */}
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}:</div>
            <input
              type="range"
              min={1}
              max={50}
              value={currentLineWidth}
              onChange={e => {
                setCurrentLineWidth(parseInt(e.currentTarget.value, 10));
              }}
            />
          </div>

          {/* Color Picker */}
          <div className="flex flex-col items-center mt-2">
            <input
              type="color"
              className="w-8 h-8 p-0 border-2 border-modifier-border rounded cursor-pointer"
              value={currentColor}
              onChange={e => {
                setCurrentColor(e.currentTarget.value);
              }}
            />
          </div>
        </>
      )}

        {/* Selection Type */}
        {selectionVisible && (
          <div className="flex flex-col gap-1 mt-4">
            <div className="text-text-muted text-xs">{t('SELECTION_TYPE')}:</div>
            <select
              className="w-full text-xs"
              value={selectionType}
              onChange={e => {
                const val = e.currentTarget.value as 'rect' | 'lasso' | 'magic';
                setSelectionType(val);
                updateTool('selection'); // selection モードに固定
              }}
            >
              <option value="rect">{t('SELECT_RECT')}</option>
              <option value="lasso">{t('SELECT_LASSO')}</option>
              <option value="magic">{t('SELECT_MAGIC')}</option>
            </select>
          </div>
        )}

        {currentTool === 'hand' && (
          <div className="flex flex-col gap-1 mt-4 text-xs">
            <div className="text-text-muted">{t('CANVAS_SIZE')}:</div>
            <div>
              {DEFAULT_CANVAS_WIDTH} x {DEFAULT_CANVAS_HEIGHT}
            </div>
            <div className="text-text-muted mt-2">{t('ZOOM_LEVEL')}: {zoom}%</div>
            <input
              type="range"
              min={10}
              max={400}
              value={zoom}
              onChange={e => {
                setZoom(parseInt(e.currentTarget.value, 10));
              }}
            />
            <div className="text-text-muted mt-2">{t('ROTATION_ANGLE')}: {rotation}°</div>
            <input
              type="range"
              min={-180}
              max={180}
              value={rotation}
              onChange={e => {
                setRotation(parseInt(e.currentTarget.value, 10));
              }}
            />
          </div>
        )}
      </div>

      {/* ── Canvas Container ── */}
      <div className="flex-1 flex items-center justify-center overflow-auto bg-secondary">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default PainterReactView;
