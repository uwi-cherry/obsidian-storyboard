import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../../constants';
import { t } from '../../i18n';
import type { PainterView } from './painter-obsidian-view';
import { ActionMenuController } from '../controller/action-menu-controller';
import { SelectionController } from '../controller/selection-controller';
import { useSelectionState } from '../hooks/useSelectionState';
import { TOOL_ICONS } from 'src/icons';

interface PainterReactViewProps {
  /**
   * Obsidian の FileView を継承した PainterView。
   * Obsidian API 依存の箇所は PainterView に残し、
   * 本コンポーネントは純粋な UI 操作のみを担当する。
   */
  view: PainterView;
}

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
  // 現在のツール, ブラシ幅, カラーなどは view の state を参照する
  const [, forceUpdate] = useState(0); // view プロパティ変更時の再描画用（簡易）
  const selectionState = useSelectionState();
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'rect' | 'lasso' | 'magic'>('rect');

  /* ──────────────── Helpers ──────────────── */
  const reRender = () => forceUpdate(v => v + 1);

  const updateTool = (toolId: string) => {
    view.currentTool = toolId as any; // 型安全は view 側で管理
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
    reRender();
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

        view.psdDataHistory[0].layers = [
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
        {TOOLS.map(tool => {
          const isActive = view.currentTool === tool.id;
          return (
            <button
              key={tool.id}
              className={`w-10 h-10 border-none bg-primary text-text-normal rounded cursor-pointer flex items-center justify-center hover:bg-modifier-hover ${
                isActive ? 'bg-accent text-on-accent' : ''
              }`}
              title={tool.title}
              onClick={() => updateTool(tool.id)}
              dangerouslySetInnerHTML={{ __html: tool.icon }}
            />
          );
        })}
      </div>

      {/* ── Brush & Selection Settings ── */}
      <div className="p-1 bg-secondary border-r border-modifier-border w-[200px] flex flex-col gap-2">
        {/* Brush Size */}
        <div className="flex flex-col gap-1">
          <div className="text-text-muted text-xs">{t('BRUSH_SIZE')}:</div>
          <input
            type="range"
            min={1}
            max={50}
            value={view.currentLineWidth}
            onChange={e => {
              view.currentLineWidth = parseInt(e.currentTarget.value, 10);
              reRender();
            }}
          />
        </div>

        {/* Color Picker */}
        <div className="flex flex-col items-center mt-2">
          <input
            type="color"
            className="w-8 h-8 p-0 border-2 border-modifier-border rounded cursor-pointer"
            value={view.currentColor}
            onChange={e => {
              view.currentColor = e.currentTarget.value;
              reRender();
            }}
          />
        </div>

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
      </div>

      {/* ── Canvas Container ── */}
      <div className="flex-1 flex items-center justify-center overflow-auto bg-primary">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default PainterReactView;
