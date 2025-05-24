import { App, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { toolRegistry } from '../../service-api/core/tool-registry';
import React from 'react';
import StoryboardReactView from 'src-new/react/app/storyboard/Page';
import { t } from '../../constants/obsidian-i18n';
import { TOOL_NAMES } from '../../constants/tools-config';

const viewRoots: WeakMap<WorkspaceLeaf, Root> = new WeakMap();
const viewModes: WeakMap<WorkspaceLeaf, 'markdown' | 'storyboard'> = new WeakMap();

export class StoryboardFactory {


  injectStoryboardCapability(leaf: WorkspaceLeaf): void {
    if (!(leaf.view instanceof MarkdownView)) return;
    const view = leaf.view;
    

    if (view.file?.extension === 'storyboard') {
      viewModes.set(leaf, 'markdown');
    }
  }

  ensureStoryboardToggleButtonForLeaf(leaf: WorkspaceLeaf, app: App): void {
    if (!(leaf.view instanceof MarkdownView)) {
      return;
    }
    const view = leaf.view;
    const buttonClass = 'storyboard-toggle-button-common';

    const existingButton = view.containerEl.querySelector(`.clickable-icon.${buttonClass}`);

    if (!existingButton) {
      const newButton = view.addAction('storyboard-toggle', t('STORYBOARD_TOGGLE'), async () => {
        await this.toggleStoryboardForLeaf(leaf, app);
      }) as HTMLElement;
      newButton.classList.add(buttonClass);
    } else {
    }
  }

  async toggleStoryboardForLeaf(leaf: WorkspaceLeaf, app: App): Promise<void> {
    const fileName = (leaf.view instanceof MarkdownView) ? leaf.view.file?.name : 'unknown';
    try {
      const result = await toolRegistry.executeTool(TOOL_NAMES.TOGGLE_STORYBOARD_VIEW, {
        app,
        leaf,
        factory: this
      });
    } catch (error) {


    }
  }

  async createSampleStoryboardFile(app: App): Promise<any> {
    try {
      const result = await toolRegistry.executeTool(TOOL_NAMES.CREATE_STORYBOARD_FILE, { app });
      return result;
    } catch (error) {
      return null;
    }
  }

  async switchToStoryboardViewMode(leaf: WorkspaceLeaf, app: App): Promise<void> {
    if (!(leaf.view instanceof MarkdownView)) return;
    const view = leaf.view;
    const file = view.file;
    if (!file) return;

    viewModes.set(leaf, 'storyboard');

    const contentEl = view.contentEl;
    Array.from(contentEl.children).forEach(child => (child as HTMLElement).style.display = 'none');
    
    await this.renderReactComponent(view, leaf, app);
  }

  switchToMarkdownViewMode(leaf: WorkspaceLeaf): void {
    if (!(leaf.view instanceof MarkdownView)) return;
    const view = leaf.view;

    viewModes.set(leaf, 'markdown');

    this.cleanupViewRoot(leaf);

    const contentEl = view.contentEl;
    const storyboardContainer = contentEl.querySelector('.storyboard-view-container');
    if (storyboardContainer) {
      storyboardContainer.remove();
    }
    Array.from(contentEl.children).forEach(child => (child as HTMLElement).style.display = '');
    
    view.previewMode.rerender(true);
  }

  private async renderReactComponent(view: MarkdownView, leaf: WorkspaceLeaf, app: App): Promise<void> {
    this.cleanupViewRoot(leaf);
    
    const contentEl = view.contentEl;
    const storyboardContainer = contentEl.createDiv({ cls: 'storyboard-view-container h-full overflow-auto' });
    
    const root = createRoot(storyboardContainer);
    viewRoots.set(leaf, root);
    
    root.render(
      React.createElement(StoryboardReactView, {
        app: app,
        file: view.file
      })
    );
  }

  private cleanupViewRoot(leaf: WorkspaceLeaf): void {
    if (viewRoots.has(leaf)) {
      viewRoots.get(leaf)?.unmount();
      viewRoots.delete(leaf);
    }
  }

  getCurrentViewMode(leaf: WorkspaceLeaf): 'markdown' | 'storyboard' {
    return viewModes.get(leaf) || 'markdown';
  }

  cleanupStoryboardViewRoots(app: App): void {
    app.workspace.getLeavesOfType('markdown').forEach(leaf => {
      this.cleanupViewRoot(leaf);
      viewModes.delete(leaf);
    });
  }
} 