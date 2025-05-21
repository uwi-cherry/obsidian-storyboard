import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { OTIO_VIEW_TYPE, OTIO_ICON } from '../../constants';
import { loadOtioFile, saveOtioFile } from '../timeline-files';
import { OtioProject } from '../timeline-types';
import TimelineReactView from './TimelineReactView';

export class TimelineView extends ItemView {
    private reactRoot?: Root;
    private project: OtioProject | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
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
        this.project = await loadOtioFile(this.app, file);
        if (!this.reactRoot) {
            this.reactRoot = createRoot(this.contentEl);
        }
        const handleChange = async (proj: OtioProject) => {
            if (this.file) {
                await saveOtioFile(this.app, this.file, proj);
                this.project = proj;
            }
        };
        this.reactRoot.render(
            React.createElement(TimelineReactView, { project: this.project, onProjectChange: handleChange })
        );
    }

    async onOpen() {
        if (this.file) {
            await this.openFile(this.file);
        }
    }

    async onClose() {
        this.reactRoot?.unmount();
        this.reactRoot = undefined;
    }
}

export function createTimelineView(leaf: WorkspaceLeaf): TimelineView {
    return new TimelineView(leaf);
}
