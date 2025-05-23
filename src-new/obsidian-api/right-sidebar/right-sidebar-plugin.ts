import { Plugin } from 'obsidian';
import { RIGHT_SIDEBAR_VIEW_TYPE } from './right-sidebar-view';
import { RightSidebarFactory } from './right-sidebar-factory';

/**
 * Right Sidebar Plugin - Obsidian Plugin Integration
 */
export class RightSidebarPlugin {
  private plugin: Plugin;
  private factory: RightSidebarFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new RightSidebarFactory();
  }

  initialize(): void {
    this.plugin.registerView(RIGHT_SIDEBAR_VIEW_TYPE, (leaf) => this.factory.createRightSidebarView(leaf));
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType(RIGHT_SIDEBAR_VIEW_TYPE);
    });
  }
} 