import { App, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { toolRegistry } from '../../service-api/core/tool-registry';
import React from 'react';
import StoryboardReactView from 'src-new/react/app/storyboard/Page';
import { LayerProvider } from '../../react/context/LayerContext';
import { t } from '../../obsidian-i18n';

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

  /**
   * 指定されたMarkdownビューのヘッダーに絵コンテ切替ボタンがなければ追加します。
   */
  ensureStoryboardToggleButtonForLeaf(leaf: WorkspaceLeaf, app: App): void {
    if (!(leaf.view instanceof MarkdownView)) {
      console.log('ストーリーボード切替: Markdownビューではありません');
      return;
    }
    const view = leaf.view;
    const buttonClass = 'storyboard-toggle-button-common';

    const existingButton = view.containerEl.querySelector(`.clickable-icon.${buttonClass}`);

    if (!existingButton) {
      console.log('ストーリーボード切替ボタンを追加中...', view.file?.name);
      const newButton = view.addAction('storyboard-toggle', t('STORYBOARD_TOGGLE'), async () => {
        console.log('ストーリーボード切替ボタンがクリックされました:', view.file?.name);
        await this.toggleStoryboardForLeaf(leaf, app);
      }) as HTMLElement;
      newButton.classList.add(buttonClass);
      console.log('ストーリーボード切替ボタンが追加されました:', view.file?.name);
    } else {
      console.log('ストーリーボード切替ボタンは既に存在します:', view.file?.name);
    }
  }

  /**
   * 指定されたリーフの表示モードをMarkdownと絵コンテの間で切り替えます。
   */
  async toggleStoryboardForLeaf(leaf: WorkspaceLeaf, app: App): Promise<void> {
    const fileName = (leaf.view instanceof MarkdownView) ? leaf.view.file?.name : 'unknown';
    console.log('toggleStoryboardForLeaf開始:', fileName);
    try {
      const result = await toolRegistry.executeTool('toggle_storyboard_view', {
        app,
        leaf,
        factory: this
      });
      console.log('ビュー切り替え成功:', result);
    } catch (error) {
      console.error('ビュー切り替えに失敗しました:', error);
      // エラーを再スローせず、ログのみに留める
      // UIが壊れることを防ぐため
    }
  }

  /**
   * サンプルのストーリーボードファイルを作成します
   */
  async createSampleStoryboardFile(app: App): Promise<any> {
    try {
      const result = await toolRegistry.executeTool('create_storyboard_file', { app });
      console.log(result);
      return result;
    } catch (error) {
      console.error('サンプルファイルの作成に失敗しました:', error);
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
      React.createElement(
        LayerProvider,
        { 
          view: null,  // ストーリーボード独自のコンテキスト
          children: React.createElement(StoryboardReactView, {
            app: app,
            file: view.file
          })
        }
      )
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