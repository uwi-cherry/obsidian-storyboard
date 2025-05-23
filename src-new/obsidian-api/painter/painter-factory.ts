import { createRoot } from 'react-dom/client';
import React from 'react';
import { PainterView } from './painter-view';
import PainterReactView from 'src-new/react/app/painter/Page';
import { LayerProvider } from 'src-new/react/context/LayerContext';

/**
 * Painter Factory - React Injection and View Creation
 */
export class PainterFactory {
  
  createPainterView(leaf: any): PainterView {
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
    view.reactRoot.render(
      React.createElement(LayerProvider, { view, children: React.createElement(PainterReactView) })
    );
  }
}
