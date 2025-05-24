import { FileView, TFile } from 'obsidian';
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

  getState(): { file: string | null } {
    return {
      file: this.file?.path ?? null
    };
  }

  async setState(state: { file: string | null }) {
    console.log('🔥 PainterView: setState呼び出し - state:', state);
    
    if (!state.file) {
      console.log('🔥 PainterView: ファイルパスが空のためリターン');
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(state.file);
    if (!(file instanceof TFile)) {
      console.log('🔥 PainterView: ファイルが見つからないためリターン:', state.file);
      return;
    }

    console.log('🔥 PainterView: ファイルを設定:', file.path);
    this.file = file;
    
    // Reactコンポーネントを再レンダリング
    this.renderReact();
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