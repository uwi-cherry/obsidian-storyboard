import { Plugin, addIcon } from 'obsidian';
import { createRoot } from 'react-dom/client';
import React from 'react';
import PainterReactView from '../../react/PainterReactView';
import { PainterView } from './painter-view';

/**
 * Painter Factory - React Injection
 */
export class PainterPlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    addIcon('palette', this.getPainterIcon());
    this.plugin.registerView('psd-view', (leaf) => this.createPainterView(leaf));
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

  private createPainterView(leaf: any): PainterView {
    const view = new PainterView(leaf);
    this.injectReact(view);
    return view;
  }

  private injectReact(view: PainterView): void {
    const originalOnOpen = view.onOpen.bind(view);
    const originalOnClose = view.onClose.bind(view);
    
    view.onOpen = async () => {
      await originalOnOpen();
      this.renderReactComponent(view);
    };
    
    view.onClose = async () => {
      if (view.reactRoot) {
        view.reactRoot.unmount();
        view.reactRoot = null;
      }
      await originalOnClose();
    };
  }

  private renderReactComponent(view: PainterView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    view.reactRoot.render(React.createElement(PainterReactView, {
      layers: [],
      currentLayer: 0,
      onLayerChange: () => {}
    }));
  }

  private getPainterIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  }
} 