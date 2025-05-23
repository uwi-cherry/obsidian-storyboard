import { FileView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import TimelineReactView from '../react/TimelineReactView';

export const TIMELINE_VIEW_TYPE = 'timeline-view';

export class TimelineView extends FileView {
  private reactRoot?: Root;
  private project: any = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return TIMELINE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? 'Timeline';
  }

  async openFile(file: TFile) {
    // プロジェクト初期化
    this.project = {
      name: file.basename,
      tracks: [],
      metadata: {}
    };

    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.contentEl);
    }

    const handleProjectChange = async (proj: any) => {
      this.project = proj;
      console.log('Timeline project changed:', proj);
    };

    this.reactRoot.render(
      React.createElement(TimelineReactView, {
        project: this.project,
        onProjectChange: handleProjectChange
      })
    );
  }

  async onOpen() {
    if (this.file) {
      await this.openFile(this.file);
    }
  }

  async onLoadFile(file: TFile): Promise<void> {
    await this.openFile(file);
  }

  async onUnloadFile(file: TFile): Promise<void> {
    this.reactRoot?.unmount();
    this.reactRoot = undefined;
  }

  async onClose() {
    this.reactRoot?.unmount();
    this.reactRoot = undefined;
  }
}

export function createTimelineView(leaf: WorkspaceLeaf): TimelineView {
  return new TimelineView(leaf);
} 