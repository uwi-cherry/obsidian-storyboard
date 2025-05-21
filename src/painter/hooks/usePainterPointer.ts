import { useRef, useCallback } from 'react';
import type { PainterView } from '../view/painter-obsidian-view';

/**
 * Painter のポインタイベントを管理するフック
 * @param view PainterView インスタンス
 */
export function usePainterPointer(view: PainterView) {
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const isPanning = useRef(false);
  const panLastX = useRef(0);
  const panLastY = useRef(0);

  const getXY = (e: PointerEvent) => {
    const canvas = view.canvasElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = view.zoom / 100;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handlePointerDown = useCallback((e: PointerEvent) => {
    const { x, y } = getXY(e);
    const canvas = view.canvasElement;
    if (!canvas) return;

    if (view.currentTool === 'brush' || view.currentTool === 'eraser') {
      isDrawing.current = true;
      lastX.current = x;
      lastY.current = y;
      const ctx = view.psdDataHistory[view.currentIndex].layers[view.currentLayerIndex].canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = e.pressure !== 0 ? view.currentLineWidth * e.pressure : view.currentLineWidth;
      view.saveLayerStateToHistory();
    } else if (view.currentTool === 'selection' || view.currentTool === 'lasso') {
      view.actionMenu.hide();
      view.selectionController?.onPointerDown(x, y);
      return;
    } else if (view.currentTool === 'hand') {
      isPanning.current = true;
      panLastX.current = e.clientX;
      panLastY.current = e.clientY;
      canvas.style.cursor = 'grabbing';
      return;
    }
  }, [view]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const { x, y } = getXY(e);
    const canvas = view.canvasElement;
    if (!canvas) return;

    if (view.currentTool === 'selection' || view.currentTool === 'lasso') {
      view.selectionController?.onPointerMove(x, y);
      return;
    }

    if (view.currentTool === 'hand' && isPanning.current) {
      const container = canvas.parentElement as HTMLElement | null;
      if (container) {
        container.scrollLeft -= e.clientX - panLastX.current;
        container.scrollTop -= e.clientY - panLastY.current;
      }
      panLastX.current = e.clientX;
      panLastY.current = e.clientY;
      return;
    }

    if (!isDrawing.current) return;

    const ctx = view.psdDataHistory[view.currentIndex].layers[view.currentLayerIndex].canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);
    ctx.strokeStyle = view.currentTool === 'eraser' ? 'rgba(0, 0, 0, 1)' : view.currentColor;
    ctx.lineWidth = e.pressure !== 0 ? view.currentLineWidth * e.pressure : view.currentLineWidth;
    ctx.globalCompositeOperation = view.currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    lastX.current = x;
    lastY.current = y;
    view.renderCanvas();
  }, [view]);

  const handlePointerUp = useCallback(() => {
    const canvas = view.canvasElement;
    if (!canvas) return;

    if (isDrawing.current) {
      isDrawing.current = false;
    }

    if (view.currentTool === 'hand' && isPanning.current) {
      isPanning.current = false;
      canvas.style.cursor = 'grab';
    }

    if (view.currentTool === 'selection' || view.currentTool === 'lasso') {
      const valid = view.selectionController?.onPointerUp() ?? false;
      if (valid) {
        const cancel = () => view.selectionController?.cancelSelection();
        view.actionMenu.showSelection(cancel);
      } else {
        view.actionMenu.showGlobal();
      }
      return;
    }
  }, [view]);

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

export default usePainterPointer;
