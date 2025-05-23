import { Plugin } from 'obsidian';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { RightSidebarView, RIGHT_SIDEBAR_VIEW_TYPE } from './right-sidebar-view';
import SidebarReactView from '../react/SidebarReactView';

/**
 * Right Sidebar Factory - React Injection
 */
export class RightSidebarFactory {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    this.plugin.registerView(RIGHT_SIDEBAR_VIEW_TYPE, (leaf) => this.createRightSidebarView(leaf));
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType(RIGHT_SIDEBAR_VIEW_TYPE);
    });
  }

  private createRightSidebarView(leaf: any): RightSidebarView {
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
    view.reactRoot.render(React.createElement(SidebarReactView, {
      layers: [],
      currentLayerIndex: 0,
      onLayerChange: () => {}
    }));
  }
} 