import { createRoot } from 'react-dom/client';
import React from 'react';
import { PainterView } from './painter-view';
import PainterPage from '../../react/app/painter/Page';
import type { WorkspaceLeaf } from 'obsidian';

export class PainterFactory {
  
  createPainterView(leaf: WorkspaceLeaf): PainterView {
    const view = new PainterView(leaf, () => this.renderReactComponent(view));
    return view;
  }

  private renderReactComponent(view: PainterView): void {
    view.contentEl.empty();
    view.contentEl.style.width = '100%';
    view.contentEl.style.height = '100%';
    view.contentEl.style.display = 'flex';
    view.reactRoot = createRoot(view.contentEl);
    view.reactRoot.render(
      React.createElement(PainterPage, { view, app: view.app })
    );
  }
}
