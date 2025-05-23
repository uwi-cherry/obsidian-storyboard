import { Plugin, addIcon, App, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import React from 'react';
import StoryboardReactView from '../../react/StoryboardReactView';

const viewRoots: WeakMap<WorkspaceLeaf, Root> = new WeakMap();
const viewModes: WeakMap<WorkspaceLeaf, 'markdown' | 'storyboard'> = new WeakMap();

/**
 * Storyboard Factory - Markdown View Integration
 */
export class StoryboardPlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    addIcon('storyboard', this.getStoryboardIcon());
    this.plugin.registerExtensions(['storyboard'], 'markdown');
    
    this.plugin.addRibbonIcon('storyboard', 'Add Storyboard', () => {
      // サービスAPIが処理
    });
    
    this.plugin.register(() => {
      cleanupStoryboardViewRoots(this.plugin.app);
    });
  }

  private getStoryboardIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M7 7h10M7 12h10M7 17h10"/>
      <circle cx="5" cy="7" r="1"/>
      <circle cx="5" cy="12" r="1"/>
      <circle cx="5" cy="17" r="1"/>
    </svg>`;
  }
}

export async function switchToStoryboardViewMode(leaf: WorkspaceLeaf, app: App): Promise<void> {
  if (!(leaf.view instanceof MarkdownView)) return;
  const view = leaf.view;
  const file = view.file;
  if (!file) return;

  viewModes.set(leaf, 'storyboard');

  const contentEl = view.contentEl;
  Array.from(contentEl.children).forEach(child => (child as HTMLElement).style.display = 'none');
  
  const storyboardContainer = contentEl.createDiv({ cls: 'storyboard-view-container h-full overflow-auto' });
  
  let root = viewRoots.get(leaf);
  if (root) {
    root.unmount();
  }
  root = createRoot(storyboardContainer);
  viewRoots.set(leaf, root);
  
  const handleDataChange = async (updatedData: any) => {
    // データ変更処理
    console.log('Storyboard data changed:', updatedData);
  };

  root.render(
    React.createElement(StoryboardReactView, {
      initialData: { scenes: [], characters: [] },
      onDataChange: handleDataChange
    })
  );
}

export function switchToMarkdownViewMode(leaf: WorkspaceLeaf): void {
  if (!(leaf.view instanceof MarkdownView)) return;
  const view = leaf.view;

  viewModes.set(leaf, 'markdown');

  if (viewRoots.has(leaf)) {
    viewRoots.get(leaf)?.unmount();
    viewRoots.delete(leaf);
  }

  const contentEl = view.contentEl;
  const storyboardContainer = contentEl.querySelector('.storyboard-view-container');
  if (storyboardContainer) {
    storyboardContainer.remove();
  }
  Array.from(contentEl.children).forEach(child => (child as HTMLElement).style.display = '');
  
  view.previewMode.rerender(true);
}

export function getCurrentViewMode(leaf: WorkspaceLeaf): 'markdown' | 'storyboard' {
  return viewModes.get(leaf) || 'markdown';
}

export function cleanupStoryboardViewRoots(app: App): void {
  app.workspace.getLeavesOfType('markdown').forEach(leaf => {
    if (viewRoots.has(leaf)) {
      viewRoots.get(leaf)?.unmount();
      viewRoots.delete(leaf);
      viewModes.delete(leaf);
    }
  });
} 