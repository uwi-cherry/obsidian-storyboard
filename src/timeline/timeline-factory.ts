import { WorkspaceLeaf, TFile, App } from 'obsidian';
import { loadOtioFile, saveOtioFile, createOtioFile } from './timeline-files';
import { TimelineView } from './view/timeline-obsidian-view';

export function createTimelineView(leaf: WorkspaceLeaf): TimelineView {
  const view = new TimelineView(leaf);
  view.setFileOperations({
    load: loadOtioFile,
    save: saveOtioFile,
    create: createOtioFile
  });
  return view;
}

export function createTimeline(app: App) {
  return createOtioFile(app, 'Untitled');
}
