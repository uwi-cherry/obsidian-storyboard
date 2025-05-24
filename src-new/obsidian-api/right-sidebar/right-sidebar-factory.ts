import { createRoot } from 'react-dom/client';
import React from 'react';
import { RightSidebarView } from './right-sidebar-view';
import RightSidebarReactView from '../../react/app/right-sidebar/Page';
import { LayerProvider } from '../../react/context/LayerContext';
import { PainterView } from '../painter/painter-view';

/**
 * Right Sidebar Factory - React Injection and View Creation
 */
export class RightSidebarFactory {
  
  createRightSidebarView(leaf: any): RightSidebarView {
    const view = new RightSidebarView(leaf);
    this.injectReact(view);
    return view;
  }

  private injectReact(view: RightSidebarView): void {
    const originalOnOpen = view.onOpen.bind(view);
    const originalOnClose = view.onClose.bind(view);
    
    view.onOpen = async () => {
      await originalOnOpen();
      this.renderReactComponent(view);
    };
    
    view.onClose = async () => {
      if (view.reactRoot) {
        view.reactRoot.unmount();
        view.reactRoot = undefined;
      }
      await originalOnClose();
    };
  }

  private renderReactComponent(view: RightSidebarView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    
    // LayerContextで状態共有 - PainterViewの有無は関係なし
    view.reactRoot.render(
      React.createElement(
        LayerProvider,
        { 
          view: null,  // 右サイドバー独自のインスタンス
          children: React.createElement(RightSidebarReactView, { view, app: view.app })
        }
      )
    );
  }
}
