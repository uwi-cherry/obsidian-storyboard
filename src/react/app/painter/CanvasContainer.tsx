import { useState, useRef } from 'react';
import type { PainterView } from '../../../types/painter-types';
import { usePainterLayoutStore } from '../../../zustand/storage/painter-layout-store';
import { PainterPointer } from '../../hooks/usePainterPointer';
import useSelectionState, { SelectionState } from '../../hooks/useSelectionState';
import ActionProperties from './features/ActionProperties';
import Canvas from './features/Canvas';
import ColorProperties from './features/ColorProperties';
import ToolProperties from './features/ToolProperties';

import TransformEditOverlay from './features/TransformEditOverlay';
import { useLayersStore } from '../../../zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../zustand/store/painter-history-store';
import type { SelectionRect } from '../../../types/ui';
import { toolRegistry } from '../../../service-api/core/tool-registry';

interface Props {
  pointer: PainterPointer;
  view?: PainterView;
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
}

export default function CanvasContainer({
  pointer,
  view,
  zoom,
  rotation,
  setZoom,
  setRotation
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { layoutDirection } = usePainterLayoutStore();
  const selectionState = useSelectionState();
  const [menuMode, setMenuMode] = useState<'hidden' | 'global' | 'selection'>('global');
  const [menuPos, setMenuPos] = useState({ x: 8, y: 8 });
  const [editRect, setEditRect] = useState<SelectionRect | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
  const [resizeMode, setResizeMode] = useState<'canvas-only' | 'resize-content'>('canvas-only');
  const [actualZoom, setActualZoom] = useState<number>(zoom);

  const { layers } = useLayersStore();
  const { currentLayerIndex } = useCurrentLayerIndexStore();
  const { saveHistory } = usePainterHistoryStore();

  const resizeLayerCanvas = (layer: any, oldWidth: number, oldHeight: number, newWidth: number, newHeight: number, mode: 'canvas-only' | 'resize-content') => {
    if (!layer.canvas) return layer;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    const newCtx = newCanvas.getContext('2d');
    if (!newCtx) return layer;

    if (mode === 'canvas-only') {
      // キャンバスサイズのみ変更：画像をそのまま描画
      newCtx.drawImage(layer.canvas, 0, 0);
    } else {
      // 画像も縦横比を維持してリサイズ
      const scaleX = newWidth / oldWidth;
      const scaleY = newHeight / oldHeight;
      const scale = Math.min(scaleX, scaleY); // 縦横比を維持するため小さい方を使用
      
      const scaledWidth = oldWidth * scale;
      const scaledHeight = oldHeight * scale;
      const offsetX = (newWidth - scaledWidth) / 2;
      const offsetY = (newHeight - scaledHeight) / 2;
      
      newCtx.drawImage(layer.canvas, offsetX, offsetY, scaledWidth, scaledHeight);
    }

    return {
      ...layer,
      canvas: newCanvas
    };
  };

  const handleCanvasSizeChange = (width: number, height: number) => {
    const oldWidth = canvasSize.width;
    const oldHeight = canvasSize.height;
    
    setCanvasSize({ width, height });
    
    // viewのキャンバスサイズを更新
    if (view && view._painterData) {
      view._painterData.canvasWidth = width;
      view._painterData.canvasHeight = height;
      
      // タイトルを更新
      view.updateTitle?.(width, height, zoom);
    }

    // レイヤーの画像処理
    if (resizeMode === 'resize-content') {
      const layersStore = useLayersStore.getState();
      const historyStore = usePainterHistoryStore.getState();
      
      // ヒストリーに保存
      historyStore.saveHistory(layersStore.layers, currentLayerIndex);
      
      // 全レイヤーをリサイズ
      const resizedLayers = layersStore.layers.map(layer => 
        resizeLayerCanvas(layer, oldWidth, oldHeight, width, height, resizeMode)
      );
      
      layersStore.updateLayers(resizedLayers);
    }
  };

  const handleSelectionStart = () => {
    setMenuMode('hidden');
  };

  const handleSelectionUpdate = () => {
    // setSelectionVersionは削除されたので、この行は不要
  };

  const handleSelectionEnd = () => {
    const rect = selectionState.getBoundingRect();
    if (rect) {
      setMenuPos({ x: rect.x, y: rect.y - 28 });
      setMenuMode('selection');
    } else {
      setMenuMode('global');
    }
  };

  const cancelSelection = () => {
    selectionState.reset();
    // setSelectionVersionは削除されたので、この行は不要
    setMenuMode('global');
  };

  const startEdit = () => {
    const boundingRect = selectionState.getBoundingRect();
    let rect = boundingRect;
    if (!rect) {
      if (view?._canvas) {
        rect = { x: 0, y: 0, width: view._canvas.width, height: view._canvas.height };
      }
    }
    if (!rect) return;
    setEditRect(rect);
    selectionState.reset();
    setMenuMode('hidden');
  };

  const finishEdit = () => {
    setEditRect(null);
    setMenuMode('global');
  };

  const actionHandlers = {
    fill: () => {
      const layersStore = useLayersStore.getState();
      const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
      const historyStore = usePainterHistoryStore.getState();

      const layers = layersStore.layers;
      const index = currentLayerIndexStore.currentLayerIndex;
      const layer = layers[index];
      if (!layer || !layer.canvas) return;

      historyStore.saveHistory(layers, index);

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();

      if (selectionState.mode === 'rect' && selectionState.selectionRect) {
        const rect = selectionState.selectionRect;
        ctx.fillStyle = pointer.color;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      } else if (selectionState.mode === 'lasso' && selectionState.lassoPoints.length > 2) {
        ctx.beginPath();
        ctx.moveTo(selectionState.lassoPoints[0].x, selectionState.lassoPoints[0].y);
        for (let i = 1; i < selectionState.lassoPoints.length; i++) {
          const p = selectionState.lassoPoints[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.clip();
        
        const boundingRect = selectionState.getBoundingRect();
        if (boundingRect) {
          ctx.fillStyle = pointer.color;
          ctx.fillRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else if (selectionState.mode === 'magic' && selectionState.magicClipPath) {
        ctx.clip(selectionState.magicClipPath);
        
        const boundingRect = selectionState.magicBounding;
        if (boundingRect) {
          ctx.fillStyle = pointer.color;
          ctx.fillRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else {
        ctx.fillStyle = pointer.color;
        ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
      }

      ctx.restore();
      layersStore.updateLayers([...layers]);
    },
    clear: () => {
      const layersStore = useLayersStore.getState();
      const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
      const historyStore = usePainterHistoryStore.getState();

      const layers = layersStore.layers;
      const index = currentLayerIndexStore.currentLayerIndex;
      const layer = layers[index];
      if (!layer || !layer.canvas) return;

      historyStore.saveHistory(layers, index);

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();

      if (selectionState.mode === 'rect' && selectionState.selectionRect) {
        const rect = selectionState.selectionRect;
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      } else if (selectionState.mode === 'lasso' && selectionState.lassoPoints.length > 2) {
        ctx.beginPath();
        ctx.moveTo(selectionState.lassoPoints[0].x, selectionState.lassoPoints[0].y);
        for (let i = 1; i < selectionState.lassoPoints.length; i++) {
          const p = selectionState.lassoPoints[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.clip();
        
        const boundingRect = selectionState.getBoundingRect();
        if (boundingRect) {
          ctx.clearRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else if (selectionState.mode === 'magic' && selectionState.magicClipPath) {
        ctx.clip(selectionState.magicClipPath);
        
        const boundingRect = selectionState.magicBounding;
        if (boundingRect) {
          ctx.clearRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else {
        ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      }

      ctx.restore();
      layersStore.updateLayers([...layers]);
    },
    generativeFill: async () => {
      const plugin: any = (window as any).app?.plugins?.getPlugin('obsidian-storyboard');
      const settings = plugin?.settingsPlugin?.settings;
      const provider: 'fal' | 'replicate' = settings?.provider || 'fal';
      const apiKey: string = provider === 'fal' ? settings?.falApiKey : settings?.replicateApiKey;
      if (!apiKey) {
        alert('APIキーが設定されていません');
        return;
      }
      const prompt = window.prompt('生成プロンプトを入力してください');
      if (!prompt) return;

      const width = canvasSize.width;
      const height = canvasSize.height;

      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = width;
      baseCanvas.height = height;
      const bctx = baseCanvas.getContext('2d');
      if (!bctx) return;
      layers.forEach(layer => {
        if (layer.visible && layer.canvas) {
          const alpha = layer.opacity !== undefined ? layer.opacity : 1;
          const blend = layer.blendMode && layer.blendMode !== 'normal' ? layer.blendMode as GlobalCompositeOperation : 'source-over';
          bctx.globalAlpha = alpha;
          bctx.globalCompositeOperation = blend;
          bctx.drawImage(layer.canvas, 0, 0);
        }
      });
      bctx.globalAlpha = 1;
      bctx.globalCompositeOperation = 'source-over';
      const imageDataUrl = baseCanvas.toDataURL('image/png');

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const mctx = maskCanvas.getContext('2d');
      if (!mctx) return;
      mctx.fillStyle = 'black';
      mctx.fillRect(0, 0, width, height);
      mctx.fillStyle = 'white';
      if (selectionState.mode === 'rect' && selectionState.selectionRect) {
        const r = selectionState.selectionRect;
        mctx.fillRect(r.x, r.y, r.width, r.height);
      } else if (selectionState.mode === 'lasso' && selectionState.lassoPoints.length > 2) {
        mctx.beginPath();
        mctx.moveTo(selectionState.lassoPoints[0].x, selectionState.lassoPoints[0].y);
        for (let i = 1; i < selectionState.lassoPoints.length; i++) {
          const p = selectionState.lassoPoints[i];
          mctx.lineTo(p.x, p.y);
        }
        mctx.closePath();
        mctx.fill();
      } else if (selectionState.mode === 'magic' && selectionState.magicClipPath) {
        mctx.fill(selectionState.magicClipPath);
      } else {
        mctx.fillRect(0, 0, width, height);
      }
      const maskDataUrl = maskCanvas.toDataURL('image/png');

      await toolRegistry.executeTool('generative_fill', {
        prompt,
        apiKey,
        provider,
        app: (window as any).app,
        image: imageDataUrl,
        mask: maskDataUrl,
        width,
        height
      });
    },
    edit: startEdit,
    cancel: cancelSelection
  };

  const containerClass = layoutDirection === 'horizontal' 
    ? "flex flex-1 w-full h-full overflow-hidden"
    : "flex flex-col flex-1 w-full h-full overflow-hidden";

  const propertiesContainerClass = layoutDirection === 'horizontal' 
    ? "flex flex-col"
    : "flex flex-row border-b border-modifier-border";

  return (
    <div className={containerClass}>
      <div className={propertiesContainerClass}>
        <ToolProperties
          tool={pointer.tool}
          drawingMode={pointer.drawingMode}
          lineWidth={pointer.lineWidth}
          selectionMode={pointer.selectionMode}
          brushHasColor={pointer.brushHasColor}
          brushOpacity={pointer.brushOpacity}
          blendStrength={pointer.blendStrength}
          mixRatio={pointer.mixRatio}
          zoom={zoom}
          rotation={rotation}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          actualZoom={actualZoom}
          maintainAspectRatio={maintainAspectRatio}
          resizeMode={resizeMode}
          setDrawingMode={pointer.setDrawingMode}
          setLineWidth={pointer.setLineWidth}
          setSelectionMode={pointer.setSelectionMode}
          setBrushHasColor={pointer.setBrushHasColor}
          setBrushOpacity={pointer.setBrushOpacity}
          setBlendStrength={pointer.setBlendStrength}
          setMixRatio={pointer.setMixRatio}
          setZoom={setZoom}
          setRotation={setRotation}
          setCanvasSize={handleCanvasSizeChange}
          setMaintainAspectRatio={setMaintainAspectRatio}
          setResizeMode={setResizeMode}
          layoutDirection={layoutDirection}
        />
        
        <ColorProperties
          color={pointer.color}
          setColor={pointer.setColor}
          layoutDirection={layoutDirection}
        />
        
        <ActionProperties
          handlers={actionHandlers}
          mode={menuMode === 'selection' ? 'hidden' : 'global'}
          isFloating={false}
          layoutDirection={layoutDirection}
        />
      </div>
      
      <div className="flex flex-1 w-full h-full items-center justify-center overflow-auto bg-secondary relative" ref={containerRef}>
        <Canvas
          pointer={pointer}
          view={view}
          zoom={zoom}
          rotation={rotation}
          containerRef={containerRef}
          selectionState={selectionState}
          canvasSize={canvasSize}
          onActualZoomChange={setActualZoom}
          onSelectionStart={handleSelectionStart}
          onSelectionUpdate={handleSelectionUpdate}
          onSelectionEnd={handleSelectionEnd}
        />
        
        {menuMode === 'selection' && (
          <ActionProperties
            handlers={actionHandlers}
            mode={menuMode}
            position={menuPos}
            isFloating={true}
          />
        )}

        {editRect && (
          <TransformEditOverlay
            rect={editRect}
            layers={layers}
            currentLayerIndex={currentLayerIndex}
            onFinish={finishEdit}
          />
        )}
      </div>
    </div>
  );
}
