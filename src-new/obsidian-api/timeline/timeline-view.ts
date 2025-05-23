import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';

export const TIMELINE_VIEW_TYPE = 'timeline-view';

/**
 * Timeline View - Basic Obsidian View
 */
export class TimelineView extends FileView {
  public reactRoot: Root | null = null;

  getViewType(): string {
    return TIMELINE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename || 'Timeline';
  }

  async onLoadFile(): Promise<void> {
    // ファクトリによってReactが注入される
  }

  async onOpen(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }

  async onClose(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }
} 