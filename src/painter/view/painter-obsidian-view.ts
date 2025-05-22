import { FileView, TFile, WorkspaceLeaf, App } from 'obsidian';
import {
        PSD_ICON,
        PSD_VIEW_TYPE,
        DEFAULT_COLOR,
        BLEND_MODE_TO_COMPOSITE_OPERATION,
        MAX_HISTORY_SIZE
} from '../../constants';
import { Layer, PsdData } from '../painter-types';
import { t } from '../../i18n';
import type { SelectionState } from '../hooks/useSelectionState';
import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import {
  createFunctionalView,
  type FuncCtx,
  type FuncReturn,
} from '../../functional-view';
// コントローラーへの依存を避けるため型指定は行わない
import PainterReactView from './PainterReactView';
import type { LayersState } from '../hooks/useLayers';

export interface PainterProps {
  load: (app: App, file: TFile) => Promise<{ width: number; height: number; layers: Layer[] }>;
  addLayer: (app: App, file: TFile, name?: string, imageFile?: TFile) => void;
  deleteLayer: (app: App, file: TFile, index: number) => void;
}

type PainterState = { 
  file: string | null;
  currentLayerIndex: number;
  zoom: number;
  rotation: number;
  currentColor: string;
  currentLineWidth: number;
  currentTool: string;
};

const PainterViewBase = createFunctionalView<PainterProps, PainterState>(  PSD_VIEW_TYPE,  PSD_ICON,  (ctx: FuncCtx<PainterProps, PainterState>) => {    // Early setup for factory compatibility    const painterView = ctx.leaf.view as any;    if (!painterView.onLayerChanged) {      painterView.onLayerChanged = (cb: () => void) => {        if (!painterView._layerChangeCallbacks) {          painterView._layerChangeCallbacks = [];        }        painterView._layerChangeCallbacks.push(cb);      };      painterView._emitLayerChanged = () => {        if (painterView._layerChangeCallbacks) {          painterView._layerChangeCallbacks.forEach((cb: () => void) => cb());        }      };    }    // State hooks
    const [isDrawing, setIsDrawing] = ctx.useState(false);
    const [lastX, setLastX] = ctx.useState(0);
    const [lastY, setLastY] = ctx.useState(0);
    const [isPanning, setIsPanning] = ctx.useState(false);
    const [panLastX, setPanLastX] = ctx.useState(0);
    const [panLastY, setPanLastY] = ctx.useState(0);
    const [currentColor, setCurrentColor] = ctx.useState(ctx.state?.currentColor ?? DEFAULT_COLOR);
    const [currentLineWidth, setCurrentLineWidth] = ctx.useState(ctx.state?.currentLineWidth ?? 5);
    const [currentTool, setCurrentTool] = ctx.useState(ctx.state?.currentTool ?? 'brush');
    const [zoom, setZoom] = ctx.useState(ctx.state?.zoom ?? 100);
    const [rotation, setRotation] = ctx.useState(ctx.state?.rotation ?? 0);
    const [currentLayerIndex, setCurrentLayerIndex] = ctx.useState(ctx.state?.currentLayerIndex ?? 0);
    const [canvas, setCanvas] = ctx.useState<HTMLCanvasElement | undefined>(undefined);
    const [reactRoot, setReactRoot] = ctx.useState<Root | undefined>(undefined);
    const [layers, setLayers] = ctx.useState<LayersState>({
      history: [{ layers: [] }],
      currentIndex: 0,
      currentLayerIndex: 0,
      maxHistorySize: MAX_HISTORY_SIZE,
      saveHistory() {},
      undo() {},
      redo() {},
    });
    const [layerChangeCallbacks, setLayerChangeCallbacks] = ctx.useState<(() => void)[]>([]);
    const [selectionState, setSelectionState] = ctx.useState<SelectionState | null>(null);
    const [selectionController, setSelectionController] = ctx.useState<unknown>(undefined);
    const [actionMenu, setActionMenu] = ctx.useState<any>(undefined);
    const [editController, setEditController] = ctx.useState<unknown>(undefined);

    // Helper functions
    const emitLayerChanged = () => {
      layerChangeCallbacks.forEach(cb => cb());
    };

    const renderCanvas = () => {
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // チェック柄の背景を描画
      const checkSize = 10;
      canvasCtx.fillStyle = '#ffffff';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = '#e0e0e0';
      for (let y = 0; y < canvas.height; y += checkSize * 2) {
        for (let x = 0; x < canvas.width; x += checkSize * 2) {
          canvasCtx.fillRect(x + checkSize, y, checkSize, checkSize);
          canvasCtx.fillRect(x, y + checkSize, checkSize, checkSize);
        }
      }

      // 各レイヤーを上から下に向かって描画
      const currentLayers = layers.history[layers.currentIndex].layers;
      for (let i = currentLayers.length - 1; i >= 0; i--) {
        const layer = currentLayers[i];
        if (layer.visible) {
          canvasCtx.globalAlpha = layer.opacity;
          canvasCtx.globalCompositeOperation = BLEND_MODE_TO_COMPOSITE_OPERATION[layer.blendMode];
          canvasCtx.drawImage(layer.canvas, 0, 0);
          canvasCtx.globalCompositeOperation = 'source-over';
          canvasCtx.globalAlpha = 1;
        }
      }

      // 選択範囲を描画
      (selectionController as any)?.drawSelection(canvasCtx);
      emitLayerChanged();
    };

    const saveLayerStateToHistory = () => {
      layers.saveHistory();
      renderCanvas();
      emitLayerChanged();
    };

    const undo = () => {
      if (layers.currentIndex > 0) {
        setLayers({
          ...layers,
          currentIndex: layers.currentIndex - 1
        });
        renderCanvas();
        emitLayerChanged();
      }
    };

    const redo = () => {
      if (layers.currentIndex < layers.history.length - 1) {
        setLayers({
          ...layers,
          currentIndex: layers.currentIndex + 1
        });
        renderCanvas();
        emitLayerChanged();
      }
    };

    const loadAndRenderFile = async (file: TFile) => {
      const data = await ctx.props.load(ctx.app, file);
      if (canvas) {
        canvas.width = data.width;
        canvas.height = data.height;
      }

      setLayers({
        ...layers,
        history: [{ layers: data.layers }],
        currentIndex: 0,
        currentLayerIndex: 0
      });

      renderCanvas();
      emitLayerChanged();
    };

    // Pointer event handlers
    const handlePointerDown = (e: PointerEvent) => {
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scale = zoom / 100;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      if (currentTool === 'brush' || currentTool === 'eraser') {
        setIsDrawing(true);
        setLastX(x);
        setLastY(y);
        const layerCanvas = layers.history[layers.currentIndex].layers[layers.currentLayerIndex].canvas;
        const layerCtx = layerCanvas.getContext('2d');
        if (!layerCtx) return;
        layerCtx.lineWidth = e.pressure !== 0 ? currentLineWidth * e.pressure : currentLineWidth;
        saveLayerStateToHistory();
      } else if (currentTool === 'selection' || currentTool === 'lasso') {
        (actionMenu as any)?.hide();
        (selectionController as any)?.onPointerDown(x, y);
        return;
      } else if (currentTool === 'hand') {
        setIsPanning(true);
        setPanLastX(e.clientX);
        setPanLastY(e.clientY);
        if (canvas) canvas.style.cursor = 'grabbing';
        return;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scale = zoom / 100;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      if (currentTool === 'selection' || currentTool === 'lasso') {
        (selectionController as any)?.onPointerMove(x, y);
        return;
      }

      if (currentTool === 'hand' && isPanning) {
        const container = canvas.parentElement as HTMLElement | null;
        if (container) {
          container.scrollLeft -= e.clientX - panLastX;
          container.scrollTop -= e.clientY - panLastY;
        }
        setPanLastX(e.clientX);
        setPanLastY(e.clientY);
        return;
      }

      if (!isDrawing) return;

      const layerCanvas = layers.history[layers.currentIndex].layers[layers.currentLayerIndex].canvas;
      const layerCtx = layerCanvas.getContext('2d');
      if (!layerCtx) return;
      layerCtx.beginPath();
      layerCtx.moveTo(lastX, lastY);
      layerCtx.lineTo(x, y);
      layerCtx.strokeStyle = currentTool === 'eraser' ? 'rgba(0, 0, 0, 1)' : currentColor;
      layerCtx.lineWidth = e.pressure !== 0 ? currentLineWidth * e.pressure : currentLineWidth;
      layerCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
      layerCtx.stroke();
      layerCtx.globalCompositeOperation = 'source-over';
      setLastX(x);
      setLastY(y);
      renderCanvas();
    };

    const handlePointerUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
      }

      if (currentTool === 'hand' && isPanning) {
        setIsPanning(false);
        if (canvas) {
          canvas.style.cursor = 'grab';
        }
      }

      if (currentTool === 'selection' || currentTool === 'lasso') {
        const valid = (selectionController as any)?.onPointerUp() ?? false;
        if (valid) {
          const cancel = () => (selectionController as any)?.cancelSelection();
          (actionMenu as any)?.showSelection(cancel);
        } else {
          (actionMenu as any)?.showGlobal();
        }
        return;
      }
    };

    const setupDragAndDrop = () => {
      ctx.root.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.root.addClass('drag-over');
      });

      ctx.root.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.root.removeClass('drag-over');
      });

      ctx.root.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.root.addClass('drag-over');
      });

      ctx.root.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.root.removeClass('drag-over');

        const items = Array.from(e.dataTransfer?.items || []);
        for (const item of items) {
          if (item.kind === 'string' && item.type === 'text/uri-list') {
            item.getAsString(async (uri: string) => {
              const match = uri.match(/file=([^&]+)/);
              if (match) {
                const fileName = decodeURIComponent(match[1]);
                const tFile = ctx.app.vault.getAbstractFileByPath(fileName);

                if (tFile instanceof TFile) {
                  const ext = tFile.extension.toLowerCase();
                  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                    if (ctx.file) {
                      ctx.props.addLayer(ctx.app, ctx.file, tFile.basename, tFile);
                    }
                  }
                }
              }
            });
          }
        }
      });
    };

    // Initialize view
    ctx.root.empty();
    ctx.root.addClass('psd-view');

    // Create React root and render
    const root = createRoot(ctx.root);
    setReactRoot(root);

    // Create view object for React component
    const viewObject = {
      _canvas: canvas,
      canvas,
      setCanvas,
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
      layers,
      setLayers,
      currentLayerIndex,
      setCurrentLayerIndex,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onLayerChanged: (cb: () => void) => {
        const newCallbacks = [...layerChangeCallbacks, cb];
        setLayerChangeCallbacks(newCallbacks);
      },
      renderCanvas,
      saveLayerStateToHistory,
      undo,
      redo,
      getCanvasSize: () => ({ width: canvas?.width ?? 0, height: canvas?.height ?? 0 }),
      deleteLayer: (index: number) => {
        if (ctx.file) {
          ctx.props.deleteLayer(ctx.app, ctx.file, index);
        }
      },
      createNewLayer: (name = t('NEW_LAYER'), imageFile?: TFile) => {
        if (ctx.file) {
          ctx.props.addLayer(ctx.app, ctx.file, name, imageFile);
        }
      },
      file: ctx.file,
      _loadAndRenderFile: loadAndRenderFile,
      selectionController,
      setSelectionController,
      _selectionController: selectionController,
      actionMenu,
      setActionMenu,
      editController,
      setEditController,
      selectionState,
      setSelectionState,
      _selectionState: selectionState,
      app: ctx.app
    };

    // Expose necessary methods on the PainterView instance for factory compatibility
    const painterView = ctx.leaf.view as any;
    painterView.onLayerChanged = viewObject.onLayerChanged;
    painterView.renderCanvas = viewObject.renderCanvas;
    painterView.layers = layers;
    painterView.currentLayerIndex = currentLayerIndex;
    painterView.currentTool = currentTool;
    painterView.currentColor = currentColor;
    painterView.currentLineWidth = currentLineWidth;
    painterView.zoom = zoom;
    painterView.rotation = rotation;
    painterView._canvas = canvas;
    painterView.createNewLayer = viewObject.createNewLayer;
    painterView.deleteLayer = viewObject.deleteLayer;
    painterView.saveLayerStateToHistory = viewObject.saveLayerStateToHistory;
    painterView.undo = viewObject.undo;
    painterView.redo = viewObject.redo;
    painterView.getCanvasSize = viewObject.getCanvasSize;
    painterView._loadAndRenderFile = viewObject._loadAndRenderFile;
    painterView.file = ctx.file;
    painterView.app = ctx.app;

    root.render(React.createElement(PainterReactView, { view: viewObject }));

    setupDragAndDrop();

    // Add header actions
    const redoBtn = ctx.root.createEl('button', { text: t('REDO') });
    redoBtn.onclick = redo;
    
    const undoBtn = ctx.root.createEl('button', { text: t('UNDO') });
    undoBtn.onclick = undo;

    return {
      cleanup: () => {
        root.unmount();
        setReactRoot(undefined);
        (actionMenu as any)?.dispose();
      },
      getState: () => ({ 
        file: ctx.file?.path ?? null,
        currentLayerIndex,
        zoom,
        rotation,
        currentColor,
        currentLineWidth,
        currentTool
      }),
      setState: async (state) => {
        if (!state.file) return;
        const file = ctx.app.vault.getAbstractFileByPath(state.file);
        if (!(file instanceof TFile)) return;
        await loadAndRenderFile(file);
        setCurrentLayerIndex(state.currentLayerIndex ?? 0);
        setZoom(state.zoom ?? 100);
        setRotation(state.rotation ?? 0);
        setCurrentColor(state.currentColor ?? DEFAULT_COLOR);
        setCurrentLineWidth(state.currentLineWidth ?? 5);
        setCurrentTool(state.currentTool ?? 'brush');
      },
    };
  },
  {
    load: async () => ({ width: 0, height: 0, layers: [] }),
    addLayer: () => {},
    deleteLayer: () => {}
  } as PainterProps
);

export const PainterView = PainterViewBase;
