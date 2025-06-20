import { Modal, App, Setting, FuzzySuggestModal, TFolder } from 'obsidian';
import { Layer } from '../../types/painter-types';
import { loadExportSettings, updateExportSettings } from '../../storage/export-settings';
import { t } from '../../constants/obsidian-i18n';
import { useLayersStore } from '../../storage/layers-store';

function createPreviewCanvas(layers: Layer[]): HTMLCanvasElement {
  if (!layers || layers.length === 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    return canvas;
  }

  const first = layers[0];
  const width = first.canvas?.width || 800;
  const height = first.canvas?.height || 600;

  const composite = document.createElement('canvas');
  composite.width = width;
  composite.height = height;
  const ctx = composite.getContext('2d');
  if (!ctx) return composite;

  ctx.clearRect(0, 0, width, height);

  for (const layer of layers) {
    if (layer.visible && layer.canvas) {
      ctx.globalAlpha = layer.opacity || 1;
      ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode as GlobalCompositeOperation;
      ctx.drawImage(layer.canvas as HTMLCanvasElement, 0, 0);
    }
  }

  return composite;
}

class FolderSelectorModal extends FuzzySuggestModal<TFolder> {
  private onSelect: (folder: TFolder) => void;

  constructor(app: App, onSelect: (folder: TFolder) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  getItems(): TFolder[] {
    return this.app.vault.getAllLoadedFiles()
      .filter(file => file instanceof TFolder) as TFolder[];
  }

  getItemText(folder: TFolder): string {
    return folder.path || t('EXPORT_FOLDER_ROOT');
  }

  onChooseItem(folder: TFolder): void {
    this.onSelect(folder);
  }
}

export class ExportModal extends Modal {
  private layers: Layer[];
  private onExport: (folderPath: string, fileName: string) => Promise<void>;
  private selectedFolder: string = '';
  private fileName: string = '';
  private plugin: any;

  constructor(
    app: App,
    plugin: any,
    layers: Layer[], 
    onExport: (folderPath: string, fileName: string) => Promise<void>
  ) {
    super(app);
    this.plugin = plugin;
    this.layers = layers;
    this.onExport = onExport;
    
    // Use current PSD file name without extension
    const activeFile = app.workspace.getActiveFile();
    this.fileName = activeFile?.basename || '';
    
    // Load settings
    this.loadSettings();
  }

  private async loadSettings() {
    const settings = await loadExportSettings(this.plugin);
    this.selectedFolder = settings.customFolderPath;
  }

  async onOpen() {
    await this.loadSettings();
    this.renderContent();
  }

  private renderContent() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: t('EXPORT_MERGED_IMAGE') });
    
    const { mergedCanvas } = useLayersStore.getState();
    const previewCanvas = mergedCanvas;
    
    // Preview
    const previewContainer = contentEl.createDiv();
    previewContainer.style.textAlign = 'center';
    previewContainer.style.marginBottom = '16px';
    previewContainer.style.border = '1px solid var(--background-modifier-border)';
    previewContainer.style.padding = '8px';
    
    const displayCanvas = contentEl.createEl('canvas');
    displayCanvas.width = Math.min(previewCanvas.width, 400);
    displayCanvas.height = Math.min(previewCanvas.height, 300);
    const displayCtx = displayCanvas.getContext('2d');
    if (displayCtx) {
      displayCtx.drawImage(previewCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
    }
    previewContainer.appendChild(displayCanvas);

    // Folder selection
    let textComponent: any;
    new Setting(contentEl)
      .setName('保存先')
      .addText(text => {
        textComponent = text;
        text.setValue(this.selectedFolder || '(ルート)');
        text.inputEl.readOnly = true;
        text.inputEl.style.cursor = 'pointer';
        
        const openFolderSelector = () => {
          new FolderSelectorModal(this.app, async (folder) => {
            this.selectedFolder = folder.path;
            await updateExportSettings(this.plugin, { customFolderPath: this.selectedFolder });
            textComponent.setValue(this.selectedFolder);
          }).open();
        };
        
        text.inputEl.addEventListener('click', openFolderSelector);
      });

    // File name input
    let fileNameComponent: any;
    new Setting(contentEl)
      .setName('ファイル名')
      .addText(text => {
        fileNameComponent = text;
        text.setValue(this.fileName);
        text.onChange(value => {
          this.fileName = value;
        });
      });

    // Export button
    new Setting(contentEl)
      .addButton(button => {
        button.setButtonText(t('EXPORT_MERGED_IMAGE'));
        button.setCta();
        button.onClick(async () => {
          await this.onExport(this.selectedFolder, this.fileName);
          this.close();
        });
      });
  }
}