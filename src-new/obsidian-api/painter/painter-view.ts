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
    
    this.renderReact();
  }

  async onOpen(): Promise<void> {
    const redoBtn = this.addAction('arrow-right', t('REDO'), async () => {
      try {
        await toolRegistry.executeTool('redo_painter', {});
        console.log('🔄 Redoボタンクリック実行完了');
      } catch (error) {
        console.error('🔄 Redoボタンエラー:', error);
      }
    }) as HTMLElement;
    redoBtn.querySelector('svg')?.remove();
    redoBtn.textContent = t('REDO');

    const undoBtn = this.addAction('arrow-left', t('UNDO'), async () => {
      try {
        await toolRegistry.executeTool('undo_painter', {});
        console.log('🔄 Undoボタンクリック実行完了');
      } catch (error) {
        console.error('🔄 Undoボタンエラー:', error);
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
