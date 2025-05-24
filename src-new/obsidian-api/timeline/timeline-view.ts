import { FileView, TFile } from 'obsidian';
import { Root } from 'react-dom/client';

const TIMELINE_VIEW_TYPE = 'timeline-view';

export class TimelineView extends FileView {
  public reactRoot: Root | null = null;
  public renderReact: () => void;

  constructor(leaf: any, renderReact: () => void) {
    super(leaf);
    this.renderReact = renderReact;
  }

  getViewType(): string {
    return TIMELINE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename || 'Timeline';
  }

  getState(): { file: string | null } {
    return {
      file: this.file?.path ?? null
    };
  }

  async setState(state: { file: string | null }) {
    console.log('🔥 TimelineView: setState呼び出し - state:', state);
    
    if (!state.file) {
      console.log('🔥 TimelineView: ファイルパスが空のためリターン');
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(state.file);
    if (!(file instanceof TFile)) {
      console.log('🔥 TimelineView: ファイルが見つからないためリターン:', state.file);
      return;
    }

    console.log('🔥 TimelineView: ファイルを設定:', file.path);
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