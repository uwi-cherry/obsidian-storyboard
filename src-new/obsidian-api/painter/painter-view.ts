import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';
import type { Dispatch, SetStateAction } from 'react';
import type { Layer } from './painter-types';
import { MAX_HISTORY_SIZE, DEFAULT_COLOR } from '../../constants';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public layers: Layer[] = [];
  public currentLayerIndex = 0;
  public setLayers?: Dispatch<SetStateAction<any[]>>;
  public setCurrentLayerIndex?: Dispatch<SetStateAction<number>>;

  public currentTool = 'brush';
  public currentLineWidth = 5;
  public currentColor = DEFAULT_COLOR;
  public zoom = 100;
  public rotation = 0;

  // layer history for undo/redo
  private history: { layers: Layer[] }[] = [];
  private historyIndex = -1;

  getViewType(): string {
    return 'psd-view';
  }

  getDisplayText(): string {
    return this.file?.basename || 'Painter';
  }

  async onOpen(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }

  async onClose(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }

  /** 履歴に現在のレイヤー状態を保存 */
  saveHistory(): void {
    const snapshot = this.layers.map(layer => {
      const c = document.createElement('canvas');
      c.width = layer.canvas.width;
      c.height = layer.canvas.height;
      const ctx = c.getContext('2d');
      if (ctx) ctx.drawImage(layer.canvas, 0, 0);
      return { ...layer, canvas: c } as Layer;
    });
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ layers: snapshot });
    this.historyIndex = this.history.length - 1;
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const snapshot = this.history[this.historyIndex].layers.map(l => {
        const c = document.createElement('canvas');
        c.width = l.canvas.width;
        c.height = l.canvas.height;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(l.canvas, 0, 0);
        return { ...l, canvas: c } as Layer;
      });
      this.layers = snapshot;
      this.setLayers?.(snapshot);
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const snapshot = this.history[this.historyIndex].layers.map(l => {
        const c = document.createElement('canvas');
        c.width = l.canvas.width;
        c.height = l.canvas.height;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(l.canvas, 0, 0);
        return { ...l, canvas: c } as Layer;
      });
      this.layers = snapshot;
      this.setLayers?.(snapshot);
    }
  }
} 