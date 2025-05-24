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

    // プラグイン初期化時に右サイドバーを自動で開く
    this.plugin.app.workspace.onLayoutReady(() => {
      this.activateRightSidebar();
    });
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType(RIGHT_SIDEBAR_VIEW_TYPE);
    });
  }

  private async activateRightSidebar(): Promise<void> {
    const { workspace } = this.plugin.app;
    
    let leaf = workspace.getLeavesOfType(RIGHT_SIDEBAR_VIEW_TYPE)[0];
    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: RIGHT_SIDEBAR_VIEW_TYPE, active: true });
      }
    }
    
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
} 