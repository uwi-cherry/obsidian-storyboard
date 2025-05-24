import { Plugin, addIcon, TFile } from 'obsidian';
import { PainterFactory } from './painter-factory';
import { toolRegistry } from '../../service-api/core/tool-registry';
import { PainterView } from './painter-view';

/**
 * Painter Plugin - Obsidian Plugin Integration
 */
export class PainterPlugin {
  private plugin: Plugin;
  private factory: PainterFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new PainterFactory();
  }

  initialize(): void {
    addIcon('palette', this.getPainterIcon());
    this.plugin.registerView('psd-view', (leaf) => this.factory.createPainterView(leaf));
    this.plugin.registerExtensions(['psd', 'painter'], 'psd-view');
    
    // PSDファイルを開いた時のレイヤー同期処理
    this.plugin.registerEvent(
      this.plugin.app.workspace.on('file-open', async (file) => {
        if (file instanceof TFile && file.extension === 'psd') {
          // PSDファイルが開かれたタイミングでレイヤー同期イベントを発火
          window.dispatchEvent(
            new CustomEvent('psd-file-opened', {
              detail: { file }
            })
          );
        }
      })
    );

    this.plugin.addRibbonIcon('palette', 'Open Painter', async () => {
      await toolRegistry.executeTool('create_painter_file', { app: this.plugin.app });
    });

    this.plugin.addCommand({
      id: 'add-blank-layer',
      name: 'Add Blank Layer',
      callback: async () => {
        const view = this.plugin.app.workspace.getActiveViewOfType(PainterView);
        if (view) {
          await toolRegistry.executeTool('add_layer', { view });
        }
      }
    });

    this.plugin.addCommand({
      id: 'delete-current-layer',
      name: 'Delete Current Layer',
      callback: async () => {
        const view = this.plugin.app.workspace.getActiveViewOfType(PainterView);
        if (view) {
          await toolRegistry.executeTool('delete_layer', { view, index: view.currentLayerIndex });
        }
      }
    });

    this.plugin.app.workspace.on('file-menu', (menu, file) => {
      if (file instanceof TFile && file.extension.toLowerCase().match(/^(png|jpe?g|gif|webp)$/)) {
        menu.addItem((item) => {
          item
            .setTitle('PSDで開く')
            .setIcon('image')
            .onClick(async () => {
              await toolRegistry.executeTool('create_painter_file', { app: this.plugin.app, imageFile: file });
            });
        });
      }
    });
    
    this.plugin.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
      if (evt.ctrlKey && evt.key === 'z' && !evt.shiftKey) {
        evt.preventDefault();
        const view = this.plugin.app.workspace.getActiveViewOfType(PainterView);
        if (view) {
          toolRegistry.executeTool('undo_painter', { view });
        }
      }
      if ((evt.ctrlKey && evt.shiftKey && evt.key === 'z') || (evt.ctrlKey && evt.key === 'y')) {
        evt.preventDefault();
        const view = this.plugin.app.workspace.getActiveViewOfType(PainterView);
        if (view) {
          toolRegistry.executeTool('redo_painter', { view });
        }
      }
    });
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType('psd-view');
    });
  }

  private getPainterIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  }
} 