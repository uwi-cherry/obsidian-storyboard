import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../../constants';
import { t } from '../../i18n';
import { TFile } from 'obsidian';
import { ActionMenuController } from '../controller/action-menu-controller';
import { SelectionController } from '../controller/selection-controller';
import { useSelectionState } from '../hooks/useSelectionState';
import { TOOL_ICONS } from 'src/icons';
import type { LayersState } from '../hooks/useLayers';
import type { SelectionState } from '../hooks/useSelectionState';

interface PainterReactViewProps {
  // Canvas 関連
  setCanvas: (canvas: HTMLCanvasElement) => void;
  renderCanvas: () => void;
  getCanvasSize: () => { width: number; height: number };
  
  // ポインタイベント
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  
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
 * 純粋なUIコンポーネント。必要なデータとメソッドを個別に受け取り、
 * Obsidian APIや複雑な状態管理から独立している。
 */
const PainterReactView: React.FC<PainterReactViewProps> = ({ 
  setCanvas,
  renderCanvas,
  getCanvasSize,
  onPointerDown,
  onPointerMove,
  onPointerUp,
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
  const selectionState = useSelectionState();
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'rect' | 'lasso' | 'magic'>('rect');
  const [selectionController, setSelectionController] = useState<SelectionController | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuController | null>(null);

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
  // マウント時 – Canvas, SelectionController, ActionMenu 等の初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log('PainterReactView: Canvas initialized', canvas);

    // キャンバス基本設定
    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    canvas.className = 'bg-transparent shadow-lg touch-none';

    // Canvas を親コンポーネントに通知
    setCanvas(canvas);
    console.log('PainterReactView: setCanvas called');

    // ポインタ関連イベント
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    // Canvas transform適用
    canvas.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;

    // ファイル読み込み or 背景レイヤー作成
    (async () => {
      console.log('PainterReactView: Initializing layers', { file, layers });
      
      if (file && loadAndRenderFile) {
        await loadAndRenderFile(file);
      } else {
        // 背景レイヤーを作成
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = DEFAULT_CANVAS_WIDTH;
        bgCanvas.height = DEFAULT_CANVAS_HEIGHT;
        const bgCtx = bgCanvas.getContext('2d');
        if (bgCtx) {
          bgCtx.fillStyle = 'white';
          bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        }

        // レイヤーが初期化されているかチェック
        if (!layers?.history?.[0]) {
          console.error('PainterReactView: Layers not properly initialized');
          return;
        }

        const newLayers = {
          ...layers,
          history: [{
            ...layers.history[0],
            layers: [{
              name: t('BACKGROUND'),
              visible: true,
              opacity: 1,
              blendMode: 'normal' as const,
              canvas: bgCanvas,
            }]
          }]
        };
        
        setLayers(newLayers);
        
        console.log('PainterReactView: Background layer created, calling renderCanvas');
        renderCanvas();
      }
    })();

    return () => {
      // クリーンアップ
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      actionMenu?.dispose();
    };
  }, []); // 初期化は一度だけ

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
                selectionController?.setMode(val);
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
              {getCanvasSize().width} x {getCanvasSize().height}
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
