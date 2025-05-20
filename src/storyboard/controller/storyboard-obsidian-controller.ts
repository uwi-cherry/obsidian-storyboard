import { App, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import React from 'react';

import { StoryboardData } from '../storyboard-types';
import StoryboardLayout from '../view/StoryboardReactView';
import { loadStoryboardData, saveStoryboardData } from '../storyboard-files';

const viewRoots: WeakMap<WorkspaceLeaf, Root> = new WeakMap();
const viewModes: WeakMap<WorkspaceLeaf, 'markdown' | 'storyboard'> = new WeakMap();

export async function switchToStoryboardViewMode(leaf: WorkspaceLeaf, app: App): Promise<void> {
    if (!(leaf.view instanceof MarkdownView)) return;
    const view = leaf.view;
    const file = view.file;
    if (!file) return;

    viewModes.set(leaf, 'storyboard');

    const initialData = await loadStoryboardData(file, app);

    const contentEl = view.contentEl;
    Array.from(contentEl.children).forEach(child => (child as HTMLElement).style.display = 'none');
    
    const storyboardContainer = contentEl.createDiv({ cls: 'storyboard-view-container h-full overflow-auto' });
    
    let root = viewRoots.get(leaf);
    if (root) {
        root.unmount();
    }
    root = createRoot(storyboardContainer);
    viewRoots.set(leaf, root);
    
    const handleDataChange = async (updatedData: StoryboardData) => {
        if (file) {
            await saveStoryboardData(file, app, updatedData);
        }
    };

    root.render(
        React.createElement(StoryboardLayout, {
            initialData: initialData,
            onDataChange: handleDataChange,
            app: app
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