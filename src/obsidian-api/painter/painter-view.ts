import { FileView, TFile, WorkspaceLeaf, Menu } from 'obsidian';
import { Root } from 'react-dom/client';
import { t } from '../../constants/obsidian-i18n';
import { toolRegistry } from '../../service-api/core/tool-registry';
import { setDisplayText } from '../utils/view-title-updater';

export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public renderReact: () => void;

  constructor(leaf: WorkspaceLeaf, renderReact: () => void) {
    super(leaf);
    this.renderReact = renderReact;
  }

  getViewType(): string {
    return 'psd-view';
  }

  getDisplayText(): string {
    return this.file?.basename || 'Untitled';
  }

  updateTitle(canvasWidth?: number, canvasHeight?: number, zoom?: number): void {
    if (!this.file) return;
    
    let title = this.file.basename;
    
    if (canvasWidth && canvasHeight) {
      title += ` (${canvasWidth}x${canvasHeight})`;
    }
    
    if (zoom) {
      title += ` ${zoom}%`;
    }
    
    setDisplayText(this, title);
  }

  getState(): { file: string | null } {
    return {
      file: this.file?.path ?? null
    };
  }

  async setState(state: { file: string | null }) {
    const editBtn = this.addAction('', t('EDIT_MENU'), async (evt) => {
      const menu = new Menu();
      menu.addItem((item) =>
        item.setTitle(t('UNDO')).onClick(async () => {
          try {
            await toolRegistry.executeTool('undo_painter', {});
          } catch (error) {
            console.error(error);
          }
        })
      );
      menu.addItem((item) =>
        item.setTitle(t('REDO')).onClick(async () => {
          try {
            await toolRegistry.executeTool('redo_painter', {});
          } catch (error) {
            console.error(error);
          }
        })
      );
      menu.showAtMouseEvent(evt);
    }) as HTMLElement;
    editBtn.querySelector('svg')?.remove();
    editBtn.textContent = t('EDIT_MENU');

    const fileBtn = this.addAction('', t('EXPORT_MERGED_IMAGE'), async (evt) => {
      // TODO: implement export logic
    }) as HTMLElement;
    fileBtn.querySelector('svg')?.remove();
    fileBtn.textContent = t('FILE_MENU');

    if (!state.file) {
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(state.file);
    if (!(file instanceof TFile)) {
      return;
    }

    this.file = file;
    
    // タイトルを更新（ファイル名 + サイズ + 拡大率）
    this.updateTitle();
    
    this.renderReact();
  }

  async onClose(): Promise<void> {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
} 
