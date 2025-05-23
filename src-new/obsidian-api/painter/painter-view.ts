import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public layers: any[] = [];
  public currentLayerIndex = 0;
  public setLayers?: Dispatch<SetStateAction<any[]>>;
  public setCurrentLayerIndex?: Dispatch<SetStateAction<number>>;

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
} 