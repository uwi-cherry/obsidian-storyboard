import { createRoot } from 'react-dom/client';
import React from 'react';
import { PainterView } from './painter-view';
import PainterPage from '../../react/app/painter/Page';

/**
 * Painter Factory - React Injection and View Creation
 */
export class PainterFactory {
  
  createPainterView(leaf: any): PainterView {
    const view = new PainterView(leaf, () => this.renderReactComponent(view));
    return view;
  }

  private renderReactComponent(view: PainterView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    view.reactRoot.render(
      React.createElement(PainterPage, { view, app: view.app })
    );
  }
}
