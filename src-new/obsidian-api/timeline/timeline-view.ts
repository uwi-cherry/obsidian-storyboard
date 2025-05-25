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
    
    if (!state.file) {
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(state.file);
    if (!(file instanceof TFile)) {
      return;
    }

    this.file = file;
    
    this.renderReact();
  }

  async onClose(): Promise<void> {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
} 
