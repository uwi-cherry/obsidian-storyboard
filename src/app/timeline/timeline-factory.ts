import { createRoot } from 'react-dom/client';
import React from 'react';
import TimelineReactView from '../../components/timeline/Page';
import { TimelineView } from './timeline-view';
import type { WorkspaceLeaf } from 'obsidian';

export class TimelineFactory {
  
  createTimelineView(leaf: WorkspaceLeaf): TimelineView {
    const view = new TimelineView(leaf, () => this.renderReactComponent(view));
    return view;
  }

  private renderReactComponent(view: TimelineView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    view.reactRoot.render(
      React.createElement(TimelineReactView, {
        app: view.app,
        file: view.file
      })
    );
  }
}
