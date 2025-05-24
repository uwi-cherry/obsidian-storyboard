import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';

/**
 * Painter View - Basic Obsidian View
 */
export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public renderReact: () => void;

  constructor(leaf: any, renderReact: () => void) {
    super(leaf);
    this.renderReact = renderReact;
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
} 