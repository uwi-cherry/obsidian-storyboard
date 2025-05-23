import { FileView } from 'obsidian';
import { Root } from 'react-dom/client';

const TIMELINE_VIEW_TYPE = 'timeline-view';

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

  async onOpen(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }

  async onClose(): Promise<void> {
    // ファクトリによってオーバーライドされる
  }
} 