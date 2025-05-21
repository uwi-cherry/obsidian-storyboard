import { FileView, WorkspaceLeaf, TFile, App } from 'obsidian';
import { OTIO_VIEW_TYPE, OTIO_ICON } from '../../constants';
import { OtioProject } from '../timeline-types';
import { Root, createRoot } from 'react-dom/client';
import React from 'react';
import TimelineReactView from './TimelineReactView';

export class TimelineView extends FileView {
  project: OtioProject | null = null;
  private reactRoot: Root | null = null;
  private _ops?: {
    load: (app: App, file: TFile) => Promise<OtioProject>;
    save: (app: App, file: TFile, proj: OtioProject) => Promise<void>;
    create: (app: App, name: string) => Promise<TFile>;
  };

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  setFileOperations(ops: {
    load: (app: App, file: TFile) => Promise<OtioProject>;
    save: (app: App, file: TFile, proj: OtioProject) => Promise<void>;
    create: (app: App, name: string) => Promise<TFile>;
  }) {
    this._ops = ops;
  }

  getViewType(): string {
    return OTIO_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename || 'OTIO Timeline';
  }

  getIcon(): string {
    return OTIO_ICON;
  }

  async onOpen() {
    this.contentEl.empty();
    if (this.file && this._ops) {
      this.project = await this._ops.load(this.app, this.file);
    }
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.contentEl);
    }
    this.reactRoot.render(React.createElement(TimelineReactView, { view: this }));
  }

  async onClose() {
    this.reactRoot?.unmount();
    this.reactRoot = null;
  }

  async saveProject(proj: OtioProject) {
    if (this.file && this._ops) {
      await this._ops.save(this.app, this.file, proj);
      this.project = proj;
    }
  }
}
