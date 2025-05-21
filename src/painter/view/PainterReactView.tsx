import React, { useEffect, useRef, useState } from 'react';
import { useCanvasTransform } from '../hooks/useCanvasTransform';
import { usePainterPointer } from '../hooks/usePainterPointer';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../../constants';
import { t } from '../../i18n';
import type { PainterReactViewProps } from './painter-react-view-interface';
import { ActionMenuController } from '../controller/action-menu-controller';
import { SelectionController } from '../controller/selection-controller';
import { useSelectionState } from '../hooks/useSelectionState';
import { useLayers } from '../hooks/useLayers';
import { TOOL_ICONS } from 'src/icons';

/**
 * PainterReactView
 *
 * これまで FileView#onOpen 内で手続き的に組み立てていた
 * DOM/UI 操作を React コンポーネントとして再実装したもの。
 *
 * Obsidian API と直接やり取りする必要のない処理は全てここに集約し、
 * ビュー側からは <PainterReactView view={this} /> をレンダリングするだけにする。
 */
const PainterReactView: React.FC<PainterReactViewProps> = ({ view }) => {
  /* ──────────────── Refs & States ──────────────── */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { zoom, rotation, setZoom, setRotation } = useCanvasTransform(
    canvasRef.current,
    view
  );
  const selectionState = useSelectionState();
  const layersState = useLayers();
  const {
    tool,
    lineWidth,
    color,
    setTool,
    setLineWidth,
    setColor,
  } = usePainterPointer(view);
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'rect' | 'lasso' | 'magic'>('rect');

  /* ──────────────── Helpers ──────────────── */
  const updateTool = (toolId: string) => {
    setTool(toolId);
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

    // キャンバス基本設定
    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    canvas.className = 'bg-transparent shadow-lg touch-none';

    // PainterView へキャンバス DOM を紐付け
    (view as any)._canvas = canvas;

    // ポインタ関連イベント（PainterView 内部実装を使う）
    const onPointerDown = (e: PointerEvent) => (view as any).handlePointerDown(e);
    const onPointerMove = (e: PointerEvent) => (view as any).handlePointerMove(e);
    const onPointerUp = (e: PointerEvent) => (view as any).handlePointerUp(e);

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    // SelectionController と状態を初期化
    (view as any)._selectionState = selectionState;
    (view as any).layers = layersState;
    if (!(view as any)._selectionController) {
      (view as any)._selectionController = new SelectionController(view, selectionState);
    }

    const actionMenu = new ActionMenuController(view, selectionState);
    view.actionMenu = actionMenu;
    const resizeHandler = () => actionMenu.showGlobal();
    window.addEventListener('resize', resizeHandler);
    actionMenu.showGlobal();

    // ファイル読み込み or 背景レイヤー作成
    (async () => {
      if (view.file) {
        await (view as any)._loadAndRenderFile(view.file);
      } else {
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = DEFAULT_CANVAS_WIDTH;
        bgCanvas.height = DEFAULT_CANVAS_HEIGHT;
        const bgCtx = bgCanvas.getContext('2d');
        if (bgCtx) {
          bgCtx.fillStyle = 'white';
          bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        }

        view.layers.history[0].layers = [
          {
            name: t('BACKGROUND'),
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            canvas: bgCanvas,
          },
        ];
        view.renderCanvas();
      }
    })();

    return () => {
      // クリーンアップ
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      actionMenu.dispose();
      window.removeEventListener('resize', resizeHandler);
    };
  }, [view]);
  // ツールの定義
  let TOOLS = [
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
          const isActive = tool === toolBtn.id;
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
      {['brush', 'eraser'].includes(tool) && (
        <>
          {/* Brush Size */}
          <div className="flex flex-col gap-1">
            <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}:</div>
            <input
              type="range"
              min={1}
              max={50}
              value={lineWidth}
              onChange={e => {
                setLineWidth(parseInt(e.currentTarget.value, 10));
              }}
            />
          </div>

          {/* Color Picker */}
          <div className="flex flex-col items-center mt-2">
            <input
              type="color"
              className="w-8 h-8 p-0 border-2 border-modifier-border rounded cursor-pointer"
              value={color}
              onChange={e => {
                setColor(e.currentTarget.value);
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
                view.selectionController?.setMode(val);
                updateTool('selection'); // selection モードに固定
              }}
            >
              <option value="rect">{t('SELECT_RECT')}</option>
              <option value="lasso">{t('SELECT_LASSO')}</option>
              <option value="magic">{t('SELECT_MAGIC')}</option>
            </select>
          </div>
        )}

        {tool === 'hand' && (
          <div className="flex flex-col gap-1 mt-4 text-xs">
            <div className="text-text-muted">{t('CANVAS_SIZE')}:</div>
            <div>
              {view.getCanvasSize().width} x {view.getCanvasSize().height}
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
