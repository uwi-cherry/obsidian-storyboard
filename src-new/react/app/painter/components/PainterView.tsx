import React, { useEffect, useRef, useState } from 'react';
import { PainterView } from '../../../../obsidian-api/painter/painter-view';
import { useLayerContext } from '../../../context/LayerContext';
import { t } from '../../../../obsidian-i18n';
import LayerPanel from './LayerPanel';

interface PainterReactViewProps {
  view: PainterView;
  app: any;
}

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;
const DEFAULT_COLOR = '#000000';

// ActionMenuコンポーネントをインライン定義
const ActionMenu: React.FC<{
  handlers: {
    fill: () => void;
    clear: () => void;
    edit?: () => void;
    cancel?: () => void;
  };
  mode?: 'global' | 'selection' | 'hidden';
  position?: { x: number; y: number };
}> = ({ handlers, mode = 'global', position = { x: 8, y: 8 } }) => {
  if (mode === 'hidden') return null;

  return (
    <div
      className="absolute flex gap-1 bg-secondary border border-modifier-border p-1 rounded shadow-lg z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button 
        className="px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
        onClick={handlers.fill}
        title="塗りつぶし"
      >
        塗りつぶし
      </button>
      
      <button 
        className="px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
        onClick={handlers.clear}
        title="クリア"
      >
        クリア
      </button>
    </div>
  );
};

// ツールアイコン定義（SVG）
const TOOL_ICONS = {
  brush: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm2.5 3v8c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"/></svg>',
  eraser: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879z"/></svg>',
  selection: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 1a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V3h-3a1 1 0 0 1 0-2h4zM1 2a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H3v3a1 1 0 0 1-2 0V2zm13 12a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h3v-3a1 1 0 0 1 2 0v4zM2 14a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v3h3a1 1 0 0 1 0 2H2z"/></svg>',
  hand: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 1.5A1.5 1.5 0 0 0 7 3v9a1.5 1.5 0 0 0 3 0V8a.5.5 0 0 1 1 0v4a1.5 1.5 0 0 0 3 0V4a1.5 1.5 0 0 0-3 0v4a.5.5 0 0 1-1 0V3a1.5 1.5 0 0 0-1.5-1.5z"/></svg>'
};

const PainterReactView: React.FC<PainterReactViewProps> = ({ view, app }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { initializePainterData, layers, currentLayerIndex } = useLayerContext();
  
  // ツール状態
  const [currentTool, setCurrentTool] = useState('brush');
  const [lineWidth, setLineWidth] = useState(5);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  // UI状態
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'rect' | 'lasso' | 'magic'>('rect');
  
  // ポインター状態
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panLastX, setPanLastX] = useState(0);
  const [panLastY, setPanLastY] = useState(0);

  // ツール更新ハンドラー
  const updateTool = (toolId: string) => {
    setCurrentTool(toolId);
    setSelectionVisible(toolId === 'selection');
    
    // カーソルスタイル更新
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

  // ポインターイベントハンドラー
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (currentTool === 'hand') {
      setIsPanning(true);
      setPanLastX(e.clientX);
      setPanLastY(e.clientY);
      canvas.style.cursor = 'grabbing';
    } else if (['brush', 'eraser'].includes(currentTool)) {
      setIsDrawing(true);
      setLastX(x);
      setLastY(y);
      
      // 現在のレイヤーのキャンバスに描画開始
      const currentLayer = layers[currentLayerIndex];
      if (currentLayer) {
        const ctx = currentLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = color;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning && currentTool === 'hand') {
      const deltaX = e.clientX - panLastX;
      const deltaY = e.clientY - panLastY;
      
      // パン処理（実装は簡略化）
      setPanLastX(e.clientX);
      setPanLastY(e.clientY);
    } else if (isDrawing && ['brush', 'eraser'].includes(currentTool)) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const currentLayer = layers[currentLayerIndex];
      if (currentLayer) {
        const ctx = currentLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
      
      setLastX(x);
      setLastY(y);
      renderCanvas();
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setIsPanning(false);
    
    if (canvasRef.current && currentTool === 'hand') {
      canvasRef.current.style.cursor = 'grab';
    }
    
    // 履歴保存
    if (['brush', 'eraser'].includes(currentTool)) {
      view.saveHistory();
    }
  };

  // キャンバスレンダリング
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // レイヤーを順番に描画
    layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Action Menu ハンドラー
  const actionMenuHandlers = {
    fill: () => {
      const currentLayer = layers[currentLayerIndex];
      if (currentLayer) {
        const ctx = currentLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, currentLayer.canvas.width, currentLayer.canvas.height);
          renderCanvas();
          view.saveHistory();
        }
      }
    },
    clear: () => {
      const currentLayer = layers[currentLayerIndex];
      if (currentLayer) {
        const ctx = currentLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, currentLayer.canvas.width, currentLayer.canvas.height);
          renderCanvas();
          view.saveHistory();
        }
      }
    }
  };

  // 初期化エフェクト
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバス基本設定
    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    canvas.className = 'bg-transparent shadow-lg touch-none';

    // LayerContextを初期化
    initializePainterData(view);

    // ズームと回転の適用
    canvas.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
  }, [view, initializePainterData]);

  // ズームと回転の更新
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;
    }
  }, [zoom, rotation]);

  // レイヤー変更時のレンダリング
  useEffect(() => {
    renderCanvas();
  }, [layers, currentLayerIndex]);

  // ツール定義
  const TOOLS = [
    { id: 'brush', title: 'ブラシ', icon: TOOL_ICONS.brush },
    { id: 'eraser', title: '消しゴム', icon: TOOL_ICONS.eraser },
    { id: 'selection', title: '選択', icon: TOOL_ICONS.selection },
    { id: 'hand', title: 'ハンド', icon: TOOL_ICONS.hand },
  ] as const;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ツールパレット */}
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

      {/* ブラシと選択の設定 */}
      <div className="p-1 bg-secondary border-r border-modifier-border w-[200px] flex flex-col gap-2">
        {['brush', 'eraser'].includes(currentTool) && (
          <>
            {/* ブラシサイズ */}
            <div className="flex flex-col gap-1">
              <div className="text-text-muted text-xs">ブラシサイズ:</div>
              <input
                type="range"
                min={1}
                max={50}
                value={lineWidth}
                onChange={e => setLineWidth(parseInt(e.currentTarget.value, 10))}
              />
              <div className="text-xs text-center">{lineWidth}px</div>
            </div>

            {/* カラーピッカー */}
            <div className="flex flex-col items-center mt-2">
              <div className="text-text-muted text-xs mb-1">色:</div>
              <input
                type="color"
                className="w-8 h-8 p-0 border-2 border-modifier-border rounded cursor-pointer"
                value={color}
                onChange={e => setColor(e.currentTarget.value)}
              />
            </div>
          </>
        )}

        {/* 選択タイプ */}
        {selectionVisible && (
          <div className="flex flex-col gap-1 mt-4">
            <div className="text-text-muted text-xs">選択タイプ:</div>
            <select
              className="w-full text-xs"
              value={selectionType}
              onChange={e => {
                const val = e.currentTarget.value as 'rect' | 'lasso' | 'magic';
                setSelectionType(val);
              }}
            >
              <option value="rect">矩形選択</option>
              <option value="lasso">自由選択</option>
              <option value="magic">自動選択</option>
            </select>
          </div>
        )}

        {/* ハンドツール設定 */}
        {currentTool === 'hand' && (
          <div className="flex flex-col gap-1 mt-4 text-xs">
            <div className="text-text-muted">キャンバスサイズ:</div>
            <div>{DEFAULT_CANVAS_WIDTH} x {DEFAULT_CANVAS_HEIGHT}</div>
            
            <div className="text-text-muted mt-2">ズーム: {zoom}%</div>
            <input
              type="range"
              min={10}
              max={400}
              value={zoom}
              onChange={e => setZoom(parseInt(e.currentTarget.value, 10))}
            />
            
            <div className="text-text-muted mt-2">回転: {rotation}°</div>
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

      {/* キャンバスコンテナ */}
      <div className="flex-1 flex items-center justify-center overflow-auto bg-secondary relative">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
        <ActionMenu handlers={actionMenuHandlers} />
      </div>

      {/* レイヤーパネル */}
      <LayerPanel />
    </div>
  );
};

export default PainterReactView; 