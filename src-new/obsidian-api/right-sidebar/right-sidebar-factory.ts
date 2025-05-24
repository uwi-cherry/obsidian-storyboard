import { createRoot } from 'react-dom/client';
import React from 'react';
import { RightSidebarView } from './right-sidebar-view';
import RightSidebarReactView from '../../react/app/right-sidebar/Page';
import { PainterView } from '../painter/painter-view';

/**
 * Right Sidebar Factory - React Injection and View Creation
 */
export class RightSidebarFactory {
  
  createRightSidebarView(leaf: any): RightSidebarView {
    const view = new RightSidebarView(leaf, () => this.renderReactComponent(view));
    return view;
  }

  private renderReactComponent(view: RightSidebarView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    
    // GlobalVariableManagerで状態管理
    view.reactRoot.render(
      React.createElement(RightSidebarReactView, { view, app: view.app })
    );
  }
}
