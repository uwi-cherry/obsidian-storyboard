import { FileView } from 'obsidian';

/**
 * ビューのタイトルを動的に更新する
 * @param view - 更新対象のFileView
 * @param title - 新しいタイトル
 */
export function setDisplayText(view: FileView, title: string): void {
  const titleEl = view.containerEl.querySelector('.view-header-title');
  if (titleEl) {
    titleEl.textContent = title;
  }
} 