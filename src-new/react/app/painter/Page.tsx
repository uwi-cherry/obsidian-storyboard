import React, { useEffect, useRef, useState } from 'react';
import { useLayerContext } from '../../context/LayerContext';
import usePainterPointer from '../../hooks/usePainterPointer';
import useCanvasTransform from '../../hooks/useCanvasTransform';
import { TOOL_ICONS } from '../../../icons';
import { t } from '../../../obsidian-i18n';

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

export default function PainterReactView() {
  const { view, layers, currentLayerIndex, setLayers, setCurrentLayerIndex } = useLayerContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = usePainterPointer();
  const { zoom, rotation, setZoom, setRotation } = useCanvasTransform(canvasRef.current, view);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  // ツールの定義
  const TOOLS = [
    { id: 'brush', title: t('TOOL_BRUSH') || 'ブラシ', icon: TOOL_ICONS.brush },
    { id: 'eraser', title: t('TOOL_ERASER') || '消しゴム', icon: TOOL_ICONS.eraser },
    { id: 'selection', title: t('TOOL_SELECTION') || '選択', icon: TOOL_ICONS.selection },
    { id: 'hand', title: t('TOOL_HAND') || '手のひら', icon: TOOL_ICONS.hand }
  ];

  // キャンバス初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    canvas.className = 'bg-white shadow-lg touch-none border border-modifier-border';

    // viewにキャンバスを設定
    if (view) {
      view._canvas = canvas;
    }

    // 初期レイヤーがない場合は作成
    if (layers.length === 0) {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = DEFAULT_CANVAS_WIDTH;
      bgCanvas.height = DEFAULT_CANVAS_HEIGHT;
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        bgCtx.fillStyle = 'white';
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      }

      setLayers([{
        name: t('BACKGROUND') || '背景',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        canvas: bgCanvas
      }]);
    }

    renderCanvas();
  }, []);

  // レイヤー変更時の再描画
  useEffect(() => {
    renderCanvas();
  }, [layers, currentLayerIndex]);

  // キャンバス描画
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // レイヤーを描画
    layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        try {
          ctx.drawImage(layer.canvas, 0, 0);
        } catch (error) {
          console.error('Failed to draw layer:', layer.name, error);
        }
      }
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // 描画開始
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);

    if (['brush', 'eraser'].includes(pointer.tool)) {
      const layer = layers[currentLayerIndex];
      if (layer?.canvas) {
        const layerCtx = layer.canvas.getContext('2d');
        if (layerCtx) {
          layerCtx.lineWidth = pointer.lineWidth;
          layerCtx.lineCap = 'round';
          layerCtx.lineJoin = 'round';
        }
      }
      view?.saveHistory?.();
    }
  };

  // 描画中
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const layer = layers[currentLayerIndex];
    if (!layer?.canvas) return;

    const layerCtx = layer.canvas.getContext('2d');
    if (!layerCtx) return;

    layerCtx.beginPath();
    layerCtx.moveTo(lastX, lastY);
    layerCtx.lineTo(x, y);

    if (pointer.tool === 'brush') {
      layerCtx.strokeStyle = pointer.color;
      layerCtx.globalCompositeOperation = 'source-over';
    } else if (pointer.tool === 'eraser') {
      layerCtx.globalCompositeOperation = 'destination-out';
    }

    layerCtx.stroke();
    layerCtx.globalCompositeOperation = 'source-over';

    setLastX(x);
    setLastY(y);

    // レイヤー更新を通知
    setLayers([...layers]);
  };

  // 描画終了
  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      view?.saveHistory?.();
    }
  };

  // ツール切り替え
  const updateTool = (toolId: string) => {
    pointer.setTool(toolId);
    
    // カーソルスタイル変更
    const canvas = canvasRef.current;
    if (canvas) {
      if (['brush', 'eraser', 'selection'].includes(toolId)) {
        canvas.style.cursor = 'crosshair';
      } else if (toolId === 'hand') {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  return (
    <div className="w-full h-full flex bg-primary">
      {/* ツールバー */}
      <div className="w-[60px] bg-secondary border-r border-modifier-border flex flex-col gap-1 p-1">
        {TOOLS.map(toolBtn => {
          const isActive = pointer.tool === toolBtn.id;
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

      {/* ツールプロパティ */}
      <div className="p-1 bg-secondary border-r border-modifier-border w-[200px] flex flex-col gap-2">
        {['brush', 'eraser'].includes(pointer.tool) && (
          <>
            {/* ブラシサイズ */}
            <div className="flex flex-col gap-1">
              <div className="text-text-muted text-xs">{t('BRUSH_SIZE') || 'ブラシサイズ'}:</div>
              <input
                type="range"
                min={1}
                max={50}
                value={pointer.lineWidth}
                onChange={e => pointer.setLineWidth(parseInt(e.currentTarget.value, 10))}
              />
              <div className="text-text-muted text-xs text-center">{pointer.lineWidth}px</div>
            </div>

            {/* カラーピッカー */}
            {pointer.tool === 'brush' && (
              <div className="flex flex-col items-center mt-2">
                <label className="text-text-muted text-xs mb-1">{t('COLOR') || '色'}:</label>
                <input
                  type="color"
                  className="w-8 h-8 p-0 border-2 border-modifier-border rounded cursor-pointer"
                  value={pointer.color}
                  onChange={e => pointer.setColor(e.currentTarget.value)}
                />
              </div>
            )}
          </>
        )}

        {pointer.tool === 'hand' && (
          <div className="flex flex-col gap-1 mt-4 text-xs">
            <div className="text-text-muted">{t('ZOOM_LEVEL') || 'ズーム'}: {zoom}%</div>
            <input
              type="range"
              min={10}
              max={400}
              value={zoom}
              onChange={e => setZoom(parseInt(e.currentTarget.value, 10))}
            />
            <div className="text-text-muted mt-2">{t('ROTATION_ANGLE') || '回転'}: {rotation}°</div>
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

      {/* キャンバス領域 */}
      <div className="flex-1 flex items-center justify-center overflow-auto bg-secondary">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center'
          }}
        />
      </div>
    </div>
  );
}
