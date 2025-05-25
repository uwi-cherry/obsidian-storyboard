import { createRoot } from 'react-dom/client';
import React from 'react';
import { RightSidebarView } from './right-sidebar-view';
import RightSidebarReactView from '../../react/app/right-sidebar/Page';
import { PainterView } from '../painter/painter-view';
import type { WorkspaceLeaf } from 'obsidian';

export class RightSidebarFactory {
  
  createRightSidebarView(leaf: WorkspaceLeaf): RightSidebarView {
    const view = new RightSidebarView(leaf, () => this.renderReactComponent(view));
    return view;
  }

  private renderReactComponent(view: RightSidebarView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    
    view.reactRoot.render(
      React.createElement(RightSidebarReactView, { view, app: view.app })
    );
  }
}
