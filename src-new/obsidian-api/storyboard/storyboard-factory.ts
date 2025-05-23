import { App, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import React from 'react';
import StoryboardReactView from '../../react/app/StoryboardReactView';

const viewRoots: WeakMap<WorkspaceLeaf, Root> = new WeakMap();
const viewModes: WeakMap<WorkspaceLeaf, 'markdown' | 'storyboard'> = new WeakMap();

/**
 * Storyboard Factory - React Injection and View Mode Management
 */
export class StoryboardFactory {

  // React注入（間接的に機能を提供）
  injectStoryboardCapability(leaf: WorkspaceLeaf): void {
    if (!(leaf.view instanceof MarkdownView)) return;
    const view = leaf.view;
    
    // ストーリーボードファイルの場合、初期モードを設定
    if (view.file?.extension === 'storyboard') {
      viewModes.set(leaf, 'markdown');
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
    
    this.renderReactComponent(view, leaf);
  }

  switchToMarkdownViewMode(leaf: WorkspaceLeaf): void {
    if (!(leaf.view instanceof MarkdownView)) return;
    const view = leaf.view;

    viewModes.set(leaf, 'markdown');

    this.cleanupViewRoot(leaf);

    const contentEl = view.contentEl;
    Array.from(contentEl.children).forEach(child => (child as HTMLElement).style.display = '');
    
    view.previewMode.rerender(true);
  }

  private renderReactComponent(view: MarkdownView, leaf: WorkspaceLeaf): void {
    this.cleanupViewRoot(leaf);
    
    const root = createRoot(view.contentEl);
    viewRoots.set(leaf, root);
    
    const handleDataChange = async (updatedData: any) => {
      console.log('Storyboard data changed:', updatedData);
    };

    root.render(
      React.createElement(StoryboardReactView, {
        initialData: { scenes: [], characters: [] },
        onDataChange: handleDataChange
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