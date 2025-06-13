import { FileView, TFile, WorkspaceLeaf, Menu } from 'obsidian';
import { Root } from 'react-dom/client';
import { t } from '../../constants/obsidian-i18n';
import { toolRegistry } from '../../service/core/tool-registry';
import { setDisplayText } from '../utils/view-title-updater';
import { ExportModal } from './export-modal';
import type { PainterData } from 'src/types/painter-types';

export class PainterView extends FileView {
  public reactRoot: Root | null = null;
  public renderReact: () => void;
  public _painterData?: PainterData;
  private actionsAdded = false;
  private plugin: any;

  constructor(leaf: WorkspaceLeaf, renderReact: () => void, plugin: any) {
    super(leaf);
    this.renderReact = renderReact;
    this.plugin = plugin;
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

  async onOpen(): Promise<void> {
    if (!this.actionsAdded) {
      this.addActionButtons();
      this.actionsAdded = true;
    }
  }

  private addActionButtons(): void {
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

    const fileBtn = this.addAction('', t('EXPORT_MERGED_IMAGE'), () => {
      if (!this._painterData) return;
      this.showExportModal();
    }) as HTMLElement;
    fileBtn.querySelector('svg')?.remove();
    fileBtn.textContent = t('EXPORT_MERGED_IMAGE');
  }

  private showExportModal(): void {
    if (!this._painterData) return;

    const handleExport = async (folderPath: string, previewCanvas: HTMLCanvasElement) => {
      await toolRegistry.executeTool('export_merged_image', {
        app: this.app,
        customFolderPath: folderPath,
        previewCanvas: previewCanvas
      });
    };

    const modal = new ExportModal(this.app, this.plugin, this._painterData.layers, handleExport);
    modal.open();
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
