import { useState, useRef, useEffect } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);

  const { layers } = useLayersStore();
  const { currentLayerIndex } = useCurrentLayerIndexStore();
  const { attachments, addAttachment, removeAttachment } = useChatAttachmentsStore();

  // Auto-transfer functions
  const transferImageFromCanvas = () => {
    const { mergedCanvas } = useLayersStore.getState();
    
    if (!mergedCanvas) return;
    
    // Remove existing i2i image attachment
    const existingI2iIndex = attachments.findIndex(att => att.type === 'image');
    if (existingI2iIndex !== -1) {
      removeAttachment(existingI2iIndex);
    }
    
    // Create new i2i image attachment
    const dataUrl = mergedCanvas.toDataURL();
    addAttachment({ 
      url: dataUrl, 
      data: dataUrl, 
      type: 'image',
      enabled: true
    });
  };
  
  const transferMaskFromSelection = () => {
    const boundingRect = selectionState.getBoundingRect();
    const selectionPath = selectionState.selectionClipPath;
    
    if (!boundingRect || !selectionPath) {
      // Remove existing mask if selection is cleared
      const existingMaskIndex = attachments.findIndex(att => att.type === 'mask');
      if (existingMaskIndex !== -1) {
        removeAttachment(existingMaskIndex);
      }
      return;
    }
    
    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvasSize.width;
    maskCanvas.height = canvasSize.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    
    // Fill with black background
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Fill selection area with white
    maskCtx.fillStyle = 'white';
    maskCtx.clip(selectionPath);
    maskCtx.fillRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
    
    // Remove existing mask attachment
    const existingMaskIndex = attachments.findIndex(att => att.type === 'mask');
    if (existingMaskIndex !== -1) {
      removeAttachment(existingMaskIndex);
    }
    
    // Create new mask attachment
    const dataUrl = maskCanvas.toDataURL();
    addAttachment({ 
      url: dataUrl, 
      data: dataUrl, 
      type: 'mask',
      enabled: true
    });
  };
  
  // Monitor layers for changes to auto-transfer i2i image
  useEffect(() => {
    transferImageFromCanvas();
  }, [layers, currentLayerIndex]);

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
    // Auto-transfer mask when selection changes
    transferMaskFromSelection();
  };

  const handleSelectionEnd = () => {
    const rect = selectionState.getBoundingRect();
    if (rect && containerRef.current) {
      const canvasEl = containerRef.current.querySelector('canvas');
      if (canvasEl) {
        const canvasRect = canvasEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const scaleX = canvasRect.width / canvasEl.width;
        const scaleY = canvasRect.height / canvasEl.height;
        const x = rect.x * scaleX + (canvasRect.left - containerRect.left);
        const y = rect.y * scaleY + (canvasRect.top - containerRect.top) - 28;
        setMenuPos({ x, y });
        setMenuMode('selection');
        return;
      }
    }
    setMenuMode('global');
  };

  const cancelSelection = () => {
    selectionState.reset();
    // setSelectionVersionは削除されたので、この行は不要
    setMenuMode('global');
  };

  const startEdit = () => {
    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const currentLayer = layersStore.layers[currentLayerIndexStore.currentLayerIndex];
    
    const boundingRect = selectionState.getBoundingRect();
    let rect = boundingRect;
    
    if (!rect && currentLayer) {
      // 選択範囲がない場合は現在のレイヤー全体を編集対象とする
      rect = { x: 0, y: 0, width: currentLayer.canvas.width, height: currentLayer.canvas.height };
    }
    
    if (!rect) {
      console.log('編集対象が見つかりません');
      return;
    }
    
    console.log('編集開始:', rect);
    setEditRect(rect);
    selectionState.reset();
    setMenuMode('hidden');
  };

  const finishEdit = () => {
    setEditRect(null);
    setMenuMode('global');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    // 外部ファイルからのドラッグ&ドロップ
    if (e.dataTransfer.files.length > 0) {
      for (const file of Array.from(e.dataTransfer.files)) {
        try {
          await toolRegistry.executeTool('add_layer', {
            name: file.name,
            fileData: file,
            width: canvasSize.width,
            height: canvasSize.height
          });
        } catch (error) {
          console.error('External file drop error:', error);
        }
      }
      return;
    }

    // Obsidianファイルツリーからのドラッグ&ドロップ
    const dragData = e.dataTransfer.getData('text/plain');
    if (dragData) {
      try {
        const app = (window as any).app;
        if (!app) {
          console.error('Obsidian app not found');
          return;
        }

        // Obsidian URIスキームをパースしてファイルパスを取得
        let filePath = dragData;
        if (dragData.startsWith('obsidian://')) {
          const url = new URL(dragData);
          const fileParam = url.searchParams.get('file');
          if (fileParam) {
            filePath = decodeURIComponent(fileParam);
          } else {
            console.error('No file parameter in Obsidian URI:', dragData);
            return;
          }
        }

        const file = app.vault.getAbstractFileByPath(filePath);
        console.log('Found file:', file, 'path:', filePath);
        
        if (!file) {
          console.error('File not found:', filePath, 'from dragData:', dragData);
          
          // ファイルが見つからない場合、ファイル一覧をデバッグ表示
          const allFiles = app.vault.getFiles();
          console.log('All files in vault:', allFiles.map((f: any) => f.path));
          return;
        }

        // 画像ファイルかチェック
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
        const extension = file.extension.toLowerCase();
        if (!imageExtensions.includes(extension)) {
          console.warn('Not an image file:', filePath);
          return;
        }

        // TFileであることを確認（型チェックを簡素化）
        if (!file.path || !file.extension) {
          console.error('Invalid file object:', file);
          return;
        }

        await toolRegistry.executeTool('add_layer', {
          name: file.name,
          imageFile: file,
          width: canvasSize.width,
          height: canvasSize.height,
          app: app
        });
        
        console.log('Successfully added layer from Obsidian file:', filePath);
      } catch (error) {
        console.error('Obsidian file drop error:', error);
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

      if (selectionState.selectionClipPath) {
        ctx.clip(selectionState.selectionClipPath);
        
        const boundingRect = selectionState.getBoundingRect();
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

      if (selectionState.selectionClipPath) {
        ctx.clip(selectionState.selectionClipPath);
        
        const boundingRect = selectionState.getBoundingRect();
        if (boundingRect) {
          ctx.clearRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else {
        ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      }

      ctx.restore();
      layersStore.updateLayers([...layers]);
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
          <div className="absolute inset-0 flex items-center justify-center bg-accent bg-opacity-10 border-2 border-dashed border-accent pointer-events-none z-50">
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
            containerRef={containerRef}
            onFinish={finishEdit}
          />
        )}
      </div>
    </div>
  );
}
