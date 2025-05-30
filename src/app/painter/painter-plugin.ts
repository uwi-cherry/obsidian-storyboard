import { Plugin, addIcon, TFile } from 'obsidian';
import { PainterFactory } from './painter-factory';
import { OBSIDIAN_ICONS } from '../../constants/icons';
import { toolRegistry } from '../../service/core/tool-registry';
import { PainterView } from './painter-view';

export class PainterPlugin {
  private plugin: Plugin;
  private factory: PainterFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new PainterFactory();
  }

  initialize(): void {
    addIcon('palette', OBSIDIAN_ICONS.PAINTER_ICON_SVG);
    this.plugin.registerView('psd-view', (leaf) => this.factory.createPainterView(leaf));
    this.plugin.registerExtensions(['psd', 'painter'], 'psd-view');
    
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
          toolRegistry.executeTool('undo_painter', {});
        }
      }
      if ((evt.ctrlKey && evt.shiftKey && evt.key === 'z') || (evt.ctrlKey && evt.key === 'y')) {
        evt.preventDefault();
        const view = this.plugin.app.workspace.getActiveViewOfType(PainterView);
        if (view) {
          toolRegistry.executeTool('redo_painter', {});
        }
      }
    });
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType('psd-view');
    });
  }
} 
