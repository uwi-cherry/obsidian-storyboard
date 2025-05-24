import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';
import type { Dispatch, SetStateAction } from 'react';
import { Layer } from '../../types/painter-types';
import { initializePainterDataTool } from '../../service-api/api/layer-tool/initialize-painter-data';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public setLayers?: Dispatch<SetStateAction<Layer[]>>;
  public setCurrentLayerIndex?: Dispatch<SetStateAction<number>>;
  public zoom = 100;
  public rotation = 0;

  getViewType(): string {
    return 'psd-view';
  }

  getDisplayText(): string {
    return this.file?.basename || 'Untitled';
  }

  async onOpen(): Promise<void> {
    // 初期レイヤーを作成 - service-apiのツールを使用
    await initializePainterDataTool.execute({ view: this });
    // ファクトリによってオーバーライドされる
  }

  async onClose(): Promise<void> {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
} 