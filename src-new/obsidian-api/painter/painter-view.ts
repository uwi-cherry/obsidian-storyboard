import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';
import type { Dispatch, SetStateAction } from 'react';
import { Layer } from '../../types/painter-types';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public layers: Layer[] = [];
  public currentLayerIndex = 0;
  public setLayers?: Dispatch<SetStateAction<Layer[]>>;
  public setCurrentLayerIndex?: Dispatch<SetStateAction<number>>;
  public zoom = 100;
  public rotation = 0;
  private history: Layer[][] = [];
  private historyIndex = -1;

  getViewType(): string {
    return 'psd-view';
  }

  getDisplayText(): string {
    return this.file?.basename || 'Painter';
  }

  async onOpen(): Promise<void> {
    // 初期レイヤーを作成
    this.initializeLayers();
    // ファクトリによってオーバーライドされる
  }

  async onClose(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }

  private initializeLayers(): void {
    if (this.layers.length === 0) {
      const initialCanvas = document.createElement('canvas');
      initialCanvas.width = 800;
      initialCanvas.height = 600;
      
      this.layers = [{
        name: 'レイヤー 1',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        canvas: initialCanvas
      }];
      this.currentLayerIndex = 0;
      this.saveHistory();
    }
  }

  public saveHistory(): void {
    // 現在の位置以降の履歴を削除
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // 新しい状態を履歴に追加
    const state = this.layers.map(layer => ({
      ...layer,
      canvas: layer.canvas.cloneNode(true) as HTMLCanvasElement
    }));
    
    this.history.push(state);
    this.historyIndex++;
    
    // 履歴の制限（最大50ステップ）
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  public undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.layers = this.history[this.historyIndex].map(layer => ({
        ...layer,
        canvas: layer.canvas.cloneNode(true) as HTMLCanvasElement
      }));
      this.setLayers?.(this.layers);
      return true;
    }
    return false;
  }

  public redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.layers = this.history[this.historyIndex].map(layer => ({
        ...layer,
        canvas: layer.canvas.cloneNode(true) as HTMLCanvasElement
      }));
      this.setLayers?.(this.layers);
      return true;
    }
    return false;
  }
} 