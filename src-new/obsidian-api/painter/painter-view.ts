import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';
import type { Dispatch, SetStateAction } from 'react';
import { Layer } from '../../types/painter-types';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public setLayers?: Dispatch<SetStateAction<Layer[]>>;
  public setCurrentLayerIndex?: Dispatch<SetStateAction<number>>;
  public zoom = 100;
  public rotation = 0;
  public renderReact: () => void;
  
  // レイヤー情報
  public layers: Layer[] = [];
  public currentLayerIndex: number = 0;

  constructor(leaf: any, renderReact: () => void) {
    super(leaf);
    this.renderReact = renderReact;
    
    // デフォルトレイヤーを初期化
    this.initializeDefaultLayers();
  }
  
  private initializeDefaultLayers(): void {
    // デフォルトレイヤーを作成
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const defaultLayer: Layer = {
      name: 'レイヤー 1',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas: canvas
    };
    
    this.layers = [defaultLayer];
    this.currentLayerIndex = 0;
    
    console.log('🔍 PainterView: デフォルトレイヤー初期化完了');
  }

  getViewType(): string {
    return 'psd-view';
  }

  getDisplayText(): string {
    return this.file?.basename || 'Untitled';
  }

  async onOpen(): Promise<void> {
    this.renderReact();
  }

  async onClose(): Promise<void> {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
  
  // レイヤー操作メソッド
  public updateLayers(newLayers: Layer[]): void {
    this.layers = newLayers;
    console.log('🔍 PainterView: レイヤー更新:', this.layers.length);
  }
  
  public updateCurrentLayerIndex(newIndex: number): void {
    this.currentLayerIndex = newIndex;
    console.log('🔍 PainterView: 現在のレイヤーインデックス更新:', this.currentLayerIndex);
  }
  
  // ビューの再描画メソッド（将来の拡張用）
  public requestUpdate(): void {
    console.log('🔍 PainterView: 再描画リクエスト');
    // 実際の再描画処理はここに追加
  }
} 