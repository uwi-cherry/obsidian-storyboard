import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root } from 'react-dom/client';

export const RIGHT_SIDEBAR_VIEW_TYPE = 'right-sidebar-view';

/**
 * Right Sidebar View - Basic Obsidian ItemView
 */
export class RightSidebarView extends ItemView {
  public reactRoot?: Root;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return RIGHT_SIDEBAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Right Sidebar';
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass('right-sidebar');
    // React注入はファクトリで行う
  }

  async onClose(): Promise<void> {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = undefined;
    }
  }
} 