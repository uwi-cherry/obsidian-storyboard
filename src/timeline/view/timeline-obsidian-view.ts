import { FileView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { OTIO_VIEW_TYPE, OTIO_ICON } from '../../constants';
import { OtioProject } from '../timeline-types';
import { TimelineController } from '../controller/timeline-controller';
import TimelineReactView from './TimelineReactView';

export class TimelineView extends FileView {
    private reactRoot?: Root;
    private project: OtioProject | null = null;
    private controller: TimelineController;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.controller = new TimelineController();
    }

    getViewType(): string {
        return OTIO_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.file?.basename ?? 'Timeline';
    }

    getIcon(): string {
        return OTIO_ICON;
    }

    getState(): { file: string | null } {
        return { file: this.file?.path ?? null };
    }

    async setState(state: { file: string | null }): Promise<void> {
        if (!state.file) return;
        const file = this.app.vault.getAbstractFileByPath(state.file);
        if (file instanceof TFile) {
            this.file = file;
            await this.openFile(file);
        }
    }

    async openFile(file: TFile) {
        this.project = await this.controller.load(this.app, file);
        if (!this.reactRoot) {
            this.reactRoot = createRoot(this.contentEl);
        }
        const handleChange = async (proj: OtioProject) => {
            if (this.file) {
                await this.controller.save(this.app, this.file, proj);
                this.project = proj;
            }
        };
        this.reactRoot.render(
            React.createElement(TimelineReactView, {
                project: this.project,
                onProjectChange: handleChange,
                controller: this.controller
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
