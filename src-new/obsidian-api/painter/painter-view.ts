import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;

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