import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import type { SelectionRect } from '../../../types/ui';
import { PainterPointer } from 'src/hooks/usePainterPointer';
import useSelectionState from 'src/hooks/useSelectionState';
import { useLayersStore } from 'src/storage/layers-store';
import { usePainterLayoutStore } from 'src/storage/painter-layout-store';
import { useCurrentLayerIndexStore } from 'src/store/current-layer-index-store';
import { usePainterHistoryStore } from 'src/store/painter-history-store';
import { PainterView } from 'src/types/painter-types';
import { toolRegistry } from 'src/service/core/tool-registry';
import { useChatAttachmentsStore } from 'src/store/chat-attachments-store';
import ActionProperties from '../edit/ActionProperties';
import ColorProperties from '../tools/ColorProperties';
import ToolProperties from '../tools/ToolProperties';
import TransformEditOverlay from '../edit/TransformEditOverlay';
import Canvas from './Canvas';

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

  // Helper function to convert data URL to Blob
  const dataURLToBlob = async (dataURL: string): Promise<Blob> => {
    const response = await fetch(dataURL);
    return response.blob();
  };

  const { layers } = useLayersStore();
  const { currentLayerIndex } = useCurrentLayerIndexStore();
  const { saveHistory } = usePainterHistoryStore();
  const { addAttachment, clearAttachments } = useChatAttachmentsStore();
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const file of Array.from(e.dataTransfer.files)) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          await toolRegistry.executeTool('add_layer', {
            name: file.name,
            fileData: arrayBuffer
          });
        } catch (error) {
          console.error(error);
        }
      }
    }
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
      try {
        // AI塗りつぶし: 既存のexport serviceを使ってキャンバスを画像として取得し、チャットボックスに送信
        
        // 1. 既存のエクスポートサービスを使ってキャンバス全体をPNG化
        const exportResult = await toolRegistry.executeTool('export_merged_image', {
          app: (window as any).app,
          layers: layers,
          fileName: `ai-fill-source-${Date.now()}.png`
        });
        
        const exportData = JSON.parse(exportResult);
        const imageFile = (window as any).app.vault.getAbstractFileByPath(exportData.filePath);
        
        if (!imageFile) {
          alert('画像の生成に失敗しました');
          return;
        }
        
        // ファイルからblob URLを作成
        const arrayBuffer = await (window as any).app.vault.readBinary(imageFile);
        const blob = new Blob([arrayBuffer], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(blob);
        
        // Base64データURLも作成（data属性用）
        const reader = new FileReader();
        reader.onload = async () => {
          const imageDataUrl = reader.result as string;
          
          // 既存の添付ファイルをクリア
          clearAttachments();
          
          // 加工元画像を追加
          addAttachment({
            type: 'image',
            url: imageUrl,
            data: imageDataUrl
          });
          
          // 2. 選択範囲があればそれをマスクとして作成
          if (selectionState.mode !== 'none') {
            const width = canvasSize.width;
            const height = canvasSize.height;
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = width;
            maskCanvas.height = height;
            const mctx = maskCanvas.getContext('2d');
            
            if (mctx) {
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
              }
              
              const maskDataUrl = maskCanvas.toDataURL('image/png');
              const maskUrl = URL.createObjectURL(await dataURLToBlob(maskDataUrl));
              
              // マスクを添付
              addAttachment({
                type: 'mask',
                url: maskUrl,
                data: maskDataUrl
              });
            }
          }
          
          // 選択状態をリセット
          selectionState.reset();
          setMenuMode('global');
          
          alert('画像とマスクをチャットボックスに送信しました。プロンプトを入力してAI生成を実行してください。');
        };
        
        reader.readAsDataURL(blob);
        
      } catch (error) {
        console.error('AI塗りつぶし処理でエラーが発生しました:', error);
        alert('画像の処理中にエラーが発生しました');
      }
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
      
      <div
        className="flex flex-1 w-full h-full items-center justify-center overflow-auto bg-secondary relative"
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent bg-opacity-10 border-2 border-dashed border-accent z-20 pointer-events-none">
            <span className="text-accent font-semibold">画像をドロップしてレイヤー追加</span>
          </div>
        )}
        
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
