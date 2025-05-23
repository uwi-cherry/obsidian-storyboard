import { Plugin, addIcon } from 'obsidian';
import { PainterFactory } from './painter-factory';

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
    
    this.plugin.addRibbonIcon('palette', 'Open Painter', () => {
      // サービスAPIが処理
    });
    
    this.plugin.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
      if (evt.ctrlKey && evt.key === 'z' && !evt.shiftKey) {
        evt.preventDefault();
        // サービスAPIが処理
      }
      if ((evt.ctrlKey && evt.shiftKey && evt.key === 'z') || (evt.ctrlKey && evt.key === 'y')) {
        evt.preventDefault();
        // サービスAPIが処理
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