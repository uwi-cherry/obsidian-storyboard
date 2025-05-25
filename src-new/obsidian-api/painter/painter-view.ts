import { FileView, TFile } from 'obsidian';
import { Root } from 'react-dom/client';
import { t } from '../../constants/obsidian-i18n';
import { toolRegistry } from '../../service-api/core/tool-registry';

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

  async onOpen(): Promise<void> {
    const redoBtn = this.addAction('arrow-right', t('REDO'), async () => {
      try {
        await toolRegistry.executeTool('redo_painter', {});
      } catch (error) {
      }
    }) as HTMLElement;
    redoBtn.querySelector('svg')?.remove();
    redoBtn.textContent = t('REDO');

    const undoBtn = this.addAction('arrow-left', t('UNDO'), async () => {
      try {
        await toolRegistry.executeTool('undo_painter', {});
      } catch (error) {
      }
    }) as HTMLElement;
    undoBtn.querySelector('svg')?.remove();
    undoBtn.textContent = t('UNDO');

    this.renderReact();
  }

  async onClose(): Promise<void> {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
} 
